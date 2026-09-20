/* ============================================================
   BOT ADMIN — Auth check
   ============================================================ */
import { env } from "@couples/config";
export function isAdmin(telegramId) {
    const str = typeof telegramId === "string"
        ? telegramId
        : telegramId.toString();
    return env.ADMIN_TELEGRAM_IDS.has(str);
}
