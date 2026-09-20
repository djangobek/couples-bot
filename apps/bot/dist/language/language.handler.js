/* ============================================================
   BOT — Language handler
   /language command + callback queries
   ============================================================ */
import { InlineKeyboard } from "grammy";
import { db } from "@couples/database";
import { getBotUser, getUserLang } from "../user-helpers.js";
import { t } from "../i18n/index.js";
export function registerLanguageHandler(bot) {
    /* ============ /language ============ */
    bot.command("language", async (ctx) => {
        const from = ctx.from;
        if (!from)
            return;
        const user = await getBotUser(from.id);
        const lang = getUserLang(user, from.language_code);
        await ctx.reply(t(lang, "language.title"), {
            reply_markup: languageKeyboard(lang),
            parse_mode: "HTML",
        });
    });
    /* ============ Callback: lang:menu ============ */
    bot.callbackQuery("lang:menu", async (ctx) => {
        const from = ctx.from;
        if (!from)
            return;
        const user = await getBotUser(from.id);
        const lang = getUserLang(user, from.language_code);
        await ctx.answerCallbackQuery();
        await ctx.reply(t(lang, "language.title"), {
            reply_markup: languageKeyboard(lang),
            parse_mode: "HTML",
        });
    });
    /* ============ Callback: lang:set:xx ============ */
    bot.callbackQuery(/^lang:set:(uz|ru|en)$/, async (ctx) => {
        const from = ctx.from;
        if (!from)
            return;
        const match = ctx.match;
        const newLang = (match?.[1] ?? "uz");
        const user = await getBotUser(from.id);
        if (!user) {
            await ctx.answerCallbackQuery({ text: "User topilmadi" });
            return;
        }
        /* Update DB */
        await db.user.update({
            where: { id: user.id },
            data: { language: newLang.toUpperCase() },
        });
        await ctx.answerCallbackQuery({
            text: t(newLang, "language.changed"),
            show_alert: false,
        });
        /* Re-render language menu */
        try {
            await ctx.editMessageText(t(newLang, "language.title"), {
                reply_markup: languageKeyboard(newLang),
                parse_mode: "HTML",
            });
        }
        catch {
            /* ignore */
        }
    });
}
/* ---------- Keyboard ---------- */
function languageKeyboard(current) {
    const kb = new InlineKeyboard();
    const langs = [
        { code: "uz", label: "O'zbekcha", emoji: "🇺🇿" },
        { code: "ru", label: "Русский", emoji: "🇷🇺" },
        { code: "en", label: "English", emoji: "🇬🇧" },
    ];
    for (const l of langs) {
        const check = l.code === current ? "✅ " : "";
        kb.text(`${check}${l.emoji} ${l.label}`, `lang:set:${l.code}`).row();
    }
    return kb;
}
