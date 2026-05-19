import prisma from '../db/prisma.js';

export async function getPublishedIssues() {
  return prisma.issue.findMany({
    where: {
      status: {
        in: ['PUBLISHED', 'SENT'],
      },
    },
    orderBy: [
      {
        publishedAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImageUrl: true,
      issueNumber: true,
      status: true,
      publishedAt: true,
      createdAt: true,
    },
  });
}

export async function getPublishedIssueBySlug(slug) {
  return prisma.issue.findFirst({
    where: {
      slug,
      status: {
        in: ['PUBLISHED', 'SENT'],
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImageUrl: true,
      bodyMarkdown: true,
      bodyHtml: true,
      issueNumber: true,
      status: true,
      publishedAt: true,
      createdAt: true,
    },
  });
}