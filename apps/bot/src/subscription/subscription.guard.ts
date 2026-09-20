/* ============================================================
   BOT — Subscription guard middleware
   Blocks bot usage if user is not subscribed
   ============================================================ */

import type { Context, MiddlewareFn } from "grammy";
import { InlineKeyboard } from "grammy";
import { botSubscriptionService } from "./subscription.service.js";
import { getBotUser, getUserLang } from "../user-helpers.js";
import { t } from "../i18n/index.js";

/**
 * Guard: ensures the user is subscribed to all required channels.
 *
 * Usage:
 *   bot.command("some", subscriptionGuard(), handler)
 */
export function subscriptionGuard(): MiddlewareFn<Context> {
  return async (ctx, next) => {
    const from = ctx.from;
    if (!from) return;

    /* Load user from DB */
    const user = await getBotUser(from.id);

    /* If user not in DB yet — let the /start handler create it */
    if (!user) {
      await next();
      return;
    }

    /* Bypass for admins */
    const { isAdmin } = await import("../admin/admin.auth.js");
    if (isAdmin(from.id)) {
      await next();
      return;
    }

    /* Check subscription */
    const result = await botSubscriptionService.check(user.id, from.id);

    if (result.isSubscribed) {
      await next();
      return;
    }

    /* Block — show inline keyboard */
    const lang = getUserLang(user, from.language_code);

    const kb = new InlineKeyboard();
    for (const ch of result.channels) {
      if (!ch.isMember && ch.link) {
        kb.url(`➕ ${ch.label}`, ch.link).row();
      }
    }
    kb.text(t(lang, "subscription.checkBtn"), "subscription:check");

    const lines = [
      t(lang, "subscription.title"),
      "",
      t(lang, "subscription.description"),
      "",
      ...result.channels
        .filter((c) => !c.isMember)
        .map((c) => `• ${c.label}`),
      "",
      t(lang, "subscription.notSubscribed"),
    ];

    try {
      await ctx.reply(lines.join("\n"), {
        reply_markup: kb,
        parse_mode: "HTML",
      });
    } catch {
      /* ignore */
    }
  };
}