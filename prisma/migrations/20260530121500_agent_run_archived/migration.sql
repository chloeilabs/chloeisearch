-- AlterTable
ALTER TABLE "AgentRun" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AgentRun_userId_archivedAt_idx" ON "AgentRun"("userId", "archivedAt");
