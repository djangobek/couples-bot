/* ============================================================
   BOT — Profile handler
   /profile, /stats
   ============================================================ */
import { InlineKeyboard } from "grammy";
import { db } from "@couples/database";
import { getBotUser, getUserLang } from "../user-helpers.js";
import { t } from "../i18n/index.js";
function escapeHtml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
function formatDate(d) {
    try {
        return d.toLocaleDateString("uz-UZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }
    catch {
        return "—";
    }
}
function timeAgo(d) {
    if (!d)
        return "—";
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60)
        return "hozir";
    if (diff < 3600)
        return `${Math.floor(diff / 60)} daq oldin`;
    if (diff < 86400)
        return `${Math.floor(diff / 3600)} soat oldin`;
    if (diff < 604800)
        return `${Math.floor(diff / 86400)} kun oldin`;
    return formatDate(d);
}
/* ============================================================
   Register handlers
   ============================================================ */
export function registerProfileHandler(bot) {
    /* ============ /profile ============ */
    bot.command("profile", async (ctx) => {
        await showProfile(ctx);
    });
    /* ============ /stats ============ */
    bot.command("stats", async (ctx) => {
        await showStats(ctx);
    });
}
/* ============================================================
   Show profile
   ============================================================ */
async function showProfile(ctx) {
    const from = ctx.from;
    if (!from)
        return;
    const user = await getBotUser(from.id);
    if (!user) {
        await ctx.reply("User topilmadi. /start yuboring.");
        return;
    }
    const lang = getUserLang(user, from.language_code);
    /* Fetch stats from DB */
    const [gamePlayers, wonGames, memberships] = await Promise.all([
        db.gamePlayer.count({ where: { userId: user.id } }),
        db.gameSession.count({ where: { winnerId: user.id } }),
        db.coupleMember.count({
            where: { userId: user.id, leftAt: null },
        }),
    ]);
    const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ");
    const lines = [
        t(lang, "profile.title"),
        "",
        `<b>${t(lang, "profile.name")}:</b> ${escapeHtml(fullName || "—")}`,
        user.username
            ? `<b>${t(lang, "profile.username")}:</b> @${escapeHtml(user.username)}`
            : null,
        `<b>${t(lang, "profile.telegramId")}:</b> <code>${user.telegramId}</code>`,
        `<b>${t(lang, "profile.language")}:</b> ${user.language.toUpperCase()}`,
        `<b>${t(lang, "profile.registeredAt")}:</b> ${formatDate(user.createdAt)}`,
        user.lastSeenAt
            ? `<b>${t(lang, "profile.lastSeen")}:</b> ${timeAgo(user.lastSeenAt)}`
            : null,
        "",
        t(lang, "profile.stats"),
        `  🎮 ${t(lang, "profile.gamesPlayed")}: <b>${gamePlayers}</b>`,
        `  🏆 ${t(lang, "profile.gamesWon")}: <b>${wonGames}</b>`,
        `  💑 ${t(lang, "profile.couplesCount")}: <b>${memberships}</b>`,
        `  🎁 ${t(lang, "profile.referralCount")}: <b>${user.referralCount}</b>`,
    ];
    const kb = new InlineKeyboard()
        .text("🎁 Do'stni taklif qilish", "referral:show")
        .row()
        .text("🏠 Bosh menyu", "menu:main");
    await ctx.reply(lines.filter((l) => l !== null).join("\n"), {
        reply_markup: kb,
        parse_mode: "HTML",
    });
}
/* ============================================================
   Show stats
   ============================================================ */
async function showStats(ctx) {
    const from = ctx.from;
    if (!from)
        return;
    const user = await getBotUser(from.id);
    if (!user) {
        await ctx.reply("User topilmadi. /start yuboring.");
        return;
    }
    /* Detailed stats */
    const [gamesBomb, gamesTtt, wonGames, totalGames] = await Promise.all([
        db.gamePlayer.count({
            where: { userId: user.id, session: { type: "BOMB" } },
        }),
        db.gamePlayer.count({
            where: { userId: user.id, session: { type: "TIC_TAC_TOE" } },
        }),
        db.gameSession.count({ where: { winnerId: user.id } }),
        db.gamePlayer.count({ where: { userId: user.id } }),
    ]);
    const winRate = totalGames > 0 ? Math.round((wonGames / totalGames) * 100) : 0;
    const lines = [
        "📊 <b>STATISTIKA</b>",
        "",
        `💣 Bomba: <b>${gamesBomb}</b>`,
        `⭕ X-O: <b>${gamesTtt}</b>`,
        `🎮 Jami: <b>${totalGames}</b>`,
        `🏆 G'alabalar: <b>${wonGames}</b>`,
        `📈 G'alaba foizi: <b>${winRate}%</b>`,
    ];
    await ctx.reply(lines.join("\n"), { parse_mode: "HTML" });
}
