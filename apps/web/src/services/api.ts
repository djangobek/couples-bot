/* ============================================================
   CENTRALIZED API CLIENT v5
   - Request deduplication
   - Auto-retry on network failures
   - Response caching (30s for GET)
   - Supports: Auth, Couple, Memories, Letters, Dates, Reading,
     Challenges, Bomb, Tic-Tac-Toe, Subscription
   ============================================================ */

import { ApiError } from "../types/api";
import type {
  ApiResponse,
  AuthMeResponse,
  CoupleData,
  InviteCreateResponse,
  InvitePreviewResponse,
  HomeData,
  ActivityPage,
  MemoryPage,
  MemoryItem,
  LetterItem,
  DateItem,
  BookItem,
  ReadingProgressItem,
  ChallengeItem,
  MemoryType,
  MemoryVisibility,
  ChallengeType,
} from "../types/api";
import type {
  TttHistoryItem,
} from "../features/games/tictactoe/tictactoe-types";
import type {
  SubscriptionStatus,
} from "../features/subscription/subscription-types";
import { getInitData } from "./telegram";

const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3001";

const API_PREFIX = "/v1";
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const CACHE_TTL_MS = 30_000;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  auth?: boolean;
  noRetry?: boolean;
  noCache?: boolean;
  cacheTtl?: number;
};

/* ---------- Request deduplication ---------- */
const inflightRequests = new Map<string, Promise<unknown>>();

/* ---------- Response cache ---------- */
type CacheEntry = { data: unknown; expiresAt: number };
const responseCache = new Map<string, CacheEntry>();

