import type { FastifyInstance, FastifyRequest } from "fastify";
import { env } from "@couples/config";
import { validateTelegramInitData } from "./telegram.js";
import { authService } from "./auth.service.js";
import type { AuthenticatedUser, CoupleContext } from "./auth.types.js";
import { coupleContextService } from "../couples/couple-context.service.js";
import { ApiError } from "../common/errors/api-error.js";

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthenticatedUser;
    couple?: CoupleContext;
  }
}

function getInitData(request: FastifyRequest): string {
  const header = request.headers["x-telegram-init-data"];
  if (typeof header !== "string" || !header) {
    throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
  }
  return header;
}

export async function authenticate(request: FastifyRequest) {
  const identity = validateTelegramInitData(
    getInitData(request),
    env.BOT_TOKEN,
    env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS,
  );
  request.auth = await authService.resolveUser(identity);
}

export async function requireCouple(request: FastifyRequest) {
  if (!request.auth) {
    throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
  }
  request.couple = await coupleContextService.getActiveCoupleForUser(
    request.auth.id,
  );
}

/**
 * Paths that must be EXCLUDED from global auth.
 *
 * ⚠️ IMPORTANT: Use EXACT match (===) for WebSocket paths.
 * Using startsWith("/ws") would also match "/ws-token" (wrong).
 */
function shouldSkipAuth(request: FastifyRequest): boolean {
  if (request.method === "OPTIONS") return true;

  /* Strip query string */
  const url = request.url;
  const path = url.split("?")[0] ?? "";

  /* Health */
  if (path === "/health" || path === "/health/ready") return true;

  /* WebSocket endpoints — EXACT match only */
  if (path === "/v1/games/bomb/ws") return true;
  if (path === "/v1/games/tictactoe/ws") return true;

  return false;
}

export function registerAuthHooks(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    if (shouldSkipAuth(request)) return;
    await authenticate(request);
  });
}