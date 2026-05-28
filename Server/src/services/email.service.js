import { Resend } from 'resend';

let resendClient;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured on the server.');
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

function getApiPublicUrl() {
  return (process.env.API_PUBLIC_URL || 'https://seethegood-api.onrender.com').replace(/\/$/, '');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value = '') {
  return escapeHtml(value);
}

function htmlToPlainText(html = '') {
  return String(html)
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function markdownFallbackToHtml(markdown = '') {
  const paragraphs = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');

  return paragraphs || '<p>No issue body was provided.</p>';
}

function buildUnsubscribeUrl(subscriber) {
  return `${getApiPublicUrl()}/api/unsubscribe/${subscriber.unsubscribeToken}`;
}

export async function sendEmail({ to, subject, html, text }) {
  const resend = getResendClient();

  const recipients = Array.isArray(to) ? to : [to];

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'See the Good <read@seethegood.today>',
    to: recipients,
    subject,
    html,
    text: text || htmlToPlainText(html),
  });

  if (error) {
    const sendError = new Error('Resend failed to send email.');
    sendError.details = error;
    throw sendError;
  }

  return data;
}

export function buildIssueEmailHtml(issue, { subscriber, isTest = false } = {}) {
  const issueLabel = issue.issueNumber
    ? `Issue ${issue.issueNumber}`
    : 'See the Good';

  const issueBody = issue.bodyHtml || markdownFallbackToHtml(issue.bodyMarkdown || '');

  const coverImageHtml = issue.coverImageUrl
    ? `
      <img
        src="${escapeAttribute(issue.coverImageUrl)}"
        alt=""
        style="width: 100%; max-width: 640px; border-radius: 20px; margin: 24px 0;"
      />
    `
    : '';

  const footerHtml = isTest
    ? `
      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #7a6a57;">
        This is a test email sent from the See the Good admin workflow.
      </p>
    `
    : `
      <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.5; color: #7a6a57;">
        You are receiving this because you subscribed to See the Good.
      </p>

      ${
        subscriber?.unsubscribeToken
          ? `
            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #7a6a57;">
              <a href="${escapeAttribute(buildUnsubscribeUrl(subscriber))}" style="color: #7a6a57;">
                Unsubscribe
              </a>
            </p>
          `
          : ''
      }
    `;

  return `
    <!doctype html>
    <html>
      <body style="margin: 0; padding: 0; background: #f8f3ea; font-family: Arial, sans-serif; color: #243025;">
        <div style="max-width: 680px; margin: 0 auto; padding: 32px 20px;">
          <div style="background: #ffffff; border-radius: 28px; padding: 32px; border: 1px solid #eadfce;">
            <p style="margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; color: #7a6a57;">
              ${escapeHtml(issueLabel)}
            </p>

            <h1 style="margin: 0 0 16px; font-size: 34px; line-height: 1.15; color: #243025;">
              ${escapeHtml(issue.title)}
            </h1>

            ${
              issue.excerpt
                ? `<p style="margin: 0 0 20px; font-size: 17px; line-height: 1.6; color: #5d675d;">${escapeHtml(issue.excerpt)}</p>`
                : ''
            }

            ${coverImageHtml}

            <div style="font-size: 16px; line-height: 1.7; color: #243025;">
              ${issueBody}
            </div>

            <hr style="border: 0; border-top: 1px solid #eadfce; margin: 32px 0 20px;" />

            ${footerHtml}
          </div>
        </div>
      </body>
    </html>
  `;
}

export function buildIssueEmailText(issue, { subscriber, isTest = false } = {}) {
  const issueLabel = issue.issueNumber
    ? `Issue ${issue.issueNumber}`
    : 'See the Good';

  const issueBodyText = issue.bodyHtml
    ? htmlToPlainText(issue.bodyHtml)
    : issue.bodyMarkdown || 'No issue body was provided.';

  const footerText = isTest
    ? 'This is a test email sent from the See the Good admin workflow.'
    : subscriber?.unsubscribeToken
      ? `You are receiving this because you subscribed to See the Good.\n\nUnsubscribe: ${buildUnsubscribeUrl(subscriber)}`
      : 'You are receiving this because you subscribed to See the Good.';

  return [
    issueLabel,
    '',
    issue.title,
    '',
    issue.excerpt || '',
    '',
    issueBodyText,
    '',
    footerText,
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function sendIssueEmailToSubscriber({ issue, subscriber }) {
  const subject = issue.issueNumber
    ? `See the Good Issue ${issue.issueNumber}: ${issue.title}`
    : `See the Good: ${issue.title}`;

  return sendEmail({
    to: subscriber.email,
    subject,
    html: buildIssueEmailHtml(issue, {
      subscriber,
      isTest: false,
    }),
    text: buildIssueEmailText(issue, {
      subscriber,
      isTest: false,
    }),
  });
}