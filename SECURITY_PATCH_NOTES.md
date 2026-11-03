# Security patch 01 — November 2, 2026

## Changes

1. `POST /api/subscribe` now responds with HTTP 200 and a generic message for both new and existing addresses. It no longer returns full subscriber database records or unsubscribe tokens. Invalid email input still produces HTTP 400. This does not implement double opt-in.
2. `GET /api/unsubscribe/:token` now shows an HTML confirmation page without changing subscriber status. The confirmation form sends `POST /api/unsubscribe/:token`, which updates subscriber status and shows a confirmation page. Existing newsletter unsubscribe links remain in the same URL format. This is a manual confirmation flow; standards-based email List-Unsubscribe one-click headers are not yet implemented.
3. Removed unreachable duplicate CORS middleware registered after all routes in `Server/src/index.js`.
4. Added basic regression tests for publicly visible signup response content, token validation, and unsubscribe confirmation HTML.

## Verify

Run `cd Server && npm ci && npm test` for the tests. The checked-in tests can also run with `npm test` without dependencies installed. For the real API, configure `DATABASE_URL` and other environment variables, run Prisma migrations as appropriate, and exercise the routes against a non-production database.

### Manual API checks

- Subscribe a new address and an existing address: both should return HTTP 200 and only a generic `message` field; never `subscriber` or `unsubscribeToken`.
- Open a genuine existing unsubscribe link: it should show a confirmation button, and the database record should remain ACTIVE until the form is submitted.
- Submit the confirmation form: the record should become UNSUBSCRIBED. Repeat submissions should be harmless.
- Verify that the public website signup UI still handles HTTP 200 successfully.
- Check a test newsletter's unsubscribe link using a test subscriber.

## Outstanding security and reliability work

- **Do not treat this patch as full production hardening.** The existing issue-send controller still sends inline without a delivery ledger and can duplicate messages on retry or concurrent invocations.
- Rate limiting and bot protection, email address confirmation / double opt-in, HTML sanitization, stronger administrator authentication, and operational logs are not yet implemented.
- The `POST /api/unsubscribe/:token` endpoint is bearer-token protected by the random token. The GET confirmation page is intentionally read-only. Automated standards-based one-click unsubscribe handling should be implemented separately.
- API integration tests and full deployment checks have not been executed against a database; the tests added here are unit/regression checks.
