import crypto from "node:crypto";
import { ApiError } from "../common/errors/api-error.js";

export type TelegramIdentity = {
  id: bigint;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  photoUrl?: string;
};

function safeEqualHex(left: string, right: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return crypto.timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number,
  nowMs = Date.now(),
): TelegramIdentity {
  if (!initData || initData.length > 16_384) {
    throw new ApiError("INVALID_TELEGRAM_INIT_DATA", "Invalid Telegram initData", 401);
  }

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    throw new ApiError("INVALID_TELEGRAM_INIT_DATA", "Invalid Telegram initData", 401);
  }

  const receivedHash = params.get("hash");
  if (!receivedHash) {
    throw new ApiError("INVALID_TELEGRAM_INIT_DATA", "Telegram initData hash is missing", 401);
  }

  const authDateRaw = params.get("auth_date");
  const authDate = Number(authDateRaw);
  if (!authDateRaw || !Number.isSafeInteger(authDate) || authDate <= 0) {
    throw new ApiError("INVALID_TELEGRAM_INIT_DATA", "Telegram auth_date is invalid", 401);
  }

  const age = nowMs / 1000 - authDate;
  if (age > maxAgeSeconds || age < -60) {
    throw new ApiError("TELEGRAM_INIT_DATA_EXPIRED", "Telegram initData has expired", 401);
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (!safeEqualHex(calculatedHash, receivedHash)) {
    throw new ApiError("INVALID_TELEGRAM_INIT_DATA", "Telegram initData signature is invalid", 401);
  }

  const rawUser = params.get("user");
  if (!rawUser) {
    throw new ApiError("INVALID_TELEGRAM_INIT_DATA", "Telegram user is missing", 401);
  }

  let user: unknown;
  try {
    user = JSON.parse(rawUser);
  } catch {
    throw new ApiError("INVALID_TELEGRAM_INIT_DATA", "Telegram user data is malformed", 401);
  }

  if (!user || typeof user !== "object" || !("id" in user)) {
    throw new ApiError("INVALID_TELEGRAM_INIT_DATA", "Telegram user data is invalid", 401);
  }

  const telegramUser = user as Record<string, unknown>;
  const id = telegramUser.id;
  if (
    typeof id !== "number" &&
    typeof id !== "string" &&
    typeof id !== "bigint"
  ) {
    throw new ApiError("INVALID_TELEGRAM_INIT_DATA", "Telegram user id is invalid", 401);
  }

  let telegramId: bigint;
  try {
    telegramId = BigInt(id);
  } catch {
    throw new ApiError("INVALID_TELEGRAM_INIT_DATA", "Telegram user id is invalid", 401);
  }

  const optionalString = (value: unknown) => (typeof value === "string" ? value : undefined);

  return {
    id: telegramId,
    username: optionalString(telegramUser.username),
    firstName: optionalString(telegramUser.first_name),
    lastName: optionalString(telegramUser.last_name),
    languageCode: optionalString(telegramUser.language_code),
    photoUrl: optionalString(telegramUser.photo_url),
  };
}
