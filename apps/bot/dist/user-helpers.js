/* ============================================================
   BOT — User helpers
   Fetch user from DB with language, referral code
   ============================================================ */
import { db } from "@couples/database";
import { detectLanguage } from "./i18n/index.js";
/**
 * Fetch a user by Telegram ID.
 * Returns null if not found.
 */
export async function getBotUser(telegramId) {
    const id = typeof telegramId === "string" ? BigInt(telegramId) : BigInt(telegramId);
    const user = await db.user.findUnique({
        where: { telegramId: id },
        select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true,
            languageCode: true,
            language: true,
            photoUrl: true,
            status: true,
            referralCode: true,
            referralCount: true,
            createdAt: true,
            lastSeenAt: true,
        },
    });
    if (!user)
        return null;
    return {
        ...user,
        telegramId: user.telegramId.toString(),
        language: user.language,
    };
}
/**
 * Get user's preferred language (from DB or Telegram).
 */
export function getUserLang(user, telegramLangCode) {
    if (user?.language)
        return user.language;
    return detectLanguage(telegramLangCode);
}
/**
 * Generate a unique referral code for a user.
 * Format: 8 random uppercase alphanumeric characters.
 */
export function generateReferralCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i += 1) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
