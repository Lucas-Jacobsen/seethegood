import { Resend } from 'resend';

let resend;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured on the server.');
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

export async function sendTestEmail(req, res, next) {
  try {
    const to = req.body?.to || process.env.TEST_EMAIL_TO;

    if (!to) {
      return res.status(400).json({
        message: 'No test email recipient was provided.',
      });
    }

    const emailFrom = process.env.EMAIL_FROM || 'See the Good <onboarding@resend.dev>';

    const resendClient = getResendClient();

    const { data, error } = await resendClient.emails.send({
      from: emailFrom,
      to: [to],
      subject: 'See the Good test email',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>See the Good email test</h2>
          <p>This confirms that the backend email integration is working.</p>
          <p>If you received this, Render successfully sent an email through Resend.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend test email error:', error);

      return res.status(500).json({
        message: 'Failed to send test email.',
        error,
      });
    }

    return res.status(200).json({
      message: 'Test email sent successfully.',
      id: data?.id,
    });
  } catch (error) {
    next(error);
  }
}