/* ============================================================
   BOT — Referral handler
   /referral command + callback + auto-generated link
   ============================================================ */
import { InlineKeyboard } from "grammy";
import { env } from "@couples/config";
import { db } from "@couples/database";
import { getBotUser, getUserLang, generateReferralCode } from "../user-helpers.js";
import { t } from "../i18n/index.js";
export function registerReferralHandler(bot) {
    /* ============ /referral ============ */
    bot.command("referral", async (ctx) => {
        await showReferral(ctx);
    });
    /* ============ Callback: referral:show ============ */
    bot.callbackQuery("referral:show", async (ctx) => {
        await ctx.answerCallbackQuery();
        await showReferral(ctx);
    });
    /* ============ Callback: referral:copy ============ */
    bot.callbackQuery("referral:copy", async (ctx) => {
        const from = ctx.from;
        if (!from)
            return;
        const user = await getBotUser(from.id);
        if (!user?.referralCode) {
            await ctx.answerCallbackQuery({ text: "Kod yo'q" });
            return;
        }
        const lang = getUserLang(user, from.language_code);
        const botUsername = env.BOT_USERNAME || "bot";
        const link = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;
        await ctx.answerCallbackQuery({
            text: t(lang, "referral.copied"),
            show_alert: false,
        });
        /* Copy via separate message */
        await ctx.reply(`<code>${link}</code>`, { parse_mode: "HTML" });
    });
}
async function showReferral(ctx) {
    const from = ctx.from;
    if (!from)
        return;
    let user = await getBotUser(from.id);
    if (!user) {
        await ctx.reply("User topilmadi. /start yuboring.");
        return;
    }
    const lang = getUserLang(user, from.language_code);
    /* Ensure referral code exists */
    if (!user.referralCode) {
        const code = generateReferralCode();
        await db.user.update({
            where: { id: user.id },
            data: { referralCode: code },
        });
        user = { ...user, referralCode: code };
    }
    /* Get current count */
    const count = await db.referral.count({
        where: { referrerId: user.id },
    });
    const botUsername = env.BOT_USERNAME || "bot";
    const link = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;
    const lines = [
        t(lang, "referral.title"),
        "",
        t(lang, "referral.description"),
        "",
        `<b>${t(lang, "referral.yourCode")}</b>`,
        `<code>${user.referralCode}</code>`,
        "",
        `<b>${t(lang, "referral.yourLink")}</b>`,
        `<code>${link}</code>`,
        "",
        t(lang, "referral.stats", { count }),
        "",
        t(lang, "referral.howItWorks"),
        t(lang, "referral.step1"),
        t(lang, "referral.step2"),
        t(lang, "referral.step3"),
    ];
    const shareText = encodeURIComponent("❤️ Couples — juftlik uchun maxfiy dunyo. Do'stim, sen ham qo'shil!");
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${shareText}`;
    const kb = new InlineKeyboard()
        .url(t(lang, "referral.shareBtn"), shareUrl)
        .row()
        .text(t(lang, "referral.copyBtn"), "referral:copy")
        .row()
        .text("🏠 Bosh menyu", "menu:main");
    await ctx.reply(lines.join("\n"), {
        reply_markup: kb,
        parse_mode: "HTML",
    });
}
