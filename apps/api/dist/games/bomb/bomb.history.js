/* ============================================================
   BOMB GAME — History query
   ============================================================ */
import { prisma } from "../../database/prisma.service.js";
import { coupleContextService } from "../../couples/couple-context.service.js";
export class BombHistoryService {
    async list(userId, options = {}) {
        const ctx = await coupleContextService.getActiveCoupleForUser(userId);
        const limit = Math.min(options.limit ?? 20, 100);
        const sessions = await prisma.gameSession.findMany({
            where: {
                coupleId: ctx.coupleId,
                type: "BOMB",
                status: {
                    in: ["FINISHED", "EXPIRED", "ABANDONED"],
                },
            },
            orderBy: [{ finishedAt: "desc" }, { createdAt: "desc" }],
            take: limit,
            select: {
                id: true,
                code: true,
                status: true,
                size: true,
                bombCount: true,
                reward: true,
                winnerId: true,
                startedAt: true,
                finishedAt: true,
                createdAt: true,
                winner: {
                    select: { id: true, firstName: true, photoUrl: true },
                },
                players: {
                    select: {
                        userId: true,
                        hits: true,
                        user: {
                            select: { id: true, firstName: true, photoUrl: true },
                        },
                    },
                },
            },
        });
        return sessions.map((s) => {
            const isWinner = s.winnerId === userId;
            const isCancelled = s.status === "ABANDONED";
            let myResult = "IN_PROGRESS";
            if (isCancelled)
                myResult = "CANCELLED";
            else if (s.winnerId === null)
                myResult = "DRAW";
            else if (isWinner)
                myResult = "WIN";
            else
                myResult = "LOSS";
            return {
                id: s.id,
                code: s.code,
                status: s.status,
                /* ============ FIX: size and bombCount may be null ============ */
                size: s.size ?? 0,
                bombCount: s.bombCount ?? 0,
                reward: s.reward ?? "",
                winnerId: s.winnerId,
                winner: s.winner,
                players: s.players.map((p) => ({
                    userId: p.userId,
                    firstName: p.user.firstName,
                    photoUrl: p.user.photoUrl,
                    hits: p.hits,
                })),
                startedAt: s.startedAt?.toISOString() ?? null,
                finishedAt: s.finishedAt?.toISOString() ?? null,
                createdAt: s.createdAt.toISOString(),
                myResult,
            };
        });
    }
}
export const bombHistoryService = new BombHistoryService();
