/* ============================================================
   DATABASE — Prisma client + type re-exports
   ============================================================ */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

/* ============================================================
   Re-export Prisma namespace (InputJsonValue, JsonNull, etc.)
   ============================================================ */
export { Prisma } from "@prisma/client";
export type { PrismaClient };

/* ============================================================
   Re-export ALL Prisma TYPES (enum'lar ham type)
   ⚠️ MUHIM: enum'lar TYPE sifatida eksport qilinadi
   chunki Prisma ularni runtime'da export qilmaydi
   ============================================================ */
export type {
  UserStatus,
  CoupleStatus,
  CoupleRole,
  InviteStatus,
  MemoryType,
  Visibility,
  LetterStatus,
  ReadingBookStatus,
  ReadingParticipantStatus,
  ChallengeStatus,
  ChallengeType,
  ActivityType,
  MediaStorage,
  TelegramFileType,
  GameType,
  GameSessionStatus,
} from "@prisma/client";