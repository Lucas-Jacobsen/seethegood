import prisma from '../db/prisma.js';

const VALID_STATUSES = ['DRAFT', 'PUBLISHED', 'SENT', 'ARCHIVED'];

function createSlugFromTitle(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripHtml(html = '') {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeStatus(status) {
  if (!status || !VALID_STATUSES.includes(status)) {
    return 'DRAFT';
  }

  return status;
}

function normalizeIssueNumber(issueNumber) {
  if (issueNumber === undefined) {
    return undefined;
  }

  if (issueNumber === null || issueNumber === '') {
    return null;
  }

  return Number(issueNumber);
}

export async function createIssue({
  title,
  slug,
  excerpt,
  coverImageUrl,
  bodyMarkdown,
  bodyHtml,
  status = 'DRAFT',
  issueNumber,
}) {
  const normalizedTitle = title.trim();
  const normalizedSlug = slug ? createSlugFromTitle(slug) : createSlugFromTitle(normalizedTitle);
  const normalizedStatus = normalizeStatus(status);

  const cleanBodyHtml = bodyHtml ? bodyHtml.trim() : null;
  const cleanBodyMarkdown = bodyMarkdown
    ? bodyMarkdown.trim()
    : stripHtml(cleanBodyHtml || '');

  return prisma.issue.create({
    data: {
      title: normalizedTitle,
      slug: normalizedSlug,
      excerpt: excerpt.trim(),
      coverImageUrl: coverImageUrl ? coverImageUrl.trim() : null,
      bodyMarkdown: cleanBodyMarkdown,
      bodyHtml: cleanBodyHtml,
      status: normalizedStatus,
      issueNumber: normalizeIssueNumber(issueNumber),
      publishedAt: normalizedStatus === 'PUBLISHED' || normalizedStatus === 'SENT' ? new Date() : null,
    },
  });
}

export async function getAdminIssues({ status } = {}) {
  const normalizedStatus = status && VALID_STATUSES.includes(status) ? status : undefined;

  return prisma.issue.findMany({
    where: normalizedStatus
      ? {
          status: normalizedStatus,
        }
      : undefined,
    orderBy: [
      {
        updatedAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
  });
}

export async function getAdminIssueById(id) {
  return prisma.issue.findUnique({
    where: {
      id,
    },
  });
}

export async function updateIssue(
  id,
  {
    title,
    slug,
    excerpt,
    coverImageUrl,
    bodyMarkdown,
    bodyHtml,
    status,
    issueNumber,
  }
) {
  const existingIssue = await prisma.issue.findUnique({
    where: {
      id,
    },
  });

  if (!existingIssue) {
    return null;
  }

  const normalizedStatus = status ? normalizeStatus(status) : existingIssue.status;

  const cleanBodyHtml =
    bodyHtml !== undefined
      ? bodyHtml.trim() || null
      : existingIssue.bodyHtml;

  const cleanBodyMarkdown =
    bodyMarkdown !== undefined
      ? bodyMarkdown.trim() || stripHtml(cleanBodyHtml || '')
      : existingIssue.bodyMarkdown;

  const shouldSetPublishedAt =
    (normalizedStatus === 'PUBLISHED' || normalizedStatus === 'SENT') &&
    !existingIssue.publishedAt;

  return prisma.issue.update({
    where: {
      id,
    },
    data: {
      title: title !== undefined ? title.trim() : undefined,
      slug: slug !== undefined && slug.trim() ? createSlugFromTitle(slug) : undefined,
      excerpt: excerpt !== undefined ? excerpt.trim() : undefined,
      coverImageUrl:
        coverImageUrl !== undefined ? coverImageUrl.trim() || null : undefined,
      bodyMarkdown: cleanBodyMarkdown,
      bodyHtml: cleanBodyHtml,
      status: normalizedStatus,
      issueNumber: normalizeIssueNumber(issueNumber),
      publishedAt: shouldSetPublishedAt ? new Date() : undefined,
    },
  });
}
export async function markIssueAsSent(id) {
  const existingIssue = await prisma.issue.findUnique({
    where: {
      id,
    },
  });

  if (!existingIssue) {
    return null;
  }

  const now = new Date();

  return prisma.issue.update({
    where: {
      id,
    },
    data: {
      status: 'SENT',
      sentAt: now,
      publishedAt: existingIssue.publishedAt || now,
    },
  });
}