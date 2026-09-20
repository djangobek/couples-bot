/* ============================================================
   DATABASE — Prisma client + type re-exports
   ============================================================ */
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis;
export const db = globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development"
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
