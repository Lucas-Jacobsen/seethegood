import { SEND_CHUNK_SIZE, STALE_SENDING_MS, canSafelyRetry, idempotencyKeyFor } from '../utils/deliveryRules.js';

function snapshotIssue(issue) {
  return {
    id: issue.id, title: issue.title, excerpt: issue.excerpt,
    issueNumber: issue.issueNumber, coverImageUrl: issue.coverImageUrl,
    bodyHtml: issue.bodyHtml, bodyMarkdown: issue.bodyMarkdown,
  };
}

/** Dependencies can be replaced by a test-only in-memory DB and fake provider. */
export function createDeliveryService({ prisma, buildIssueEmailPayload, sendPreparedIssueEmail }) {
  async function startDeliveryBatch(issue) {
    const existing = await prisma.deliveryBatch.findUnique({ where: { issueId: issue.id } });
    if (existing) return existing;
    if (issue.status !== 'PUBLISHED') {
      const error = new Error('Only published issues can start a delivery batch.');
      error.statusCode = 409;
      throw error;
    }
    if (!issue.bodyHtml && !issue.bodyMarkdown) {
      const error = new Error('The issue has no email body.');
      error.statusCode = 400;
      throw error;
    }
    try {
      return await prisma.$transaction(async (tx) => {
        const subscribers = await tx.subscriber.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, email: true, unsubscribeToken: true },
        });
        if (!subscribers.length) {
          const error = new Error('There are no active subscribers.');
          error.statusCode = 400;
          throw error;
        }
        const issueSnapshot = snapshotIssue(issue);
        // Render once, *before* creating any delivery. Sender, unsubscribe URL,
        // subject and body remain unchanged for every attempt of this delivery.
        const prepared = subscribers.map((subscriber) => ({
          subscriberId: subscriber.id,
          email: subscriber.email,
          idempotencyKey: idempotencyKeyFor(issue.id, subscriber.id),
          emailPayload: buildIssueEmailPayload(issueSnapshot, subscriber),
        }));
        const batch = await tx.deliveryBatch.create({
          data: { issueId: issue.id, issueSnapshot },
        });
        await tx.emailDelivery.createMany({
          data: prepared.map((delivery) => ({ batchId: batch.id, ...delivery })),
        });
        return batch;
      }, { timeout: 20000 });
    } catch (error) {
      if (error.code === 'P2002') {
        return prisma.deliveryBatch.findUnique({ where: { issueId: issue.id } });
      }
      throw error;
    }
  }

  async function getDeliverySummary(issueId) {
    const batch = await prisma.deliveryBatch.findUnique({
      where: { issueId },
      select: {
        id: true, createdAt: true, completedAt: true,
        deliveries: { select: { status: true } },
      },
    });
    if (!batch) return null;
    const counts = { PENDING: 0, SENDING: 0, SENT: 0, FAILED: 0, UNKNOWN: 0, SKIPPED: 0 };
    for (const { status } of batch.deliveries) counts[status]++;
    return {
      batchId: batch.id, createdAt: batch.createdAt,
      completedAt: batch.completedAt, total: batch.deliveries.length,
      counts, needsAttention: counts.UNKNOWN > 0 || counts.FAILED > 0,
      hasMore: counts.PENDING > 0,
    };
  }

  async function finalizeIfComplete(batch) {
    const outstanding = await prisma.emailDelivery.count({
      where: { batchId: batch.id, status: { notIn: ['SENT', 'SKIPPED'] } },
    });
    if (outstanding) return;
    await prisma.$transaction(async (tx) => {
      const remaining = await tx.emailDelivery.count({
        where: { batchId: batch.id, status: { notIn: ['SENT', 'SKIPPED'] } },
      });
      if (remaining) return;
      const now = new Date();
      await tx.deliveryBatch.updateMany({
        where: { id: batch.id, completedAt: null }, data: { completedAt: now },
      });
      await tx.issue.updateMany({
        where: { id: batch.issueId, status: 'PUBLISHED' },
        data: { status: 'SENT', sentAt: now },
      });
    });
  }

  async function processDeliveryChunk(issueId, { retryFailed = false } = {}) {
    const batch = await prisma.deliveryBatch.findUnique({ where: { issueId } });
    if (!batch) {
      const error = new Error('No delivery batch exists.');
      error.statusCode = 404;
      throw error;
    }
    // Preserve uncertainty: never automatically retry an interrupted request.
    await prisma.emailDelivery.updateMany({
      where: {
        batchId: batch.id, status: 'SENDING',
        startedAt: { lt: new Date(Date.now() - STALE_SENDING_MS) },
      },
      data: {
        status: 'UNKNOWN',
        lastError: 'Send interrupted; reconcile with Resend before taking action.',
      },
    });
    const eligible = retryFailed ? ['PENDING', 'FAILED'] : ['PENDING'];
    const candidates = await prisma.emailDelivery.findMany({
      where: { batchId: batch.id, status: { in: eligible } },
      orderBy: { createdAt: 'asc' }, take: SEND_CHUNK_SIZE * 3,
    });
    let processed = 0;
    for (const candidate of candidates) {
      if (processed >= SEND_CHUNK_SIZE) break;
      const previousStatus = candidate.status;
      if (!canSafelyRetry(candidate)) {
        await prisma.emailDelivery.updateMany({
          where: { id: candidate.id, status: previousStatus },
          data: {
            status: 'UNKNOWN',
            lastError: 'Idempotency window expired; manual reconciliation required.',
          },
        });
        continue;
      }
      const attemptTime = new Date();
      const claimed = await prisma.emailDelivery.updateMany({
        where: { id: candidate.id, status: previousStatus },
        data: {
          status: 'SENDING', startedAt: attemptTime,
          firstAttemptAt: candidate.attempts === 0 ? attemptTime : undefined,
          attempts: { increment: 1 }, lastError: null,
        },
      });
      if (!claimed.count) continue;
      processed++;

      // Database lookups are outside the provider error handler. A DB failure
      // leaves SENDING for stale-send reconciliation; it is not a provider error.
      const subscriber = await prisma.subscriber.findUnique({
        where: { id: candidate.subscriberId },
      });
      if (!subscriber || subscriber.status !== 'ACTIVE' || subscriber.email !== candidate.email) {
        await prisma.emailDelivery.update({
          where: { id: candidate.id },
          data: { status: 'SKIPPED', lastError: 'Subscriber no longer active.' },
        });
        continue;
      }

      let result;
      try {
        result = await sendPreparedIssueEmail({
          payload: candidate.emailPayload,
          idempotencyKey: candidate.idempotencyKey,
        });
      } catch (error) {
        const providerError = error.details;
        // Rate limit errors are confirmed API rejections; the same key and
        // persisted payload can be explicitly retried within the 24h window.
        const retryableRejection = providerError?.name === 'rate_limit_exceeded';
        await prisma.emailDelivery.update({
          where: { id: candidate.id },
          data: {
            status: retryableRejection ? 'FAILED' : 'UNKNOWN',
            lastError: String(providerError?.message || error.message || 'Unknown error').slice(0, 500),
          },
        });
        continue;
      }
      if (!result?.id) {
        await prisma.emailDelivery.update({
          where: { id: candidate.id },
          data: {
            status: 'UNKNOWN',
            lastError: 'Provider response missing message ID; reconcile manually.',
          },
        });
        continue;
      }
      // A successful provider response must not be swallowed by a DB catch.
      // If persistence fails, the record remains SENDING (or UNKNOWN after a
      // stale mark), and will NOT be automatically retried.
      await prisma.emailDelivery.updateMany({
        where: { id: candidate.id, status: { in: ['SENDING', 'UNKNOWN'] } },
        data: {
          status: 'SENT', providerMessageId: result.id,
          sentAt: new Date(), lastError: null,
        },
      });
    }
    await finalizeIfComplete(batch);
    return { processed, summary: await getDeliverySummary(issueId) };
  }

  return { startDeliveryBatch, getDeliverySummary, processDeliveryChunk };
}
