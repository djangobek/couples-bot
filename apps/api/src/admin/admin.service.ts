/* ============================================================
   ADMIN — Service (business logic)
   ============================================================ */

import { prisma } from "../database/prisma.service.js";
import type { Prisma, GameType } from "@prisma/client";
import type {
  DashboardStats,
  DashboardActivity,
  AdminUserListItem,
  AdminUserDetail,
  AdminUserFilters,
  AdminGameListItem,
  AdminGameDetail,
  AdminGameFilters,
  AdminLogItem,
  AdminLogFilters,
  PaginationParams,
  PaginatedResult,
  StatisticsResponse,
  StatPeriod,
  TimeSeriesPoint,
} from "./admin.types.js";

const ONLINE_THRESHOLD_MS = 5 * 60_000;
const ACTIVE_THRESHOLD_MS = 7 * 24 * 60 * 60_000;

/* ============================================================
   DATE HELPERS
   ============================================================ */
function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.ceil(ms / 86_400_000);
}

function resolvePeriodRange(params: {
  period: StatPeriod;
  fromDate?: string;
  toDate?: string;
}): { from: Date; to: Date } {
  const now = new Date();
  const to = params.toDate ? new Date(params.toDate) : now;

  if (params.period === "today") {
    return { from: startOfDay(now), to };
  }
  if (params.period === "7d") {
    return { from: addDays(startOfDay(now), -6), to };
  }
  if (params.period === "30d") {
    return { from: addDays(startOfDay(now), -29), to };
  }
  if (params.period === "90d") {
    return { from: addDays(startOfDay(now), -89), to };
  }
  /* custom */
  const from = params.fromDate ? new Date(params.fromDate) : addDays(startOfDay(now), -6);
  return { from, to };
}

/* ============================================================
   SERVICE
   ============================================================ */
