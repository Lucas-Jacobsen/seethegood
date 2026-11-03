// Do not distinguish existing, unsubscribed, and newly created addresses in
// public signup responses; doing so discloses subscriber membership.
export const SUBSCRIBE_SUCCESS_MESSAGE =
  'Thanks! If this address is eligible, it is on the See the Good list.';

export function isValidUnsubscribeToken(token) {
  return typeof token === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
}

export function renderUnsubscribeConfirmationPage(token, { done = false, invalid = false } = {}) {
  const heading = invalid
    ? 'Unsubscribe link unavailable'
    : done
      ? 'You have been unsubscribed'
      : 'Unsubscribe from See the Good?';
  const description = invalid
    ? 'This link is invalid or has expired.'
    : done
      ? 'You will no longer receive See the Good newsletters at this address.'
      : 'Select the button below to stop receiving our newsletters.';
  const form = !invalid && !done
    ? `<form action="/api/unsubscribe/${token}" method="POST"><button type="submit">Confirm unsubscribe</button></form>`
    : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${heading} | See the Good</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#f8f3ea;color:#243025;min-height:100vh;display:grid;place-items:center;margin:0;padding:20px;box-sizing:border-box}main{max-width:460px;background:white;padding:36px;border-radius:20px;border:1px solid #eadfce}h1{font-size:1.6rem}p{line-height:1.6}button{background:#243025;color:white;border:0;padding:14px 20px;border-radius:8px;font:inherit;cursor:pointer}</style></head><body><main><h1>${heading}</h1><p>${description}</p>${form}</main></body></html>`;
}
