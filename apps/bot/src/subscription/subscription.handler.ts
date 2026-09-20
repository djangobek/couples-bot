/* ============================================================
   BOT — Subscription handler
   ============================================================ */

import type { Bot } from "grammy";
import { InlineKeyboard } from "grammy";
import { env } from "@couples/config";
import { botSubscriptionService } from "./subscription.service.js";
import { getBotUser, getUserLang } from "../user-helpers.js";
import { t } from "../i18n/index.js";

export function registerSubscriptionHandler(bot: Bot): void {
  bot.callbackQuery("subscription:check", async (ctx) => {
    const from = ctx.from;
    if (!from) return;

    const user = await getBotUser(from.id);
    if (!user) {
      await ctx.answerCallbackQuery({ text: "User topilmadi" });
      return;
    }

    const lang = getUserLang(user, from.language_code);

    try {
      const result = await botSubscriptionService.forceCheck(user.id, from.id);

      if (result.isSubscribed) {
        await ctx.answerCallbackQuery({
          text: t(lang, "subscription.subscribed"),
        });

        try {
          await ctx.deleteMessage();
        } catch {
          /* ignore */
        }

        const kb = new InlineKeyboard().webApp(
          t(lang, "start.openApp"),
          env.WEB_APP_URL,
        );
        await ctx.reply(
          [
            t(lang, "subscription.subscribed"),
            "",
            t(lang, "start.welcome"),
            "",
            t(lang, "start.subtitle"),
          ].join("\n"),
          { reply_markup: kb, parse_mode: "HTML" },
        );
        return;
      }

      await ctx.answerCallbackQuery({
        text: t(lang, "subscription.notSubscribed"),
        show_alert: true,
      });

      const kb = new InlineKeyboard();
      for (const ch of result.channels) {
        if (!ch.isMember && ch.link) {
          kb.url(`➕ ${ch.label}`, ch.link).row();
        }
      }
      kb.text(t(lang, "subscription.checkBtn"), "subscription:check");

      try {
        await ctx.editMessageReplyMarkup({ reply_markup: kb });
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.error("[subscription.handler] error:", err);
      await ctx.answerCallbackQuery({
        text: t(lang, "subscription.checkFailed"),
        show_alert: true,
      });
    }
  });
}