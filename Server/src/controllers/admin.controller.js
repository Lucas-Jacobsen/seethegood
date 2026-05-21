import {
  createIssue,
  getAdminIssueById,
  getAdminIssues,
  updateIssue,
} from '../services/admin.service.js';

export async function createAdminIssue(req, res, next) {
  try {
    const {
      title,
      slug,
      excerpt,
      coverImageUrl,
      bodyMarkdown,
      bodyHtml,
      status,
      issueNumber,
    } = req.body;

    if (!title || !excerpt || (!bodyMarkdown && !bodyHtml)) {
      return res.status(400).json({
        message: 'Title, excerpt, and either bodyMarkdown or bodyHtml are required.',
      });
    }

    const issue = await createIssue({
      title,
      slug,
      excerpt,
      coverImageUrl,
      bodyMarkdown,
      bodyHtml,
      status,
      issueNumber,
    });

    return res.status(201).json({
      message: 'Issue created successfully.',
      issue,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'An issue with this slug already exists.',
      });
    }

    next(error);
  }
}

export async function listAdminIssues(req, res, next) {
  try {
    const { status } = req.query;

    const issues = await getAdminIssues({ status });

    return res.status(200).json({
      issues,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminIssue(req, res, next) {
  try {
    const { id } = req.params;

    const issue = await getAdminIssueById(id);

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

export async function updateAdminIssue(req, res, next) {
  try {
    const { id } = req.params;

    const issue = await updateIssue(id, req.body);

    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found.',
      });
    }

    return res.status(200).json({
      message: 'Issue updated successfully.',
      issue,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'An issue with this slug already exists.',
      });
    }

    next(error);
  }
}