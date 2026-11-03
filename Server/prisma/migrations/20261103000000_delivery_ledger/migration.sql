-- New tables only; does not modify existing subscribers or issues.
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'UNKNOWN', 'SKIPPED');
CREATE TABLE "DeliveryBatch" (
  "id" TEXT NOT NULL,
  "issueId" TEXT NOT NULL,
  "issueSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "DeliveryBatch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmailDelivery" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "subscriberId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "idempotencyKey" TEXT NOT NULL,
  "emailPayload" JSONB NOT NULL,
  "providerMessageId" TEXT,
  "lastError" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "firstAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeliveryBatch_issueId_key" ON "DeliveryBatch"("issueId");
CREATE UNIQUE INDEX "EmailDelivery_idempotencyKey_key" ON "EmailDelivery"("idempotencyKey");
CREATE UNIQUE INDEX "EmailDelivery_batchId_subscriberId_key" ON "EmailDelivery"("batchId", "subscriberId");
CREATE INDEX "EmailDelivery_batchId_status_idx" ON "EmailDelivery"("batchId", "status");
ALTER TABLE "DeliveryBatch" ADD CONSTRAINT "DeliveryBatch_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "DeliveryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
