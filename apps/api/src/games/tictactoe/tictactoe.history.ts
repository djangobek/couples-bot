/* ============================================================
   TIC-TAC-TOE — History query
   ============================================================ */

import { prisma } from "../../database/prisma.service.js";
import { coupleContextService } from "../../couples/couple-context.service.js";

type TttHistoryItem = {
  id: string;
  code: string;
  status: string;
  size: number;
  winLength: number;
  winnerId: string | null;
  winner: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  } | null;
  players: Array<{
    userId: string;
    firstName: string | null;
    photoUrl: string | null;
    symbol: string;
    icon: string;
  }>;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  myResult: "WIN" | "LOSS" | "DRAW" | "IN_PROGRESS" | "CANCELLED";
};

export class TttHistoryService {
  async list(
    userId: string,
    options: { limit?: number } = {},
  ): Promise<TttHistoryItem[]> {
    const ctx = await coupleContextService.getActiveCoupleForUser(userId);

    const limit = Math.min(options.limit ?? 20, 100);

    const sessions = await prisma.gameSession.findMany({
      where: {
        coupleId: ctx.coupleId,
        type: "TIC_TAC_TOE",
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
        config: true,
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
            symbol: true,
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

      let myResult: TttHistoryItem["myResult"] = "IN_PROGRESS";
      if (isCancelled) myResult = "CANCELLED";
      else if (s.winnerId === null) myResult = "DRAW";
      else if (isWinner) myResult = "WIN";
      else myResult = "LOSS";

      const config = (s.config as Record<string, unknown> | null) ?? {};

      return {
        id: s.id,
        code: s.code,
        status: s.status,
        size: s.size ?? 3,
        winLength:
          s.size === 3
            ? 3
            : s.size === 7
              ? 5
              : 4,
        winnerId: s.winnerId,
        winner: s.winner,
        players: s.players.map((p) => {
          const isCreator = s.players.findIndex((x) => x.userId === p.userId) === 0;
          const icon =
            (isCreator
              ? (config.creatorIcon as string | undefined)
              : (config.joinerIcon as string | undefined)) ??
            (p.symbol === "X" ? "❌" : "⭕");

          return {
            userId: p.userId,
            firstName: p.user.firstName,
            photoUrl: p.user.photoUrl,
            symbol: p.symbol ?? "X",
            icon,
          };
        }),
        startedAt: s.startedAt?.toISOString() ?? null,
        finishedAt: s.finishedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        myResult,
      };
    });
  }
}

export const tttHistoryService = new TttHistoryService();