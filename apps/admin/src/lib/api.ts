/* ============================================================
   ADMIN — Centralized API client
   ============================================================ */

import { ApiError } from "../types/admin";
import type {
  ApiResponse,
  AdminMeResponse,
  DashboardStats,
  DashboardActivity,
  PaginatedResult,
  AdminUserListItem,
  AdminUserDetail,
  AdminGameListItem,
  AdminGameDetail,
  AdminLogItem,
  StatisticsResponse,
  StatPeriod,
  UserStatus,
  GameType,
  GameSessionStatus,
} from "../types/admin";
import { getInitData } from "./telegram";

const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3001";

const API_PREFIX = "/v1";
const TIMEOUT_MS = 30_000;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  auth?: boolean;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, signal, auth = true } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const initData = getInitData();
    if (initData) {
      headers["X-Telegram-Init-Data"] = initData;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: "omit",
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if ((err as Error).name === "AbortError" && signal?.aborted) {
      throw err;
    }
    throw new ApiError(
      "Serverga ulanib bo'lmadi",
      "NETWORK_ERROR",
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    /* non-JSON */
  }

  if (!response.ok || !payload || payload.success === false) {
    const errPayload =
      payload && payload.success === false ? payload.error : undefined;

    throw new ApiError(
      errPayload?.message ?? `So'rov muvaffaqiyatsiz (${response.status})`,
      errPayload?.code ?? "REQUEST_FAILED",
      response.status,
      errPayload?.requestId,
      errPayload?.details,
    );
  }

  return payload.data;
}

/* ============================================================
   ENDPOINTS
   ============================================================ */

export const adminApi = {
  /* ---------- Auth ---------- */
  me(): Promise<AdminMeResponse> {
    return request<AdminMeResponse>("/auth/me");
  },

  /* ---------- Dashboard ---------- */
  dashboard(): Promise<DashboardStats> {
    return request<DashboardStats>("/admin/dashboard");
  },

  dashboardActivity(options?: {
    cursor?: string;
    limit?: number;
  }): Promise<DashboardActivity> {
    const params = new URLSearchParams();
    if (options?.cursor) params.set("cursor", options.cursor);
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    return request<DashboardActivity>(
      `/admin/dashboard/activity${qs ? `?${qs}` : ""}`,
    );
  },

  /* ---------- Users ---------- */
  users(options?: {
    search?: string;
    status?: UserStatus;
    sortBy?: "createdAt" | "lastSeenAt" | "username";
    sortDir?: "asc" | "desc";
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedResult<AdminUserListItem>> {
    const params = new URLSearchParams();
    if (options?.search) params.set("search", options.search);
    if (options?.status) params.set("status", options.status);
    if (options?.sortBy) params.set("sortBy", options.sortBy);
    if (options?.sortDir) params.set("sortDir", options.sortDir);
    if (options?.cursor) params.set("cursor", options.cursor);
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    return request<PaginatedResult<AdminUserListItem>>(
      `/admin/users${qs ? `?${qs}` : ""}`,
    );
  },

  user(id: string): Promise<AdminUserDetail> {
    return request<AdminUserDetail>(`/admin/users/${id}`);
  },

  blockUser(id: string): Promise<{ blocked: boolean }> {
    return request<{ blocked: boolean }>(`/admin/users/${id}/block`, {
      method: "POST",
    });
  },

  unblockUser(id: string): Promise<{ unblocked: boolean }> {
    return request<{ unblocked: boolean }>(`/admin/users/${id}/unblock`, {
      method: "POST",
    });
  },

  /* ---------- Games ---------- */
  games(options?: {
    search?: string;
    type?: GameType;
    status?: GameSessionStatus;
    sortBy?: "createdAt" | "finishedAt";
    sortDir?: "asc" | "desc";
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedResult<AdminGameListItem>> {
    const params = new URLSearchParams();
    if (options?.search) params.set("search", options.search);
    if (options?.type) params.set("type", options.type);
    if (options?.status) params.set("status", options.status);
    if (options?.sortBy) params.set("sortBy", options.sortBy);
    if (options?.sortDir) params.set("sortDir", options.sortDir);
    if (options?.cursor) params.set("cursor", options.cursor);
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    return request<PaginatedResult<AdminGameListItem>>(
      `/admin/games${qs ? `?${qs}` : ""}`,
    );
  },

  game(id: string): Promise<AdminGameDetail> {
    return request<AdminGameDetail>(`/admin/games/${id}`);
  },

  abandonGame(id: string): Promise<{ abandoned: boolean }> {
    return request<{ abandoned: boolean }>(`/admin/games/${id}/abandon`, {
      method: "POST",
    });
  },

  /* ---------- Logs ---------- */
  logs(options?: {
    search?: string;
    action?: string;
    entity?: string;
    actorId?: string;
    fromDate?: string;
    toDate?: string;
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedResult<AdminLogItem>> {
    const params = new URLSearchParams();
    if (options?.search) params.set("search", options.search);
    if (options?.action) params.set("action", options.action);
    if (options?.entity) params.set("entity", options.entity);
    if (options?.actorId) params.set("actorId", options.actorId);
    if (options?.fromDate) params.set("fromDate", options.fromDate);
    if (options?.toDate) params.set("toDate", options.toDate);
    if (options?.cursor) params.set("cursor", options.cursor);
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    return request<PaginatedResult<AdminLogItem>>(
      `/admin/logs${qs ? `?${qs}` : ""}`,
    );
  },

  logActions(): Promise<string[]> {
    return request<string[]>("/admin/logs/actions");
  },

  logEntities(): Promise<string[]> {
    return request<string[]>("/admin/logs/entities");
  },

  /* ---------- Statistics ---------- */
  statistics(options?: {
    period?: StatPeriod;
    fromDate?: string;
    toDate?: string;
  }): Promise<StatisticsResponse> {
    const params = new URLSearchParams();
    if (options?.period) params.set("period", options.period);
    if (options?.fromDate) params.set("fromDate", options.fromDate);
    if (options?.toDate) params.set("toDate", options.toDate);
    const qs = params.toString();
    return request<StatisticsResponse>(
      `/admin/statistics${qs ? `?${qs}` : ""}`,
    );
  },

  /* ---------- System ---------- */
  system(): Promise<import("../types/admin").SystemStatus> {
    return request<import("../types/admin").SystemStatus>("/admin/system");
  },
};

/* ---------- Error helper ---------- */
export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function humanizeError(err: unknown): string {
  if (isApiError(err)) {
    switch (err.code) {
      case "NETWORK_ERROR":
        return "Serverga ulanib bo'lmadi. Internetni tekshiring.";
      case "UNAUTHORIZED":
        return "Sessiya tugadi. Iltimos, qayta oching.";
      case "FORBIDDEN":
        return "Sizda admin ruxsati yo'q.";
      case "RESOURCE_NOT_FOUND":
        return "Topilmadi.";
      default:
        return err.message || "Xatolik yuz berdi.";
    }
  }
  if (err instanceof Error) return err.message;
  return "Xatolik yuz berdi.";
}