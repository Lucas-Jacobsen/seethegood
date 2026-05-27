import {
  getAdminIssueById,
  markIssueAsSent,
} from '../services/admin.service.js';
import { getActiveSubscribers } from '../services/subscriber.service.js';
import {
  buildIssueEmailHtml,
  sendEmail,
  sendIssueEmailToSubscriber,
} from '../services/email.service.js';

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
    const { id } = req.params;
    const { confirmSend } = req.body || {};

    if (confirmSend !== true) {
      return res.status(400).json({
        message: 'Subscriber send must be explicitly confirmed.',
      });
    }

    const issue = await getAdminIssueById(id);

    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found.',
      });
    }

    if (issue.status !== 'PUBLISHED') {
      return res.status(400).json({
        message: 'Only published issues can be sent to subscribers.',
      });
    }

    if (!issue.bodyHtml && !issue.bodyMarkdown) {
      return res.status(400).json({
        message: 'This issue does not have body content to send.',
      });
    }

    const subscribers = await getActiveSubscribers();

    if (subscribers.length === 0) {
      return res.status(400).json({
        message: 'There are no active subscribers to email.',
      });
    }

    const sent = [];
    const failed = [];

    for (const subscriber of subscribers) {
      try {
        const data = await sendIssueEmailToSubscriber({
          issue,
          subscriber,
        });

        sent.push({
          email: subscriber.email,
          id: data?.id,
        });
      } catch (error) {
        console.error(`Failed to send issue ${issue.id} to ${subscriber.email}:`, error);

        failed.push({
          email: subscriber.email,
          message: error.details?.message || error.message || 'Unknown send error.',
        });
      }
    }

    if (failed.length > 0) {
      return res.status(500).json({
        message: 'Some subscriber emails failed. Issue was not marked as sent.',
        sentCount: sent.length,
        failedCount: failed.length,
        failed,
      });
    }

    const updatedIssue = await markIssueAsSent(issue.id);

    return res.status(200).json({
      message: 'Issue sent to subscribers successfully.',
      sentCount: sent.length,
      issue: {
        id: updatedIssue.id,
        title: updatedIssue.title,
        status: updatedIssue.status,
        issueNumber: updatedIssue.issueNumber,
        sentAt: updatedIssue.sentAt,
      },
    });
  } catch (error) {
    console.error('Unexpected subscriber send error:', error);
    next(error);
  }
}