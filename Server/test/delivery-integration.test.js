import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeliveryService } from '../src/services/deliveryCore.js';

// Mocked database and provider: no credentials, PostgreSQL or network access.
function harness({ subscribers = 2, provider = async () => ({ id: 'msg-1' }) } = {}) {
  const audience = Array.from({ length: subscribers }, (_, i) => ({
    id: `person-${i}`, email: `user${i}@example.test`, status: 'ACTIVE',
    unsubscribeToken: `token-${i}`,
  }));
  let batch;
  const records = [];
  let issueStatus = 'PUBLISHED';
  const issued = { id: 'issue-1', status: 'PUBLISHED', title: 'Good News',
    excerpt: 'Great things', issueNumber: 1, coverImageUrl: null,
    bodyHtml: '<p>Positive news</p>', bodyMarkdown: 'Positive news' };
  let sendCount = 0;
  const sent = [];
  let nextId = 0;
  const deep = (x) => structuredClone(x);
  const matches = (record, where = {}) => Object.entries(where).every(([key, value]) => {
    if (key === 'status' && value && typeof value === 'object') {
      if (value.in) return value.in.includes(record.status);
      if (value.notIn) return !value.notIn.includes(record.status);
    }
    if (key === 'startedAt' && value?.lt) return record.startedAt < value.lt;
    return record[key] === value;
  });
  const update = (record, changes) => {
    for (const [k, v] of Object.entries(changes)) {
      if (v === undefined) continue;
      record[k] = v && typeof v === 'object' && 'increment' in v
        ? (record[k] || 0) + v.increment : v;
    }
  };
  const db = {
    $transaction: async (fn) => fn(db),
    subscriber: {
      findMany: async ({ where }) => deep(audience.filter((a) => matches(a, where))),
      findUnique: async ({ where }) => deep(audience.find((a) => a.id === where.id) || null),
    },
    deliveryBatch: {
      findUnique: async ({ where, select }) => {
        if (!batch || batch.issueId !== where.issueId) return null;
        if (select?.deliveries) return {
          ...deep(batch), deliveries: records.map((r) => ({ status: r.status })),
        };
        return deep(batch);
      },
      create: async ({ data }) => { batch = { ...deep(data), id: 'batch-1', completedAt: null, createdAt: new Date() }; return deep(batch); },
      updateMany: async ({ where, data }) => {
        if (batch && matches(batch, where)) { update(batch, data); return { count: 1 }; }
        return { count: 0 };
      },
    },
    emailDelivery: {
      createMany: async ({ data }) => {
        for (const item of data) records.push({ ...deep(item), id: `del-${++nextId}`,
          status: 'PENDING', attempts: 0, createdAt: new Date(), firstAttemptAt: null });
      },
      findMany: async ({ where, take }) => deep(records.filter((r) => matches(r, where)).slice(0, take)),
      updateMany: async ({ where, data }) => {
        const matched = records.filter((r) => matches(r, where));
        matched.forEach((r) => update(r, data));
        return { count: matched.length };
      },
      update: async ({ where, data }) => {
        const found = records.find((r) => r.id === where.id);
        if (!found) throw new Error('Missing record');
        update(found, data); return deep(found);
      },
      count: async ({ where }) => records.filter((r) => matches(r, where)).length,
    },
    issue: {
      updateMany: async ({ where, data }) => {
        if (where.id === issued.id && where.status === issueStatus) {
          issueStatus = data.status; return { count: 1 };
        }
        return { count: 0 };
      },
    },
  };
  const service = createDeliveryService({
    prisma: db,
    buildIssueEmailPayload: (issue, subscriber) => ({
      from: 'sender@example.test', to: [subscriber.email], subject: issue.title,
      html: `<p>${issue.bodyHtml}: unsubscribe/${subscriber.unsubscribeToken}</p>`,
      text: issue.bodyMarkdown,
    }),
    sendPreparedIssueEmail: async (request) => {
      sendCount++; sent.push(deep(request)); return provider(request);
    },
  });
  return {
    db, service, issued, audience, records, sent,
    get sends() { return sendCount; },
    get status() { return issueStatus; },
  };
}

