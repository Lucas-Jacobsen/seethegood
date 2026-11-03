import {
  getAdminIssueById,
} from '../services/admin.service.js';
import {
  buildIssueEmailHtml,
  sendEmail,
} from '../services/email.service.js';
import { getDeliverySummary, processDeliveryChunk, startDeliveryBatch } from '../services/delivery.service.js';

export async function sendTestEmail(req, res, next) {
  try {
    const to = req.body?.to || process.env.TEST_EMAIL_TO;

    if (!to) {
      return res.status(400).json({
        message: 'No test email recipient was provided.',
      });
    }

    const data = await sendEmail({
      to,
      subject: 'See the Good test email',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>See the Good email test</h2>
          <p>This confirms that the backend email integration is working.</p>
          <p>If you received this, Render successfully sent an email through Resend.</p>
        </div>
      `,
    });

    return res.status(200).json({
      message: 'Test email sent successfully.',
      id: data?.id,
    });
  } catch (error) {
    console.error('Unexpected test email error:', error);
    next(error);
  }
}

export async function sendIssueTestEmail(req, res, next) {
  try {
    const { id } = req.params;
    const to = req.body?.to || process.env.TEST_EMAIL_TO;

    if (!to) {
      return res.status(400).json({
        message: 'No test email recipient was provided.',
      });
    }

    const issue = await getAdminIssueById(id);

    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found.',
      });
    }

    if (!issue.bodyHtml && !issue.bodyMarkdown) {
      return res.status(400).json({
        message: 'This issue does not have body content to send.',
      });
    }

    const data = await sendEmail({
      to,
      subject: `TEST: ${issue.title}`,
      html: buildIssueEmailHtml(issue, {
        isTest: true,
      }),
    });

    return res.status(200).json({
      message: 'Test issue email sent successfully.',
      id: data?.id,
      issue: {
        id: issue.id,
        title: issue.title,
        status: issue.status,
        issueNumber: issue.issueNumber,
      },
    });
  } catch (error) {
    console.error('Unexpected issue test email error:', error);
    next(error);
  }
}

export async function sendIssueToSubscribers(req, res, next) {
  try {
    if (req.body?.confirmSend !== true) {
      return res.status(400).json({ message: 'Explicit confirmSend: true is required.' });
    }
    if (req.body?.retryFailed !== undefined && typeof req.body.retryFailed !== 'boolean') {
      return res.status(400).json({ message: 'retryFailed must be boolean.' });
    }
    const issue = await getAdminIssueById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    await startDeliveryBatch(issue);
    const result = await processDeliveryChunk(issue.id, { retryFailed: req.body.retryFailed === true });
    return res.status(200).json({
      message: 'Processed a delivery chunk. Repeat to process remaining pending recipients.',
      ...result,
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
}

export async function getIssueDeliveryStatus(req, res, next) {
  try {
    const summary = await getDeliverySummary(req.params.id);
    if (!summary) return res.status(404).json({ message: 'No delivery batch found.' });
    return res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
}
