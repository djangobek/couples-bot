-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('BOMB');

-- CreateEnum
CREATE TYPE "GameSessionStatus" AS ENUM ('WAITING', 'PLACING', 'PLAYING', 'FINISHED', 'ABANDONED', 'EXPIRED');

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "type" "GameType" NOT NULL,
    "status" "GameSessionStatus" NOT NULL DEFAULT 'WAITING',
    "size" INTEGER NOT NULL,
    "bombCount" INTEGER NOT NULL,
    "reward" TEXT NOT NULL,
    "turnLimitSec" INTEGER NOT NULL DEFAULT 30,
    "totalLimitSec" INTEGER NOT NULL DEFAULT 600,
    "winnerId" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePlayer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seat" INTEGER NOT NULL,
    "bombs" TEXT,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "readyAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamePlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameMove" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetSeat" INTEGER NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "hit" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameMove_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_code_key" ON "GameSession"("code");

-- CreateIndex
CREATE INDEX "GameSession_coupleId_status_idx" ON "GameSession"("coupleId", "status");

-- CreateIndex
CREATE INDEX "GameSession_code_idx" ON "GameSession"("code");

-- CreateIndex
CREATE INDEX "GameSession_status_createdAt_idx" ON "GameSession"("status", "createdAt");

-- CreateIndex
CREATE INDEX "GamePlayer_userId_idx" ON "GamePlayer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GamePlayer_sessionId_userId_key" ON "GamePlayer"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GamePlayer_sessionId_seat_key" ON "GamePlayer"("sessionId", "seat");

-- CreateIndex
CREATE INDEX "GameMove_sessionId_createdAt_idx" ON "GameMove"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameMove" ADD CONSTRAINT "GameMove_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameMove" ADD CONSTRAINT "GameMove_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
