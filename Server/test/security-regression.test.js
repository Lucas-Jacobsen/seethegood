import test from 'node:test';
import assert from 'node:assert/strict';
import { SUBSCRIBE_SUCCESS_MESSAGE, isValidUnsubscribeToken, renderUnsubscribeConfirmationPage } from '../src/utils/publicResponses.js';

const validToken = '09c8e3f1-5fa0-4cf5-a498-1d9e4aa2cab3';

test('subscription acknowledgment contains no private subscriber data', () => {
  const payload = JSON.stringify({ message: SUBSCRIBE_SUCCESS_MESSAGE });
  assert.equal(Object.keys(JSON.parse(payload)).length, 1);
  assert.doesNotMatch(payload, /unsubscribeToken|subscriber|alreadySubscribed/);
});

test('unsubscribe token must be a UUID', () => {
  assert.equal(isValidUnsubscribeToken(validToken), true);
  assert.equal(isValidUnsubscribeToken('<script>alert(1)</script>'), false);
  assert.equal(isValidUnsubscribeToken('not-a-real-token'), false);
});

test('confirmation page explicitly POSTs; visiting it does not unsubscribe', () => {
  const html = renderUnsubscribeConfirmationPage(validToken);
  assert.match(html, /method="POST"/);
  assert.match(html, /Confirm unsubscribe/);
  assert.match(html, new RegExp(validToken));
  assert.doesNotMatch(html, /method="GET"/);
});

test('completed page does not include another subscription mutation form', () => {
  const html = renderUnsubscribeConfirmationPage(validToken, { done: true });
  assert.match(html, /You have been unsubscribed/);
  assert.doesNotMatch(html, /<form/);
});
