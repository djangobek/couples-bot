-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "CoupleStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CoupleRole" AS ENUM ('OWNER', 'PARTNER');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('PHOTO', 'VIDEO', 'AUDIO', 'DOCUMENT', 'TEXT');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('COUPLE', 'PRIVATE');

-- CreateEnum
CREATE TYPE "LetterStatus" AS ENUM ('DRAFT', 'SENT', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReadingBookStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReadingParticipantStatus" AS ENUM ('ACTIVE', 'LEFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('READING_RACE', 'STREAK', 'PAGES', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('MEMORY_ADDED', 'MEMORY_REACTED', 'LETTER_SENT', 'BOOK_ADDED', 'READING_PROGRESS', 'CHALLENGE_CREATED', 'CHALLENGE_COMPLETED', 'DATE_CREATED', 'PARTNER_JOINED', 'PARTNER_LEFT');

-- CreateEnum
CREATE TYPE "MediaStorage" AS ENUM ('TELEGRAM', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "TelegramFileType" AS ENUM ('DOCUMENT', 'PHOTO', 'VIDEO', 'AUDIO', 'THUMBNAIL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "languageCode" TEXT,
    "photoUrl" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Couple" (
    "id" TEXT NOT NULL,
    "status" "CoupleStatus" NOT NULL DEFAULT 'PENDING',
    "displayName" TEXT,
    "anniversaryDate" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Couple_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoupleMember" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CoupleRole" NOT NULL DEFAULT 'PARTNER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "CoupleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoupleInvite" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoupleInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "privateOwnerId" TEXT,
    "type" "MemoryType" NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'COUPLE',
    "title" TEXT,
    "caption" TEXT,
    "eventAt" TIMESTAMP(3),
    "locationName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramFileReference" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL DEFAULT 'couples-bot',
    "telegramChatId" BIGINT,
    "telegramFileId" TEXT NOT NULL,
    "telegramFileUniqueId" TEXT,
    "fileType" "TelegramFileType" NOT NULL,
    "mimeType" TEXT,
    "fileName" TEXT,
    "fileSize" BIGINT,
    "width" INTEGER,
    "height" INTEGER,
    "durationSec" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramFileReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "storage" "MediaStorage" NOT NULL DEFAULT 'TELEGRAM',
    "telegramFileRefId" TEXT,
    "externalUrl" TEXT,
    "checksum" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryReaction" (
    "id" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Letter" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "status" "LetterStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Letter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingBook" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "pageCount" INTEGER,
    "storage" "MediaStorage" NOT NULL DEFAULT 'TELEGRAM',
    "fileRefId" TEXT,
    "coverFileRefId" TEXT,
    "externalUrl" TEXT,
    "status" "ReadingBookStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingParticipant" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ReadingParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReadingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "pagesRead" INTEGER NOT NULL DEFAULT 0,
    "percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "totalReadSeconds" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoupleChallenge" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "bookId" TEXT,
    "type" "ChallengeType" NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "winnerUserId" TEXT,
    "rules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupleChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeParticipant" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "progress" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ChallengeParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateEvent" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "reminderAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DateEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "ActivityType" NOT NULL,
    "entityId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "Couple_status_idx" ON "Couple"("status");

-- CreateIndex
CREATE INDEX "Couple_archivedAt_idx" ON "Couple"("archivedAt");

-- CreateIndex
CREATE INDEX "CoupleMember_userId_leftAt_idx" ON "CoupleMember"("userId", "leftAt");

-- CreateIndex
CREATE INDEX "CoupleMember_coupleId_leftAt_idx" ON "CoupleMember"("coupleId", "leftAt");

-- CreateIndex
CREATE INDEX "CoupleMember_coupleId_role_idx" ON "CoupleMember"("coupleId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "CoupleMember_coupleId_userId_key" ON "CoupleMember"("coupleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoupleInvite_tokenHash_key" ON "CoupleInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "CoupleInvite_coupleId_status_idx" ON "CoupleInvite"("coupleId", "status");

-- CreateIndex
CREATE INDEX "CoupleInvite_receiverId_status_idx" ON "CoupleInvite"("receiverId", "status");

-- CreateIndex
CREATE INDEX "CoupleInvite_expiresAt_idx" ON "CoupleInvite"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_sessionHash_key" ON "AuthSession"("sessionHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_revokedAt_idx" ON "AuthSession"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");

-- CreateIndex
CREATE INDEX "Memory_coupleId_createdAt_idx" ON "Memory"("coupleId", "createdAt");

-- CreateIndex
CREATE INDEX "Memory_coupleId_eventAt_idx" ON "Memory"("coupleId", "eventAt");

-- CreateIndex
CREATE INDEX "Memory_authorId_createdAt_idx" ON "Memory"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Memory_coupleId_deletedAt_createdAt_idx" ON "Memory"("coupleId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Memory_coupleId_deletedAt_eventAt_idx" ON "Memory"("coupleId", "deletedAt", "eventAt");

-- CreateIndex
CREATE INDEX "TelegramFileReference_sourceKey_telegramFileUniqueId_idx" ON "TelegramFileReference"("sourceKey", "telegramFileUniqueId");

-- CreateIndex
CREATE INDEX "TelegramFileReference_telegramChatId_idx" ON "TelegramFileReference"("telegramChatId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramFileReference_sourceKey_telegramFileId_key" ON "TelegramFileReference"("sourceKey", "telegramFileId");

-- CreateIndex
CREATE INDEX "MediaAsset_memoryId_createdAt_idx" ON "MediaAsset"("memoryId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_telegramFileRefId_idx" ON "MediaAsset"("telegramFileRefId");

-- CreateIndex
CREATE INDEX "MediaAsset_deletedAt_idx" ON "MediaAsset"("deletedAt");

-- CreateIndex
CREATE INDEX "MemoryReaction_memoryId_createdAt_idx" ON "MemoryReaction"("memoryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryReaction_memoryId_userId_emoji_key" ON "MemoryReaction"("memoryId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "Letter_coupleId_createdAt_idx" ON "Letter"("coupleId", "createdAt");

-- CreateIndex
CREATE INDEX "Letter_receiverId_status_idx" ON "Letter"("receiverId", "status");

-- CreateIndex
CREATE INDEX "ReadingBook_coupleId_status_createdAt_idx" ON "ReadingBook"("coupleId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReadingBook_addedById_createdAt_idx" ON "ReadingBook"("addedById", "createdAt");

-- CreateIndex
CREATE INDEX "ReadingBook_fileRefId_idx" ON "ReadingBook"("fileRefId");

-- CreateIndex
CREATE INDEX "ReadingBook_coverFileRefId_idx" ON "ReadingBook"("coverFileRefId");

-- CreateIndex
CREATE INDEX "ReadingParticipant_userId_status_idx" ON "ReadingParticipant"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingParticipant_bookId_userId_key" ON "ReadingParticipant"("bookId", "userId");

-- CreateIndex
CREATE INDEX "ReadingProgress_bookId_pagesRead_idx" ON "ReadingProgress"("bookId", "pagesRead");

-- CreateIndex
CREATE INDEX "ReadingProgress_bookId_lastReadAt_idx" ON "ReadingProgress"("bookId", "lastReadAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_bookId_userId_key" ON "ReadingProgress"("bookId", "userId");

-- CreateIndex
CREATE INDEX "CoupleChallenge_coupleId_status_idx" ON "CoupleChallenge"("coupleId", "status");

-- CreateIndex
CREATE INDEX "CoupleChallenge_coupleId_startsAt_endsAt_idx" ON "CoupleChallenge"("coupleId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "CoupleChallenge_endsAt_status_idx" ON "CoupleChallenge"("endsAt", "status");

-- CreateIndex
CREATE INDEX "CoupleChallenge_creatorId_createdAt_idx" ON "CoupleChallenge"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "ChallengeParticipant_challengeId_score_idx" ON "ChallengeParticipant"("challengeId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeParticipant_challengeId_userId_key" ON "ChallengeParticipant"("challengeId", "userId");

-- CreateIndex
CREATE INDEX "DateEvent_coupleId_startsAt_idx" ON "DateEvent"("coupleId", "startsAt");

-- CreateIndex
CREATE INDEX "DateEvent_reminderAt_idx" ON "DateEvent"("reminderAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_coupleId_createdAt_idx" ON "ActivityEvent"("coupleId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_actorId_createdAt_idx" ON "ActivityEvent"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_coupleId_createdAt_idx" ON "AuditLog"("coupleId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "CoupleMember" ADD CONSTRAINT "CoupleMember_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleMember" ADD CONSTRAINT "CoupleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleInvite" ADD CONSTRAINT "CoupleInvite_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleInvite" ADD CONSTRAINT "CoupleInvite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleInvite" ADD CONSTRAINT "CoupleInvite_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_privateOwnerId_fkey" FOREIGN KEY ("privateOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_telegramFileRefId_fkey" FOREIGN KEY ("telegramFileRefId") REFERENCES "TelegramFileReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryReaction" ADD CONSTRAINT "MemoryReaction_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryReaction" ADD CONSTRAINT "MemoryReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingBook" ADD CONSTRAINT "ReadingBook_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingBook" ADD CONSTRAINT "ReadingBook_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingBook" ADD CONSTRAINT "ReadingBook_fileRefId_fkey" FOREIGN KEY ("fileRefId") REFERENCES "TelegramFileReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingBook" ADD CONSTRAINT "ReadingBook_coverFileRefId_fkey" FOREIGN KEY ("coverFileRefId") REFERENCES "TelegramFileReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingParticipant" ADD CONSTRAINT "ReadingParticipant_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "ReadingBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingParticipant" ADD CONSTRAINT "ReadingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "ReadingBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleChallenge" ADD CONSTRAINT "CoupleChallenge_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleChallenge" ADD CONSTRAINT "CoupleChallenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleChallenge" ADD CONSTRAINT "CoupleChallenge_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleChallenge" ADD CONSTRAINT "CoupleChallenge_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "ReadingBook"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "CoupleChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateEvent" ADD CONSTRAINT "DateEvent_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateEvent" ADD CONSTRAINT "DateEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
