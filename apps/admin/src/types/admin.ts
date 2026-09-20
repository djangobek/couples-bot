/* ============================================================
   ADMIN — Types (mirror backend)
   ============================================================ */

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/* ---------- Common ---------- */
export type PaginatedResult<T> = {
  items: T[];
  nextCursor: string | null;
  total?: number;
};

/* ---------- User ---------- */
export type UserStatus = "ACTIVE" | "BLOCKED" | "DELETED";

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

/* ---------- Game ---------- */
export type GameType = "BOMB" | "TIC_TAC_TOE";

export type GameSessionStatus =
  | "WAITING"
  | "PLACING"
  | "PLAYING"
  | "PAUSED"
  | "FINISHED"
  | "ABANDONED"
  | "EXPIRED";

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

/* ---------- Dashboard ---------- */
export type DashboardStats = {
  users: {
    total: number;
    active: number;
    online: number;
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
    byType: Array<{ type: GameType; count: number }>;
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

export type DashboardActivityItem = {
  id: string;
  type: string;
  actorId: string | null;
  actorName: string | null;
  actorPhotoUrl: string | null;
  entityId: string | null;
  payload: unknown;
  createdAt: string;
};

export type DashboardActivity = {
  items: DashboardActivityItem[];
  nextCursor: string | null;
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
    byType: Array<{ type: GameType; count: number }>;
    byStatus: Array<{ status: GameSessionStatus; count: number }>;
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

/* ---------- Auth ---------- */
export type AdminMeResponse = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  languageCode?: string | null;
};

/* ---------- ApiError ---------- */
export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;
  details?: unknown;

  constructor(
    message: string,
    code: string,
    status: number,
    requestId?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}