function getCacheKey(path: string, method: string): string {
  return `${method}:${path}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttl: number): void {
  responseCache.set(key, { data, expiresAt: Date.now() + ttl });
}

function isRetryable(method: string, status: number): boolean {
  if (method === "GET") {
    return status === 0 || status >= 500;
  }
  return status === 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const externalSignal = init.signal;
  if (externalSignal) {
    externalSignal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function doRequest<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    signal,
    auth = true,
    noRetry = false,
  } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const initData = getInitData();
    if (initData) {
      finalHeaders["X-Telegram-Init-Data"] = initData;
    }
  }

  const url = `${BASE_URL}${API_PREFIX}${path}`;
  const fetchInit: RequestInit = {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
    credentials: "omit",
  };

  const attempts = noRetry ? 1 : MAX_RETRIES + 1;
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, fetchInit, TIMEOUT_MS);

      let payload: ApiResponse<T> | null = null;
      try {
        payload = (await response.json()) as ApiResponse<T>;
      } catch {
        /* non-JSON */
      }

      if (!response.ok || !payload || payload.success === false) {
        const errPayload =
          payload && payload.success === false ? payload.error : undefined;

        const apiError = new ApiError(
          errPayload?.message ?? `Request failed (${response.status})`,
          errPayload?.code ?? "REQUEST_FAILED",
          response.status,
          errPayload?.requestId,
          errPayload?.details,
        );

        if (
          !noRetry &&
          attempt < attempts - 1 &&
          isRetryable(method, response.status)
        ) {
          lastError = apiError;
          await sleep(Math.pow(2, attempt) * 400);
          continue;
        }

        throw apiError;
      }

      return payload.data;
    } catch (err) {
      const isAbort = (err as Error).name === "AbortError";
      const isTimeout = isAbort && !signal?.aborted;

      if (isAbort && signal?.aborted) throw err;

      const networkError = new ApiError(
        isTimeout
          ? "So'rov vaqti tugadi. Internetni tekshiring."
          : "Serverga ulanib bo'lmadi.",
        isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
        0,
      );

      if (!noRetry && attempt < attempts - 1 && !signal?.aborted) {
        lastError = networkError;
        await sleep(Math.pow(2, attempt) * 400);
        continue;
      }

      throw networkError;
    }
  }

  throw lastError ?? new ApiError("Request failed", "REQUEST_FAILED", 0);
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    noCache = false,
    cacheTtl = CACHE_TTL_MS,
  } = options;

  const key = getCacheKey(path, method);

  if (method === "GET" && !noCache) {
    const cached = getFromCache<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  if (method === "GET") {
    const existing = inflightRequests.get(key);
    if (existing) {
      return existing as Promise<T>;
    }
  }

  const promise = doRequest<T>(path, options);

  if (method === "GET") {
    inflightRequests.set(key, promise);

    try {
      const data = await promise;
      if (!noCache) {
        setCache(key, data, cacheTtl);
      }
      return data;
    } finally {
      inflightRequests.delete(key);
    }
  }

  return promise;
}

/* ---------- Cache invalidation ---------- */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(prefix)) {
      responseCache.delete(key);
    }
  }
}

/* ============================================================
   ENDPOINTS
   ============================================================ */

export const api = {
  /* ============================================================
     AUTH
     ============================================================ */
  authTelegram(): Promise<AuthMeResponse> {
    return request<AuthMeResponse>("/auth/telegram", {
      method: "POST",
      auth: true,
      noRetry: true,
      noCache: true,
    });
  },

  authMe(): Promise<AuthMeResponse> {
    return request<AuthMeResponse>("/auth/me", { noCache: true });
  },

  me(): Promise<AuthMeResponse> {
    return request<AuthMeResponse>("/me", { noCache: true });
  },

  /* ============================================================
     SUBSCRIPTION
     ============================================================ */
  getSubscriptionStatus(): Promise<SubscriptionStatus> {
    return request<SubscriptionStatus>("/subscription/status", {
      noCache: true,
    });
  },

  checkSubscription(): Promise<SubscriptionStatus> {
    return request<SubscriptionStatus>("/subscription/check", {
      method: "POST",
      noRetry: true,
      noCache: true,
    });
  },

  /* ============================================================
     COUPLE
     ============================================================ */
  getCouple(): Promise<CoupleData> {
    return request<CoupleData>("/couple");
  },

  createCouple(input?: {
    displayName?: string;
    anniversaryDate?: string | null;
    timezone?: string;
  }): Promise<CoupleData> {
    invalidateCache("/couple");
    return request<CoupleData>("/couple", {
      method: "POST",
      body: input ?? {},
      noRetry: true,
    });
  },

  getMembers(): Promise<unknown> {
    return request<unknown>("/couple/members");
  },

  leaveCouple(): Promise<unknown> {
    invalidateCache();
    return request<unknown>("/couple/leave", {
      method: "POST",
      noRetry: true,
    });
  },

  /* ============================================================
     INVITE
     ============================================================ */
  createInvite(): Promise<InviteCreateResponse> {
    return request<InviteCreateResponse>("/couple/invite", {
      method: "POST",
      body: {},
      noRetry: true,
      noCache: true,
    });
  },

  previewInvite(code: string): Promise<InvitePreviewResponse> {
    return request<InvitePreviewResponse>(
      `/couple/invite/${encodeURIComponent(code)}`,
      { auth: true, noCache: true },
    );
  },

  acceptInvite(code: string): Promise<CoupleData> {
    invalidateCache();
    return request<CoupleData>(
      `/couple/invite/${encodeURIComponent(code)}/accept`,
      { method: "POST", noRetry: true },
    );
  },

  /* ============================================================
     HOME
     ============================================================ */
  getHome(): Promise<HomeData> {
    return request<HomeData>("/home");
  },

  /* ============================================================
     ACTIVITY
     ============================================================ */
  getActivity(options?: {
    cursor?: string;
    limit?: number;
  }): Promise<ActivityPage> {
    const params = new URLSearchParams();
    if (options?.cursor) params.set("cursor", options.cursor);
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    return request<ActivityPage>(`/activity${qs ? `?${qs}` : ""}`);
  },

  /* ============================================================
     MEMORIES
     ============================================================ */
  listMemories(options?: {
    cursor?: string;
    limit?: number;
  }): Promise<MemoryPage> {
    const params = new URLSearchParams();
    if (options?.cursor) params.set("cursor", options.cursor);
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    return request<MemoryPage>(`/memories${qs ? `?${qs}` : ""}`);
  },

  getMemory(id: string): Promise<MemoryItem> {
    return request<MemoryItem>(`/memories/${id}`);
  },

  createMemory(input: {
    type: MemoryType;
    title?: string;
    caption?: string;
    eventAt?: string;
    locationName?: string;
    visibility?: MemoryVisibility;
  }): Promise<MemoryItem> {
    invalidateCache("/home");
    invalidateCache("/memories");
    return request<MemoryItem>("/memories", {
      method: "POST",
      body: input,
      noRetry: true,
    });
  },

  updateMemory(
    id: string,
    input: {
      title?: string | null;
      caption?: string | null;
      eventAt?: string | null;
      locationName?: string | null;
      visibility?: MemoryVisibility;
    },
  ): Promise<MemoryItem> {
    invalidateCache("/home");
    invalidateCache("/memories");
    return request<MemoryItem>(`/memories/${id}`, {
      method: "PATCH",
      body: input,
      noRetry: true,
    });
  },

  deleteMemory(id: string): Promise<{ deleted: boolean }> {
    invalidateCache("/home");
    invalidateCache("/memories");
    return request<{ deleted: boolean }>(`/memories/${id}`, {
      method: "DELETE",
      noRetry: true,
    });
  },

  addReaction(memoryId: string, emoji: string): Promise<{ reacted: boolean }> {
    invalidateCache("/memories");
    return request<{ reacted: boolean }>(`/memories/${memoryId}/reactions`, {
      method: "POST",
      body: { emoji },
      noRetry: true,
    });
  },

  removeReaction(
    memoryId: string,
    emoji: string,
  ): Promise<{ reacted: boolean }> {
    invalidateCache("/memories");
    return request<{ reacted: boolean }>(
      `/memories/${memoryId}/reactions/${encodeURIComponent(emoji)}`,
      { method: "DELETE", noRetry: true },
    );
  },

  /* ============================================================
     LETTERS
     ============================================================ */
  listLetters(): Promise<LetterItem[]> {
    return request<LetterItem[]>("/letters");
  },

  getLetter(id: string): Promise<LetterItem> {
    return request<LetterItem>(`/letters/${id}`);
  },

  createLetter(input: {
    title?: string;
    body: string;
    scheduledAt?: string | null;
    sendNow?: boolean;
  }): Promise<LetterItem> {
    invalidateCache("/home");
    invalidateCache("/letters");
    return request<LetterItem>("/letters", {
      method: "POST",
      body: input,
      noRetry: true,
    });
  },

  updateLetter(
    id: string,
    input: {
      title?: string | null;
      body?: string;
      scheduledAt?: string | null;
    },
  ): Promise<LetterItem> {
    invalidateCache("/letters");
    return request<LetterItem>(`/letters/${id}`, {
      method: "PATCH",
      body: input,
      noRetry: true,
    });
  },

  markLetterRead(id: string): Promise<LetterItem> {
    invalidateCache("/letters");
    invalidateCache("/home");
    return request<LetterItem>(`/letters/${id}/read`, {
      method: "POST",
      noRetry: true,
    });
  },

  deleteLetter(id: string): Promise<{ archived: boolean }> {
    invalidateCache("/home");
    invalidateCache("/letters");
    return request<{ archived: boolean }>(`/letters/${id}`, {
      method: "DELETE",
      noRetry: true,
    });
  },

  /* ============================================================
     DATES
     ============================================================ */
  listDates(options?: { upcoming?: boolean }): Promise<DateItem[]> {
    const qs = options?.upcoming ? "?upcoming=true" : "";
    return request<DateItem[]>(`/dates${qs}`);
  },

  getDate(id: string): Promise<DateItem> {
    return request<DateItem>(`/dates/${id}`);
  },

  createDate(input: {
    title: string;
    description?: string;
    startsAt: string;
    endsAt?: string | null;
    location?: string;
    reminderAt?: string | null;
  }): Promise<DateItem> {
    invalidateCache("/home");
    invalidateCache("/dates");
    return request<DateItem>("/dates", {
      method: "POST",
      body: input,
      noRetry: true,
    });
  },

  updateDate(
    id: string,
    input: {
      title?: string;
      description?: string | null;
      startsAt?: string;
      endsAt?: string | null;
      location?: string | null;
      reminderAt?: string | null;
    },
  ): Promise<DateItem> {
    invalidateCache("/home");
    invalidateCache("/dates");
    return request<DateItem>(`/dates/${id}`, {
      method: "PATCH",
      body: input,
      noRetry: true,
    });
  },

  deleteDate(id: string): Promise<{ deleted: boolean }> {
    invalidateCache("/home");
    invalidateCache("/dates");
    return request<{ deleted: boolean }>(`/dates/${id}`, {
      method: "DELETE",
      noRetry: true,
    });
  },

  /* ============================================================
     READING
     ============================================================ */
  listBooks(): Promise<BookItem[]> {
    return request<BookItem[]>("/reading/books");
  },

  getBook(id: string): Promise<BookItem> {
    return request<BookItem>(`/reading/books/${id}`);
  },

  createBook(input: {
    title: string;
    author?: string;
    description?: string;
    pageCount?: number;
    externalUrl?: string;
  }): Promise<BookItem> {
    invalidateCache("/home");
    invalidateCache("/reading");
    return request<BookItem>("/reading/books", {
      method: "POST",
      body: input,
      noRetry: true,
    });
  },

  updateBook(
    id: string,
    input: {
      title?: string;
      author?: string | null;
      description?: string | null;
      pageCount?: number | null;
      status?: "ACTIVE" | "COMPLETED" | "ARCHIVED";
    },
  ): Promise<BookItem> {
    invalidateCache("/home");
    invalidateCache("/reading");
    return request<BookItem>(`/reading/books/${id}`, {
      method: "PATCH",
      body: input,
      noRetry: true,
    });
  },

  archiveBook(id: string): Promise<{ archived: boolean }> {
    invalidateCache("/home");
    invalidateCache("/reading");
    return request<{ archived: boolean }>(`/reading/books/${id}`, {
      method: "DELETE",
      noRetry: true,
    });
  },

  updateReadingProgress(input: {
    bookId: string;
    currentPage: number;
    pagesRead: number;
    totalReadSeconds?: number;
  }): Promise<ReadingProgressItem> {
    invalidateCache("/home");
    invalidateCache("/reading");
    return request<ReadingProgressItem>("/reading/progress", {
      method: "POST",
      body: input,
      noRetry: true,
    });
  },

  /* ============================================================
     CHALLENGES
     ============================================================ */
  listChallenges(): Promise<ChallengeItem[]> {
    return request<ChallengeItem[]>("/challenges");
  },

  getChallenge(id: string): Promise<ChallengeItem> {
    return request<ChallengeItem>(`/challenges/${id}`);
  },

  createChallenge(input: {
    title: string;
    description?: string;
    type?: ChallengeType;
    bookId?: string | null;
    targetValue?: number | null;
    startsAt?: string | null;
    endsAt?: string | null;
    rules?: Record<string, unknown>;
  }): Promise<ChallengeItem> {
    invalidateCache("/home");
    invalidateCache("/challenges");
    return request<ChallengeItem>("/challenges", {
      method: "POST",
      body: input,
      noRetry: true,
    });
  },

  joinChallenge(id: string): Promise<ChallengeItem> {
    invalidateCache("/challenges");
    return request<ChallengeItem>(`/challenges/${id}/join`, {
      method: "POST",
      noRetry: true,
    });
  },

  updateChallengeProgress(
    id: string,
    input: { score?: number; progress?: number },
  ): Promise<{
    score: number;
    progress: number;
    user: { id: string; firstName: string | null; photoUrl: string | null };
  }> {
    invalidateCache("/challenges");
    return request(`/challenges/${id}/progress`, {
      method: "POST",
      body: input,
      noRetry: true,
    });
  },

  completeChallenge(id: string): Promise<ChallengeItem> {
    invalidateCache("/home");
    invalidateCache("/challenges");
    return request<ChallengeItem>(`/challenges/${id}/complete`, {
      method: "POST",
      noRetry: true,
    });
  },

  cancelChallenge(id: string): Promise<{ cancelled: boolean }> {
    invalidateCache("/challenges");
    return request<{ cancelled: boolean }>(`/challenges/${id}`, {
      method: "DELETE",
      noRetry: true,
    });
  },

  /* ============================================================
     BOMB GAME
     ============================================================ */
  createBombRoom(input: {
    size: number;
    reward: string;
  }): Promise<{
    code: string;
    size: number;
    bombCount: number;
    reward: string;
  }> {
    invalidateCache("/games/bomb");
    return request("/games/bomb/create", {
      method: "POST",
      body: input,
      noRetry: true,
    });
  },

  getBombRoom(code: string): Promise<{
    code: string;
    status: string;
    size: number;
    bombCount: number;
    reward: string;
    playerCount: number;
    isMember: boolean;
  }> {
    return request(`/games/bomb/${encodeURIComponent(code)}`, {
      noCache: true,
    });
  },

  joinBombRoom(code: string): Promise<{
    code: string;
    status: string;
    size: number;
    bombCount: number;
    reward: string;
  }> {
    invalidateCache("/games/bomb");
    return request(`/games/bomb/${encodeURIComponent(code)}/join`, {
      method: "POST",
      noRetry: true,
    });
  },

  getMyBombRoom(): Promise<{
    code: string;
    status: string;
    size: number;
    bombCount: number;
    reward: string;
  } | null> {
    return request("/games/bomb/my", { noCache: true });
  },

  getBombWsToken(roomCode: string): Promise<{
    token: string;
    expiresAt: number;
    code: string;
  }> {
    return request("/games/bomb/ws-token", {
      method: "POST",
      body: { roomCode },
      noRetry: true,
      noCache: true,
    });
  },

  getBombHistory(options?: { limit?: number }): Promise<
    Array<{
      id: string;
      code: string;
      status: string;
      size: number;
      bombCount: number;
      reward: string;
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
        hits: number;
      }>;
      startedAt: string | null;
      finishedAt: string | null;
      createdAt: string;
      myResult: "WIN" | "LOSS" | "DRAW" | "IN_PROGRESS" | "CANCELLED";
    }>
  > {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    return request(`/games/bomb/history${qs ? `?${qs}` : ""}`, {
      noCache: true,
    });
  },

  /* ============================================================
     TIC-TAC-TOE
     ============================================================ */
  createTttRoom(input: { size: number }): Promise<{
    code: string;
    size: number;
    winLength: number;
  }> {
    invalidateCache("/games/tictactoe");
    return request("/games/tictactoe/create", {
      method: "POST",
      body: input,
      noRetry: true,
    });
  },

  getTttRoom(code: string): Promise<{
    code: string;
    status: string;
    size: number;
    winLength: number;
    playerCount: number;
    isMember: boolean;
  }> {
    return request(`/games/tictactoe/${encodeURIComponent(code)}`, {
      noCache: true,
    });
  },

  joinTttRoom(code: string): Promise<{
    code: string;
    status: string;
    size: number;
    winLength: number;
  }> {
    invalidateCache("/games/tictactoe");
    return request(`/games/tictactoe/${encodeURIComponent(code)}/join`, {
      method: "POST",
      noRetry: true,
    });
  },

  getMyTttRoom(): Promise<{
    code: string;
    status: string;
    size: number;
    winLength: number;
  } | null> {
    return request("/games/tictactoe/my", { noCache: true });
  },

  getTttWsToken(roomCode: string): Promise<{
    token: string;
    expiresAt: number;
    code: string;
  }> {
    return request("/games/tictactoe/ws-token", {
      method: "POST",
      body: { roomCode },
      noRetry: true,
      noCache: true,
    });
  },

  getTttHistory(options?: { limit?: number }): Promise<TttHistoryItem[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    return request(`/games/tictactoe/history${qs ? `?${qs}` : ""}`, {
      noCache: true,
    });
  },
};

/* ============================================================
   ERROR HELPERS
   ============================================================ */
export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function humanizeError(err: unknown): string {
  if (isApiError(err)) {
    switch (err.code) {
      case "NETWORK_ERROR":
        return "Serverga ulanib bo'lmadi. Internetni tekshiring.";
      case "TIMEOUT":
        return "So'rov juda uzoq davom etdi. Qayta urinib ko'ring.";
      case "UNAUTHORIZED":
      case "INVALID_TELEGRAM_INIT_DATA":
        return "Sessiya tugadi. Iltimos, Telegram'dan qayta oching.";
      case "TELEGRAM_INIT_DATA_EXPIRED":
        return "Sessiya muddati tugadi. Iltimos, Telegram'dan qayta oching.";
      case "FORBIDDEN":
        return "Sizda ruxsat yo'q.";
      case "RESOURCE_NOT_FOUND":
        return "Topilmadi.";
      case "COUPLE_MEMBERSHIP_REQUIRED":
        return "Avval juftlik yarating.";
      case "ALREADY_IN_COUPLE":
        return "Siz allaqachon juftlikdasiz.";
      case "COUPLE_FULL":
        return "Bu juftlik allaqachon to'la.";
      case "INVITE_NOT_FOUND":
        return "Taklif topilmadi.";
      case "INVITE_EXPIRED":
        return "Taklif muddati tugagan.";
      case "SELF_INVITE":
        return "O'zingizni taklif qila olmaysiz.";
      case "RATE_LIMITED":
        return "Juda ko'p so'rov. Biroz kuting.";
      case "GAME_NOT_FOUND":
        return "O'yin topilmadi.";
      case "GAME_FULL":
        return "O'yin to'la.";
      case "GAME_IN_PROGRESS":
        return "Sizda faol o'yin bor.";
      case "GAME_ALREADY_STARTED":
        return "Bu o'yin allaqachon boshlangan.";
      case "GAME_ALREADY_FINISHED":
        return "Bu o'yin tugagan.";
      case "GAME_PAUSED":
        return "O'yin vaqtincha to'xtatilgan.";
      case "NOT_YOUR_TURN":
        return "Hozir sizning navbatingiz emas.";
      case "CELL_ALREADY_REVEALED":
        return "Bu katak allaqachon ochilgan.";
      case "CELL_OCCUPIED":
        return "Bu katak band.";
      case "INVALID_STATE":
        return "O'yin holati noto'g'ri.";
      case "VALIDATION_ERROR":
        return err.message || "Ma'lumot xato.";
      default:
        return err.message || "Xatolik yuz berdi.";
    }
  }
  if (err instanceof Error) return err.message;
  return "Xatolik yuz berdi.";
}