test('batch persists an immutable provider payload, including unsubscribe token', async () => {
  const h = harness({ subscribers: 1 });
  await h.service.startDeliveryBatch(h.issued);
  const prepared = structuredClone(h.records[0].emailPayload);
  h.audience[0].unsubscribeToken = 'CHANGED';
  h.issued.title = 'CHANGED';
  await h.service.processDeliveryChunk(h.issued.id);
  assert.deepEqual(h.sent[0].payload, prepared);
  assert.match(h.sent[0].payload.html, /token-0/);
  assert.equal(h.records[0].status, 'SENT');
  assert.equal(h.status, 'SENT');
});

test('two concurrent chunks atomically claim a single recipient', async () => {
  let release;
  let entered;
  const enteredPromise = new Promise((resolve) => { entered = resolve; });
  const blocked = new Promise((resolve) => { release = resolve; });
  const h = harness({ subscribers: 1, provider: async () => { entered(); await blocked; return { id: 'msg-1' }; } });
  await h.service.startDeliveryBatch(h.issued);
  const first = h.service.processDeliveryChunk(h.issued.id);
  await enteredPromise;
  const second = await h.service.processDeliveryChunk(h.issued.id);
  assert.equal(second.processed, 0);
  release(); await first;
  assert.equal(h.sends, 1);
  assert.equal(h.records[0].status, 'SENT');
});

test('confirmed rate limit is retryable using identical payload and key', async () => {
  let attempt = 0;
  const h = harness({ subscribers: 1, provider: async () => {
    if (++attempt === 1) { const error = new Error('Too many requests'); error.details = { name: 'rate_limit_exceeded', message: '429' }; throw error; }
    return { id: 'msg-success' };
  } });
  await h.service.startDeliveryBatch(h.issued);
  await h.service.processDeliveryChunk(h.issued.id);
  assert.equal(h.records[0].status, 'FAILED');
  await h.service.processDeliveryChunk(h.issued.id, { retryFailed: true });
  assert.equal(h.records[0].status, 'SENT');
  assert.equal(h.sends, 2);
  assert.deepEqual(h.sent[0], h.sent[1]);
});

test('timeout becomes UNKNOWN and is not automatically retried', async () => {
  const h = harness({ subscribers: 1, provider: async () => { throw new Error('socket timeout'); } });
  await h.service.startDeliveryBatch(h.issued);
  await h.service.processDeliveryChunk(h.issued.id);
  assert.equal(h.records[0].status, 'UNKNOWN');
  await h.service.processDeliveryChunk(h.issued.id, { retryFailed: true });
  assert.equal(h.sends, 1);
  assert.equal(h.status, 'PUBLISHED');
});

test('stale in-flight delivery becomes UNKNOWN without calling provider', async () => {
  const h = harness({ subscribers: 1 });
  await h.service.startDeliveryBatch(h.issued);
  h.records[0].status = 'SENDING';
  h.records[0].startedAt = new Date(Date.now() - 60 * 60 * 1000);
  await h.service.processDeliveryChunk(h.issued.id);
  assert.equal(h.records[0].status, 'UNKNOWN');
  assert.equal(h.sends, 0);
});

test('retry beyond 24 hours is blocked and requires reconciliation', async () => {
  const h = harness({ subscribers: 1 });
  await h.service.startDeliveryBatch(h.issued);
  h.records[0].status = 'FAILED';
  h.records[0].attempts = 1;
  h.records[0].firstAttemptAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
  await h.service.processDeliveryChunk(h.issued.id, { retryFailed: true });
  assert.equal(h.records[0].status, 'UNKNOWN');
  assert.equal(h.sends, 0);
});

test('unsubscribed recipient is skipped without calling provider', async () => {
  const h = harness({ subscribers: 1 });
  await h.service.startDeliveryBatch(h.issued);
  h.audience[0].status = 'UNSUBSCRIBED';
  await h.service.processDeliveryChunk(h.issued.id);
  assert.equal(h.records[0].status, 'SKIPPED');
  assert.equal(h.sends, 0);
});
