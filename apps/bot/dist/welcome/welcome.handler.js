/* ============================================================
   BOT — Welcome handler
   Handles /start, /help, and deep-links (invite/bomb/ttt)
   ============================================================ */
import { InlineKeyboard } from "grammy";
import { env } from "@couples/config";
import { upsertTelegramUser } from "../user.service.js";
import { getBotUser, getUserLang, generateReferralCode, } from "../user-helpers.js";
import { botSubscriptionService } from "../subscription/subscription.service.js";
import { t } from "../i18n/index.js";
import { db } from "@couples/database";
/* ---------- Deep-link parsers ---------- */
function inviteFromStart(text) {
    const m = text?.trim().match(/^\/start(?:@[^\s]+)?\s+invite_([A-Za-z0-9_-]{32,128})$/i);
    return m?.[1] ?? null;
}
function bombFromStart(text) {
    const m = text?.trim().match(/^\/start(?:@[^\s]+)?\s+bomb_([A-Z0-9]{6})$/i);
    return m?.[1] ?? null;
}
function tttFromStart(text) {
    const m = text?.trim().match(/^\/start(?:@[^\s]+)?\s+ttt_([A-Z0-9]{6})$/i);
    return m?.[1] ?? null;
}
function referralFromStart(text) {
    const m = text?.trim().match(/^\/start(?:@[^\s]+)?\s+ref_([A-Z0-9]{8})$/i);
    return m?.[1] ?? null;
}
/* ---------- Mini App URL ---------- */
function miniAppUrl(params) {
    const query = new URLSearchParams();
    if (params.inviteCode)
        query.set("invite", params.inviteCode);
    if (params.bombCode)
        query.set("bomb", params.bombCode);
    if (params.tttCode)
        query.set("ttt", params.tttCode);
    const qs = query.toString();
    return qs ? `${env.WEB_APP_URL}?${qs}` : env.WEB_APP_URL;
}
/* ---------- Register ---------- */
export function registerWelcomeHandler(bot) {
    /* ============ /start ============ */
    bot.command("start", async (ctx) => {
        const from = ctx.from;
        if (!from)
            return;
        try {
            /* 1. Upsert user (creates if not exists) */
            await upsertTelegramUser(from);
            /* 2. Ensure referral code exists */
            let user = await getBotUser(from.id);
            if (user && !user.referralCode) {
                const code = generateReferralCode();
                await db.user.update({
                    where: { id: user.id },
                    data: { referralCode: code },
                });
                user = { ...user, referralCode: code };
            }
            if (!user) {
                await ctx.reply("Foydalanuvchi topilmadi. Qayta urinib ko'ring.");
                return;
            }
            const lang = getUserLang(user, from.language_code);
            /* 3. Check subscription (unless admin) */
            const { isAdmin } = await import("../admin/admin.auth.js");
            if (!isAdmin(from.id)) {
                const sub = await botSubscriptionService.check(user.id, from.id);
                if (!sub.isSubscribed) {
                    const kb = new InlineKeyboard();
                    for (const ch of sub.channels) {
                        if (!ch.isMember && ch.link) {
                            kb.url(`➕ ${ch.label}`, ch.link).row();
                        }
                    }
                    kb.text(t(lang, "subscription.checkBtn"), "subscription:check");
                    await ctx.reply([
                        t(lang, "subscription.title"),
                        "",
                        t(lang, "subscription.description"),
                        "",
                        ...sub.channels
                            .filter((c) => !c.isMember)
                            .map((c) => `• ${c.label}`),
                    ].join("\n"), { reply_markup: kb, parse_mode: "HTML" });
                    return;
                }
            }
            /* 4. Parse deep-links */
            const text = ctx.message?.text;
            const inviteCode = inviteFromStart(text);
            const bombCode = bombFromStart(text);
            const tttCode = tttFromStart(text);
            const referralCode = referralFromStart(text);
            /* 5. Handle referral bonus */
            if (referralCode && referralCode !== user.referralCode) {
                await handleReferral(user.id, referralCode);
            }
            /* 6. Deep-link redirects */
            if (tttCode) {
                const url = miniAppUrl({ tttCode });
                const kb = new InlineKeyboard().webApp(t(lang, "start.joinGame"), url);
                await ctx.reply([
                    t(lang, "start.tttInvitation"),
                    "",
                    `<b>${t(lang, "gameInvite.tttCode")}:</b> <code>${tttCode}</code>`,
                ].join("\n"), { reply_markup: kb, parse_mode: "HTML" });
                return;
            }
            if (bombCode) {
                const url = miniAppUrl({ bombCode });
                const kb = new InlineKeyboard().webApp(t(lang, "start.joinGame"), url);
                await ctx.reply([
                    t(lang, "start.bombInvitation"),
                    "",
                    `<b>${t(lang, "gameInvite.bombCode")}:</b> <code>${bombCode}</code>`,
                ].join("\n"), { reply_markup: kb, parse_mode: "HTML" });
                return;
            }
            if (inviteCode) {
                const url = miniAppUrl({ inviteCode });
                const kb = new InlineKeyboard().webApp(t(lang, "start.joinPartner"), url);
                await ctx.reply(t(lang, "start.invitationReceived"), { reply_markup: kb });
                return;
            }
            /* 7. Default welcome */
            const kb = new InlineKeyboard()
                .webApp(t(lang, "start.openApp"), env.WEB_APP_URL)
                .row()
                .text(t(lang, "start.getHelp"), "help:main")
                .text(t(lang, "start.chooseLanguage"), "lang:menu");
            await ctx.reply([
                t(lang, "start.welcome"),
                "",
                t(lang, "start.subtitle"),
            ].join("\n"), { reply_markup: kb, parse_mode: "HTML" });
        }
        catch (err) {
            console.error("[/start] failed:", err);
            await ctx.reply("Xatolik yuz berdi. Qayta urinib ko'ring.");
        }
    });
    /* ============ /help ============ */
    bot.command("help", async (ctx) => {
        const from = ctx.from;
        if (!from)
            return;
        const user = await getBotUser(from.id);
        const lang = getUserLang(user, from.language_code);
        const kb = new InlineKeyboard().webApp(t(lang, "start.openApp"), env.WEB_APP_URL);
        await ctx.reply([
            t(lang, "help.title"),
            "",
            t(lang, "help.commands"),
            `  ${t(lang, "help.startCmd")}`,
            `  ${t(lang, "help.helpCmd")}`,
            `  ${t(lang, "help.profileCmd")}`,
            `  ${t(lang, "help.languageCmd")}`,
            "",
            t(lang, "help.gamesHelp"),
        ].join("\n"), { reply_markup: kb, parse_mode: "HTML" });
    });
    /* ============ Callback: help ============ */
    bot.callbackQuery("help:main", async (ctx) => {
        const from = ctx.from;
        if (!from)
            return;
        const user = await getBotUser(from.id);
        const lang = getUserLang(user, from.language_code);
        await ctx.answerCallbackQuery();
        await ctx.reply([
            t(lang, "help.title"),
            "",
            t(lang, "help.commands"),
            `  ${t(lang, "help.startCmd")}`,
            `  ${t(lang, "help.helpCmd")}`,
            `  ${t(lang, "help.profileCmd")}`,
            `  ${t(lang, "help.languageCmd")}`,
        ].join("\n"), { parse_mode: "HTML" });
    });
    /* ============ Manual code handlers ============ */
    bot.hears(/^bomb_([A-Z0-9]{6})$/i, async (ctx) => {
        const m = ctx.message?.text?.match(/^bomb_([A-Z0-9]{6})$/i);
        const bombCode = m?.[1]?.toUpperCase();
        if (!bombCode || !ctx.from)
            return;
        const user = await getBotUser(ctx.from.id);
        const lang = getUserLang(user, ctx.from.language_code);
        const url = miniAppUrl({ bombCode });
        const kb = new InlineKeyboard().webApp(t(lang, "start.joinGame"), url);
        await ctx.reply(`<b>${t(lang, "gameInvite.bombCode")}:</b> <code>${bombCode}</code>`, { reply_markup: kb, parse_mode: "HTML" });
    });
    bot.hears(/^ttt_([A-Z0-9]{6})$/i, async (ctx) => {
        const m = ctx.message?.text?.match(/^ttt_([A-Z0-9]{6})$/i);
        const tttCode = m?.[1]?.toUpperCase();
        if (!tttCode || !ctx.from)
            return;
        const user = await getBotUser(ctx.from.id);
        const lang = getUserLang(user, ctx.from.language_code);
        const url = miniAppUrl({ tttCode });
        const kb = new InlineKeyboard().webApp(t(lang, "start.joinGame"), url);
        await ctx.reply(`<b>${t(lang, "gameInvite.tttCode")}:</b> <code>${tttCode}</code>`, { reply_markup: kb, parse_mode: "HTML" });
    });
}
/* ============================================================
   Referral handling
   ============================================================ */
async function handleReferral(newUserId, referralCode) {
    try {
        /* Find referrer by code */
        const referrer = await db.user.findFirst({
            where: { referralCode },
            select: { id: true, referralCount: true },
        });
        if (!referrer)
            return;
        if (referrer.id === newUserId)
            return;
        /* Check if user was already referred */
        const existing = await db.referral.findUnique({
            where: { referredId: newUserId },
        });
        if (existing)
            return;
        /* Create referral + increment count */
        await db.$transaction([
            db.referral.create({
                data: {
                    referrerId: referrer.id,
                    referredId: newUserId,
                },
            }),
            db.user.update({
                where: { id: referrer.id },
                data: {
                    referralCount: { increment: 1 },
                },
            }),
        ]);
    }
    catch (err) {
        console.error("[referral] failed:", err);
    }
}
