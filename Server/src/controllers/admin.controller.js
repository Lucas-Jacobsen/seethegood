import { createIssue } from '../services/admin.service.js';

export async function createAdminIssue(req, res, next) {
  try {
    const {
      title,
      slug,
      excerpt,
      bodyMarkdown,
      status,
      issueNumber,
    } = req.body;

    if (!title || !excerpt || !bodyMarkdown) {
      return res.status(400).json({
        message: 'Title, excerpt, and bodyMarkdown are required.',
      });
    }

    const issue = await createIssue({
      title,
      slug,
      excerpt,
      bodyMarkdown,
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