/* ============================================================
   ADMIN — Types
   ============================================================ */



import type {
  GameType,
  GameSessionStatus,
  UserStatus,
} from "@prisma/client";

/* ... qolgan kod o'zgarmaydi ... */

/* ---------- Common ---------- */
export type PaginationParams = {
  cursor?: string;
  limit: number;
  offset?: number;
};

export type PaginatedResult<T> = {
  items: T[];
  nextCursor: string | null;
  total?: number;
};

/* ---------- Dashboard ---------- */
export type DashboardStats = {
  users: {
    total: number;
    active: number; // last 7 days
    online: number; // last 5 min
    blocked: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  games: {
    total: number;
    active: number;
    finished: number;
    draws: number;
    abandoned: number;
    todayCount: number;
    weekCount: number;
    monthCount: number;
    byType: Array<{
      type: GameType;
      count: number;
    }>;
  };
  couples: {
    total: number;
    active: number;
  };
  system: {
    uptime: number;
    nodeVersion: string;
    environment: string;
  };
};

export type DashboardActivity = {
  items: Array<{
    id: string;
    type: string;
    actorId: string | null;
    actorName: string | null;
    actorPhotoUrl: string | null;
    entityId: string | null;
    createdAt: string;
    payload: unknown;
  }>;
  nextCursor: string | null;
};

/* ---------- Users ---------- */
export type AdminUserListItem = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  status: UserStatus;
  languageCode: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    gamesDraw: number;
    couplesCount: number;
    memoriesCount: number;
  };
};

export type AdminUserDetail = AdminUserListItem & {
  recentGames: Array<{
    id: string;
    type: GameType;
    status: GameSessionStatus;
    winnerId: string | null;
    createdAt: string;
    finishedAt: string | null;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    entityId: string | null;
    createdAt: string;
    payload: unknown;
  }>;
};

export type AdminUserFilters = {
  search?: string;
  status?: UserStatus;
  sortBy?: "createdAt" | "lastSeenAt" | "username";
  sortDir?: "asc" | "desc";
};

/* ---------- Games ---------- */
export type AdminGameListItem = {
  id: string;
  code: string;
  type: GameType;
  status: GameSessionStatus;
  size: number | null;
  reward: string | null;
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
    symbol: string | null;
    seat: number;
  }>;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  coupleId: string;
};

export type AdminGameDetail = AdminGameListItem & {
  boardState: unknown;
  moves: Array<{
    id: string;
    actorId: string;
    actorName: string | null;
    row: number;
    col: number;
    symbol: string | null;
    hit: boolean;
    createdAt: string;
  }>;
  config: unknown;
};

export type AdminGameFilters = {
  search?: string;
  type?: GameType;
  status?: GameSessionStatus;
  sortBy?: "createdAt" | "finishedAt";
  sortDir?: "asc" | "desc";
};

/* ---------- Logs ---------- */
export type AdminLogItem = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  actorId: string | null;
  actorName: string | null;
  coupleId: string | null;
  metadata: unknown;
  createdAt: string;
};

export type AdminLogFilters = {
  search?: string;
  action?: string;
  actorId?: string;
  entity?: string;
  fromDate?: string;
  toDate?: string;
};

/* ---------- Statistics ---------- */
export type StatPeriod = "today" | "7d" | "30d" | "90d" | "custom";

export type TimeSeriesPoint = {
  date: string;
  value: number;
};

export type StatisticsResponse = {
  period: StatPeriod;
  users: {
    registrations: TimeSeriesPoint[];
    activeUsers: TimeSeriesPoint[];
  };
  games: {
    sessions: TimeSeriesPoint[];
    byType: Array<{
      type: GameType;
      count: number;
    }>;
    byStatus: Array<{
      status: GameSessionStatus;
      count: number;
    }>;
  };
  couples: {
    created: TimeSeriesPoint[];
  };
};

/* ---------- System ---------- */
export type SystemStatus = {
  api: {
    status: "ok" | "degraded" | "down";
    uptime: number;
    memoryMb: number;
    version: string;
  };
  database: {
    status: "ok" | "degraded" | "down";
    latencyMs: number;
  };
  bot: {
    status: "unknown" | "ok" | "down";
    username: string | null;
  };
  environment: string;
  timestamp: string;
};