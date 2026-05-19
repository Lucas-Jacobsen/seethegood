import {
  getPublishedIssueBySlug,
  getPublishedIssues,
} from '../services/issue.service.js';

export async function listIssues(req, res, next) {
  try {
    const issues = await getPublishedIssues();

    return res.status(200).json({
      issues,
    });
  } catch (error) {
    next(error);
  }
}

export async function getIssue(req, res, next) {
  try {
    const { slug } = req.params;

    const issue = await getPublishedIssueBySlug(slug);

    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found.',
      });
    }

    return res.status(200).json({
      issue,
    });
  } catch (error) {
    next(error);
  }
}