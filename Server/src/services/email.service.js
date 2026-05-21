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

function markdownFallbackToHtml(markdown = '') {
  const paragraphs = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');

  return paragraphs || '<p>No issue body was provided.</p>';
}

export async function sendEmail({ to, subject, html }) {
  const resend = getResendClient();

  const recipients = Array.isArray(to) ? to : [to];

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'See the Good <onboarding@resend.dev>',
    to: recipients,
    subject,
    html,
  });

  if (error) {
    const sendError = new Error('Resend failed to send email.');
    sendError.details = error;
    throw sendError;
  }

  return data;
}

export function buildIssueEmailHtml(issue) {
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

            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #7a6a57;">
              This is a test email sent from the See the Good admin workflow.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}