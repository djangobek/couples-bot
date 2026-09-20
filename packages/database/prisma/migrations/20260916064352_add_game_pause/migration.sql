-- AlterEnum
ALTER TYPE "GameSessionStatus" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "GameSession" ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "pausedByUserId" TEXT,
ADD COLUMN     "pausedFromStatus" "GameSessionStatus",
ADD COLUMN     "reconnectDeadline" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "GameSession_coupleId_finishedAt_idx" ON "GameSession"("coupleId", "finishedAt");