export class AdminService {
  /* ============================================================
     DASHBOARD
     ============================================================ */
  async getDashboard(): Promise<DashboardStats> {
    const now = Date.now();
    const todayStart = startOfDay(new Date());
    const weekAgo = new Date(now - 7 * 24 * 60 * 60_000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60_000);
    const onlineThreshold = new Date(now - ONLINE_THRESHOLD_MS);
    const activeThreshold = new Date(now - ACTIVE_THRESHOLD_MS);

    const [
      totalUsers,
      activeUsers,
      onlineUsers,
      blockedUsers,
      newToday,
      newThisWeek,
      newThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastSeenAt: { gte: activeThreshold } } }),
      prisma.user.count({ where: { lastSeenAt: { gte: onlineThreshold } } }),
      prisma.user.count({ where: { status: "BLOCKED" } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    ]);

    const [
      totalGames,
      activeGames,
      finishedGames,
      abandonedGames,
      gamesToday,
      gamesThisWeek,
      gamesThisMonth,
      gamesByType,
      drawsCount,
    ] = await Promise.all([
      prisma.gameSession.count(),
      prisma.gameSession.count({
        where: {
          status: { in: ["WAITING", "PLACING", "PLAYING", "PAUSED"] },
        },
      }),
      prisma.gameSession.count({ where: { status: "FINISHED" } }),
      prisma.gameSession.count({ where: { status: "ABANDONED" } }),
      prisma.gameSession.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.gameSession.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.gameSession.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.gameSession.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
      prisma.gameSession.count({
        where: { status: "FINISHED", winnerId: null },
      }),
    ]);

    const [totalCouples, activeCouples] = await Promise.all([
      prisma.couple.count(),
      prisma.couple.count({ where: { status: "ACTIVE" } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        online: onlineUsers,
        blocked: blockedUsers,
        newToday,
        newThisWeek,
        newThisMonth,
      },
      games: {
        total: totalGames,
        active: activeGames,
        finished: finishedGames,
        draws: drawsCount,
        abandoned: abandonedGames,
        todayCount: gamesToday,
        weekCount: gamesThisWeek,
        monthCount: gamesThisMonth,
        byType: gamesByType.map((g) => ({
          type: g.type,
          count: g._count._all,
        })),
      },
      couples: {
        total: totalCouples,
        active: activeCouples,
      },
      system: {
        uptime: Math.floor(process.uptime()),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV ?? "development",
      },
    };
  }

  async getRecentActivity(
    params: PaginationParams,
  ): Promise<DashboardActivity> {
    const items = await prisma.activityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: params.limit + 1,
      ...(params.cursor
        ? { cursor: { id: params.cursor }, skip: 1 }
        : {}),
      select: {
        id: true,
        type: true,
        actorId: true,
        entityId: true,
        payload: true,
        createdAt: true,
        actor: {
          select: { id: true, firstName: true, photoUrl: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (items.length > params.limit) {
      const next = items.pop();
      nextCursor = next?.id ?? null;
    }

    return {
      items: items.map((a) => ({
        id: a.id,
        type: a.type,
        actorId: a.actorId,
        actorName: a.actor?.firstName ?? null,
        actorPhotoUrl: a.actor?.photoUrl ?? null,
        entityId: a.entityId,
        payload: a.payload,
        createdAt: a.createdAt.toISOString(),
      })),
      nextCursor,
    };
  }

  /* ============================================================
     USERS
     ============================================================ */
  async listUsers(
    filters: AdminUserFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<AdminUserListItem>> {
    const where: Prisma.UserWhereInput = {};

    if (filters.search) {
      const q = filters.search.trim();
      const orConditions: Prisma.UserWhereInput[] = [
        { username: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ];
      if (/^\d+$/.test(q)) {
        try {
          orConditions.push({ telegramId: BigInt(q) });
        } catch {
          /* invalid bigint */
        }
      }
      where.OR = orConditions;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const sortBy = filters.sortBy ?? "createdAt";
    const sortDir = filters.sortDir ?? "desc";

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        take: pagination.limit + 1,
        ...(pagination.cursor
          ? { cursor: { id: pagination.cursor }, skip: 1 }
          : {}),
        select: {
          id: true,
          telegramId: true,
          username: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
          status: true,
          languageCode: true,
          createdAt: true,
          lastSeenAt: true,
          _count: {
            select: {
              gamePlayers: true,
              wonGames: true,
              memberships: true,
              memories: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    let nextCursor: string | null = null;
    if (items.length > pagination.limit) {
      const next = items.pop();
      nextCursor = next?.id ?? null;
    }

    return {
      items: items.map((u) => ({
        id: u.id,
        telegramId: u.telegramId.toString(),
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        photoUrl: u.photoUrl,
        status: u.status,
        languageCode: u.languageCode,
        createdAt: u.createdAt.toISOString(),
        lastSeenAt: u.lastSeenAt?.toISOString() ?? null,
        stats: {
          gamesPlayed: u._count.gamePlayers,
          gamesWon: u._count.wonGames,
          gamesLost: 0,
          gamesDraw: 0,
          couplesCount: u._count.memberships,
          memoriesCount: u._count.memories,
        },
      })),
      nextCursor,
      total,
    };
  }

  async getUserDetail(userId: string): Promise<AdminUserDetail | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        status: true,
        languageCode: true,
        createdAt: true,
        lastSeenAt: true,
        _count: {
          select: {
            gamePlayers: true,
            wonGames: true,
            memberships: true,
            memories: true,
          },
        },
        gamePlayers: {
          orderBy: { joinedAt: "desc" },
          take: 20,
          select: {
            session: {
              select: {
                id: true,
                type: true,
                status: true,
                winnerId: true,
                createdAt: true,
                finishedAt: true,
              },
            },
          },
        },
        activityEvents: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            type: true,
            entityId: true,
            createdAt: true,
            payload: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      status: user.status,
      languageCode: user.languageCode,
      createdAt: user.createdAt.toISOString(),
      lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
      stats: {
        gamesPlayed: user._count.gamePlayers,
        gamesWon: user._count.wonGames,
        gamesLost: 0,
        gamesDraw: 0,
        couplesCount: user._count.memberships,
        memoriesCount: user._count.memories,
      },
      recentGames: user.gamePlayers.map((p) => ({
        id: p.session.id,
        type: p.session.type,
        status: p.session.status,
        winnerId: p.session.winnerId,
        createdAt: p.session.createdAt.toISOString(),
        finishedAt: p.session.finishedAt?.toISOString() ?? null,
      })),
      recentActivity: user.activityEvents.map((a) => ({
        id: a.id,
        type: a.type,
        entityId: a.entityId,
        createdAt: a.createdAt.toISOString(),
        payload: a.payload,
      })),
    };
  }

  async blockUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "BLOCKED" },
    });
  }

  async unblockUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });
  }

  /* ============================================================
     GAMES
     ============================================================ */
  async listGames(
    filters: AdminGameFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<AdminGameListItem>> {
    const where: Prisma.GameSessionWhereInput = {};

    if (filters.search) {
      const q = filters.search.trim().toUpperCase();
      where.OR = [{ code: { contains: q, mode: "insensitive" } }];
      if (/^[0-9a-f-]{36}$/i.test(filters.search.trim())) {
        where.OR.push({ id: filters.search.trim() });
      }
    }

    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    const sortBy = filters.sortBy ?? "createdAt";
    const sortDir = filters.sortDir ?? "desc";

    const [items, total] = await Promise.all([
      prisma.gameSession.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        take: pagination.limit + 1,
        ...(pagination.cursor
          ? { cursor: { id: pagination.cursor }, skip: 1 }
          : {}),
        select: {
          id: true,
          code: true,
          type: true,
          status: true,
          size: true,
          reward: true,
          winnerId: true,
          createdAt: true,
          startedAt: true,
          finishedAt: true,
          coupleId: true,
          winner: {
            select: { id: true, firstName: true, photoUrl: true },
          },
          players: {
            select: {
              userId: true,
              seat: true,
              symbol: true,
              user: {
                select: { id: true, firstName: true, photoUrl: true },
              },
            },
            orderBy: { seat: "asc" },
          },
        },
      }),
      prisma.gameSession.count({ where }),
    ]);

    let nextCursor: string | null = null;
    if (items.length > pagination.limit) {
      const next = items.pop();
      nextCursor = next?.id ?? null;
    }

    return {
      items: items.map((g) => ({
        id: g.id,
        code: g.code,
        type: g.type,
        status: g.status,
        size: g.size,
        reward: g.reward,
        winnerId: g.winnerId,
        winner: g.winner,
        players: g.players.map((p) => ({
          userId: p.userId,
          firstName: p.user.firstName,
          photoUrl: p.user.photoUrl,
          symbol: p.symbol,
          seat: p.seat,
        })),
        createdAt: g.createdAt.toISOString(),
        startedAt: g.startedAt?.toISOString() ?? null,
        finishedAt: g.finishedAt?.toISOString() ?? null,
        coupleId: g.coupleId,
      })),
      nextCursor,
      total,
    };
  }

  async getGameDetail(gameId: string): Promise<AdminGameDetail | null> {
    const game = await prisma.gameSession.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        code: true,
        type: true,
        status: true,
        size: true,
        reward: true,
        winnerId: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
        coupleId: true,
        config: true,
        winner: {
          select: { id: true, firstName: true, photoUrl: true },
        },
        players: {
          select: {
            userId: true,
            seat: true,
            symbol: true,
            bombs: true,
            hits: true,
            user: {
              select: { id: true, firstName: true, photoUrl: true },
            },
          },
          orderBy: { seat: "asc" },
        },
        moves: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            actorId: true,
            row: true,
            col: true,
            symbol: true,
            hit: true,
            createdAt: true,
            actor: {
              select: { id: true, firstName: true },
            },
          },
        },
      },
    });

    if (!game) return null;

    /* For Tic-Tac-Toe — reconstruct board from moves */
    let boardState: unknown = null;
    if (game.type === "TIC_TAC_TOE" && game.size) {
      const board: Array<string | null> = new Array(game.size * game.size).fill(null);
      for (const m of game.moves) {
        const idx = m.row * game.size + m.col;
        if (idx >= 0 && idx < board.length) {
          board[idx] = m.symbol ?? null;
        }
      }
      boardState = { board, size: game.size };
    }

    /* For Bomb — hide bomb positions (they were part of the game) */
    if (game.type === "BOMB") {
      boardState = {
        bombs: game.players.map((p) => ({
          userId: p.userId,
          bombs: p.bombs,
          hits: p.hits,
        })),
      };
    }

    return {
      id: game.id,
      code: game.code,
      type: game.type,
      status: game.status,
      size: game.size,
      reward: game.reward,
      winnerId: game.winnerId,
      winner: game.winner,
      players: game.players.map((p) => ({
        userId: p.userId,
        firstName: p.user.firstName,
        photoUrl: p.user.photoUrl,
        symbol: p.symbol,
        seat: p.seat,
      })),
      createdAt: game.createdAt.toISOString(),
      startedAt: game.startedAt?.toISOString() ?? null,
      finishedAt: game.finishedAt?.toISOString() ?? null,
      coupleId: game.coupleId,
      config: game.config,
      boardState,
      moves: game.moves.map((m) => ({
        id: m.id,
        actorId: m.actorId,
        actorName: m.actor.firstName,
        row: m.row,
        col: m.col,
        symbol: m.symbol,
        hit: m.hit,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async abandonGame(gameId: string): Promise<void> {
    const game = await prisma.gameSession.findUnique({
      where: { id: gameId },
      select: { status: true },
    });
    if (!game) return;
    if (
      game.status === "FINISHED" ||
      game.status === "ABANDONED" ||
      game.status === "EXPIRED"
    ) {
      return;
    }

    await prisma.gameSession.update({
      where: { id: gameId },
      data: {
        status: "ABANDONED",
        finishedAt: new Date(),
      },
    });
  }

  /* ============================================================
     LOGS
     ============================================================ */
  async listAuditLogs(
    filters: AdminLogFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<AdminLogItem>> {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { action: { contains: q, mode: "insensitive" } },
        { entity: { contains: q, mode: "insensitive" } },
      ];
    }
    if (filters.action) where.action = filters.action;
    if (filters.entity) where.entity = filters.entity;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.fromDate) {
      where.createdAt = { ...(where.createdAt as object), gte: new Date(filters.fromDate) };
    }
    if (filters.toDate) {
      where.createdAt = { ...(where.createdAt as object), lte: new Date(filters.toDate) };
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: pagination.limit + 1,
        ...(pagination.cursor
          ? { cursor: { id: pagination.cursor }, skip: 1 }
          : {}),
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          actorId: true,
          coupleId: true,
          metadata: true,
          createdAt: true,
          actor: {
            select: { id: true, firstName: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    let nextCursor: string | null = null;
    if (items.length > pagination.limit) {
      const next = items.pop();
      nextCursor = next?.id ?? null;
    }

    return {
      items: items.map((l) => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        actorId: l.actorId,
        actorName: l.actor?.firstName ?? null,
        coupleId: l.coupleId,
        metadata: l.metadata,
        createdAt: l.createdAt.toISOString(),
      })),
      nextCursor,
      total,
    };
  }

  async listAuditActions(): Promise<string[]> {
    const result = await prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
      take: 200,
    });
    return result.map((r) => r.action);
  }

  async listAuditEntities(): Promise<string[]> {
    const result = await prisma.auditLog.findMany({
      distinct: ["entity"],
      select: { entity: true },
      orderBy: { entity: "asc" },
      take: 100,
    });
    return result.map((r) => r.entity);
  }

  /* ============================================================
     STATISTICS
     ============================================================ */
  async getStatistics(params: {
    period: StatPeriod;
    fromDate?: string;
    toDate?: string;
  }): Promise<StatisticsResponse> {
    const { from, to } = resolvePeriodRange(params);

    /* Build date series */
    const totalDays = Math.min(daysBetween(from, to) + 1, 90);
    const dates: string[] = [];
    for (let i = 0; i < totalDays; i += 1) {
      dates.push(dateKey(addDays(from, i)));
    }

    /* Users registrations — group by date */
    const userRegsRaw = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM "User"
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    const userRegMap = new Map<string, number>();
    for (const row of userRegsRaw) {
      userRegMap.set(dateKey(new Date(row.date)), Number(row.count));
    }

    const userRegistrations: TimeSeriesPoint[] = dates.map((d) => ({
      date: d,
      value: userRegMap.get(d) ?? 0,
    }));

    /* Active users — group by date on lastSeenAt */
    const activeUsersRaw = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE("lastSeenAt") as date, COUNT(DISTINCT "id")::bigint as count
      FROM "User"
      WHERE "lastSeenAt" >= ${from} AND "lastSeenAt" <= ${to}
      GROUP BY DATE("lastSeenAt")
      ORDER BY date ASC
    `;

    const activeMap = new Map<string, number>();
    for (const row of activeUsersRaw) {
      activeMap.set(dateKey(new Date(row.date)), Number(row.count));
    }

    const activeUsers: TimeSeriesPoint[] = dates.map((d) => ({
      date: d,
      value: activeMap.get(d) ?? 0,
    }));

    /* Games sessions */
    const gamesRaw = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM "GameSession"
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    const gamesMap = new Map<string, number>();
    for (const row of gamesRaw) {
      gamesMap.set(dateKey(new Date(row.date)), Number(row.count));
    }

    const gamesSessions: TimeSeriesPoint[] = dates.map((d) => ({
      date: d,
      value: gamesMap.get(d) ?? 0,
    }));

    /* Games by type */
    const gamesByType = await prisma.gameSession.groupBy({
      by: ["type"],
      where: {
        createdAt: { gte: from, lte: to },
      },
      _count: { _all: true },
    });

    /* Games by status */
    const gamesByStatus = await prisma.gameSession.groupBy({
      by: ["status"],
      where: {
        createdAt: { gte: from, lte: to },
      },
      _count: { _all: true },
    });

    /* Couples created */
    const couplesRaw = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM "Couple"
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    const couplesMap = new Map<string, number>();
    for (const row of couplesRaw) {
      couplesMap.set(dateKey(new Date(row.date)), Number(row.count));
    }

    const couplesCreated: TimeSeriesPoint[] = dates.map((d) => ({
      date: d,
      value: couplesMap.get(d) ?? 0,
    }));

    return {
      period: params.period,
      users: {
        registrations: userRegistrations,
        activeUsers,
      },
      games: {
        sessions: gamesSessions,
        byType: gamesByType.map((g) => ({
          type: g.type,
          count: g._count._all,
        })),
        byStatus: gamesByStatus.map((g) => ({
          status: g.status,
          count: g._count._all,
        })),
      },
      couples: {
        created: couplesCreated,
      },
    };
  }

  /* ============================================================
     SYSTEM
     ============================================================ */
  async pingDatabase(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
  }

  /* ============================================================
     AUDIT LOG
     ============================================================ */
  async logAdminAction(params: {
    actorId: string;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: Record<string, unknown> | null;
    coupleId?: string | null;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId ?? null,
          coupleId: params.coupleId ?? null,
          metadata:
            params.metadata === undefined || params.metadata === null
              ? undefined
              : (params.metadata as Prisma.InputJsonValue),
        },
      });
    } catch (err) {
      console.error("[admin.audit] failed to write log:", err);
    }
  }
}

export const adminService = new AdminService();