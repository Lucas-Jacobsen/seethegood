import prisma from '../db/prisma.js';

function createSlugFromTitle(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createIssue({
  title,
  slug,
  excerpt,
  coverImageUrl,
  bodyMarkdown,
  status = 'DRAFT',
  issueNumber,
}) {
  const normalizedTitle = title.trim();
  const normalizedSlug = slug ? createSlugFromTitle(slug) : createSlugFromTitle(normalizedTitle);
  const normalizedStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

  return prisma.issue.create({
    data: {
      title: normalizedTitle,
      slug: normalizedSlug,
      excerpt: excerpt.trim(),
      coverImageUrl: coverImageUrl ? coverImageUrl.trim() : null,
      bodyMarkdown: bodyMarkdown.trim(),
      status: normalizedStatus,
      issueNumber: issueNumber ? Number(issueNumber) : null,
      publishedAt: normalizedStatus === 'PUBLISHED' ? new Date() : null,
    },
  });
}