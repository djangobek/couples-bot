/* ============================================================
   ADMIN — Middleware
   Checks that the authenticated user is an admin
   ============================================================ */

import type { FastifyRequest } from "fastify";
import { env } from "@couples/config";
import { ApiError } from "../common/errors/api-error.js";

/**
 * Require the authenticated user to be an admin.
 *
 * Uses `ADMIN_TELEGRAM_IDS` from environment.
 * Must be used AFTER the global auth middleware
 * (so `request.auth` is populated).
 *
 * Returns the authenticated user for convenience.
 */
export function requireAdmin(request: FastifyRequest): {
  id: string;
  telegramId: bigint;
} {
  if (!request.auth) {
    throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const telegramIdStr = request.auth.telegramId.toString();

  if (!env.ADMIN_TELEGRAM_IDS.has(telegramIdStr)) {
    /* Do NOT reveal admin existence */
    throw new ApiError("FORBIDDEN", "Access denied", 403);
  }

  return {
    id: request.auth.id,
    telegramId: request.auth.telegramId,
  };
}

/**
 * Helper: check if a given Telegram ID is an admin.
 * Useful in non-route contexts (bot, etc.)
 */
export function isAdminTelegramId(telegramId: bigint | number | string): boolean {
  const str =
    typeof telegramId === "string"
      ? telegramId
      : telegramId.toString();
  return env.ADMIN_TELEGRAM_IDS.has(str);
}