import crypto from 'node:crypto';

export const SEND_CHUNK_SIZE = 10;
export const STALE_SENDING_MS = 15 * 60 * 1000;
export const RESEND_IDEMPOTENCY_MS = 24 * 60 * 60 * 1000;

export function idempotencyKeyFor(issueId, subscriberId) {
  return `stg-issue-${crypto.createHash('sha256').update(`${issueId}:${subscriberId}`).digest('hex')}`;
}

export function canSafelyRetry(delivery, now = new Date()) {
  return delivery.attempts === 0 || Boolean(delivery.firstAttemptAt &&
    now.getTime() - new Date(delivery.firstAttemptAt).getTime() < RESEND_IDEMPOTENCY_MS);
}
