export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_TELEGRAM_INIT_DATA"
  | "TELEGRAM_INIT_DATA_EXPIRED"
  | "USER_NOT_FOUND"
  | "COUPLE_NOT_FOUND"
  | "COUPLE_MEMBERSHIP_REQUIRED"
  | "FORBIDDEN"
  | "RESOURCE_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "ALREADY_IN_COUPLE"
  | "COUPLE_FULL"
  | "INVITE_NOT_FOUND"
  | "INVITE_EXPIRED"
  | "INVITE_ALREADY_ACCEPTED"
  | "INVITE_REVOKED"
  | "SELF_INVITE"
  | "INTERNAL_SERVER_ERROR"
  /* ---------- Game codes ---------- */
  | "GAME_NOT_FOUND"
  | "GAME_FULL"
  | "GAME_ALREADY_STARTED"
  | "GAME_ALREADY_FINISHED"
  | "GAME_IN_PROGRESS"
  | "GAME_PAUSED"
  | "INVALID_STATE"
  | "NOT_YOUR_TURN"
  | "CELL_ALREADY_REVEALED"
  | "CELL_OCCUPIED"
  | "ACTION_FAILED";

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}