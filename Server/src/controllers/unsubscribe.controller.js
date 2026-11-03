import prisma from '../db/prisma.js';

import { isValidUnsubscribeToken, renderUnsubscribeConfirmationPage } from '../utils/publicResponses.js';

// Opening links (GET) must never change subscription status.
function sendHtml(res, status, html) {
  res.set('Cache-Control', 'no-store');
  res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'");
  return res.status(status).type('html').send(html);
}

export async function showUnsubscribeConfirmation(req, res, next) {
  try {
    const { token } = req.params;
    if (!isValidUnsubscribeToken(token)) {
      return sendHtml(res, 404, renderUnsubscribeConfirmationPage('', { invalid: true }));
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true },
    });

    if (!subscriber) {
      return sendHtml(res, 404, renderUnsubscribeConfirmationPage('', { invalid: true }));
    }

    return sendHtml(res, 200, renderUnsubscribeConfirmationPage(token));
  } catch (error) {
    next(error);
  }
}

export async function unsubscribe(req, res, next) {
  try {
    const { token } = req.params;
    if (!isValidUnsubscribeToken(token)) {
      return sendHtml(res, 404, renderUnsubscribeConfirmationPage('', { invalid: true }));
    }

    const result = await prisma.subscriber.updateMany({
      where: { unsubscribeToken: token },
      data: { status: 'UNSUBSCRIBED' },
    });

    if (result.count === 0) {
      return sendHtml(res, 404, renderUnsubscribeConfirmationPage('', { invalid: true }));
    }

    return sendHtml(res, 200, renderUnsubscribeConfirmationPage(token, { done: true }));
  } catch (error) {
    next(error);
  }
}