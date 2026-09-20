import type { FastifyRequest } from "fastify";

import { ApiError } from "./common/errors/api-error.js";
import {
  authenticate as authenticateMiddleware,
  requireCouple,
} from "./auth/auth.middleware.js";

/**
 * Backward-compatible authentication helper.
 *
 * The real Telegram authentication is handled by
 * the existing auth middleware.
 */
export async function authenticate(
  request: FastifyRequest,
): Promise<void> {
  await authenticateMiddleware(request);
}

/**
 * Explicit authentication helper.
 */
export async function authenticateRequest(
  request: FastifyRequest,
): Promise<void> {
  await authenticateMiddleware(request);
}

/**
 * Require an authenticated Telegram user.
 */
export function requireAuth(
  request: FastifyRequest,
): NonNullable<FastifyRequest["auth"]> {
  if (!request.auth) {
    throw new ApiError(
      "UNAUTHORIZED",
      "Authentication required",
      401,
    );
  }

  return request.auth;
}

/**
 * Require an authenticated user with an active couple.
 *
 * The active couple is resolved from backend membership.
 * Frontend input is never trusted for couple identity.
 */
export async function requireAuthenticatedCouple(
  request: FastifyRequest,
): Promise<NonNullable<FastifyRequest["couple"]>> {
  if (!request.auth) {
    throw new ApiError(
      "UNAUTHORIZED",
      "Authentication required",
      401,
    );
  }

  await requireCouple(request);

  if (!request.couple) {
    throw new ApiError(
      "COUPLE_NOT_FOUND",
      "No active couple found",
      404,
    );
  }

  return request.couple;
}

/**
 * Backward-compatible helper.
 *
 * Returns the authenticated user context.
 */
export function getAuth(
  request: FastifyRequest,
): NonNullable<FastifyRequest["auth"]> {
  return requireAuth(request);
}

/**
 * Backward-compatible helper.
 *
 * Returns the active couple context.
 */
export function getCouple(
  request: FastifyRequest,
): NonNullable<FastifyRequest["couple"]> {
  if (!request.couple) {
    throw new ApiError(
      "COUPLE_NOT_FOUND",
      "No active couple found",
      404,
    );
  }

  return request.couple;
}