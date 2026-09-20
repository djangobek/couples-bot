-- AlterEnum
ALTER TYPE "GameType" ADD VALUE 'TIC_TAC_TOE';

-- AlterTable
ALTER TABLE "GameMove" ADD COLUMN     "symbol" TEXT,
ALTER COLUMN "hit" SET DEFAULT false;

-- AlterTable
ALTER TABLE "GamePlayer" ADD COLUMN     "symbol" TEXT;

-- AlterTable
ALTER TABLE "GameSession" ADD COLUMN     "config" JSONB,
ALTER COLUMN "size" DROP NOT NULL,
ALTER COLUMN "bombCount" DROP NOT NULL,
ALTER COLUMN "reward" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "GameMove_sessionId_row_col_idx" ON "GameMove"("sessionId", "row", "col");

-- CreateIndex
CREATE INDEX "GameSession_type_status_createdAt_idx" ON "GameSession"("type", "status", "createdAt");
