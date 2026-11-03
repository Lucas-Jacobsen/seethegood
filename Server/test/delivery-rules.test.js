import test from 'node:test';
import assert from 'node:assert/strict';
import { SEND_CHUNK_SIZE, idempotencyKeyFor, canSafelyRetry } from '../src/utils/deliveryRules.js';

test('each issue and recipient gets a stable unique idempotency key', () => {
  const a = idempotencyKeyFor('issue-1', 'reader-1');
  assert.equal(a, idempotencyKeyFor('issue-1', 'reader-1'));
  assert.notEqual(a, idempotencyKeyFor('issue-2', 'reader-1'));
  assert.notEqual(a, idempotencyKeyFor('issue-1', 'reader-2'));
  assert.ok(a.length <= 256);
});

test('a first attempt is eligible, but old retries are blocked', () => {
  const now = new Date('2026-11-02T18:00:00Z');
  assert.equal(canSafelyRetry({ attempts: 0, firstAttemptAt: null }, now), true);
  assert.equal(canSafelyRetry({ attempts: 1, firstAttemptAt: '2026-11-02T17:00:00Z' }, now), true);
  assert.equal(canSafelyRetry({ attempts: 1, firstAttemptAt: '2026-10-31T17:00:00Z' }, now), false);
  assert.equal(canSafelyRetry({ attempts: 1, firstAttemptAt: null }, now), false);
});

test('request chunks are bounded', () => {
  assert.equal(SEND_CHUNK_SIZE, 10);
});
