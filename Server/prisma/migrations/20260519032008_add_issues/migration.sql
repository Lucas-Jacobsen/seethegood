-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SENT', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'DRAFT',
    "issueNumber" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Issue_slug_key" ON "Issue"("slug");
