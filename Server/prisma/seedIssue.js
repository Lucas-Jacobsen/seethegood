import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const issue = await prisma.issue.upsert({
    where: {
      slug: 'small-wins',
    },
    update: {
      title: 'Small Wins',
      excerpt: 'A few simple reminders that good is still happening.',
      bodyMarkdown: `# Small Wins

This is the first See the Good test issue.

A small win is still a win. This week, we are noticing the simple moments that remind us good is still happening.`,
      status: 'PUBLISHED',
      issueNumber: 1,
      publishedAt: new Date(),
    },
    create: {
      title: 'Small Wins',
      slug: 'small-wins',
      excerpt: 'A few simple reminders that good is still happening.',
      bodyMarkdown: `# Small Wins

This is the first See the Good test issue.

A small win is still a win. This week, we are noticing the simple moments that remind us good is still happening.`,
      status: 'PUBLISHED',
      issueNumber: 1,
      publishedAt: new Date(),
    },
  });

  console.log('Seeded issue:', issue);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });