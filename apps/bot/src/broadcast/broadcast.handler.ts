/* ============================================================
   BOT — Broadcast handler (admin-only)
   ============================================================ */

import type { Bot, Context } from "grammy";
import { InlineKeyboard } from "grammy";
import { db } from "@couples/database";
import { isAdmin } from "../admin/admin.auth.js";
import { getBotUser, getUserLang } from "../user-helpers.js";
import { t } from "../i18n/index.js";

const awaitingBroadcast = new Map<number, { adminId: string }>();

let botInstance: Bot | null = null;

/* ============================================================
   Register
   ============================================================ */
export function registerBroadcastHandler(bot: Bot): void {
  botInstance = bot;

  bot.command("broadcast", async (ctx) => {
    const from = ctx.from;
    if (!from || !isAdmin(from.id)) {
      await ctx.reply("⛔ Ruxsat yo'q");
      return;
    }

    const user = await getBotUser(from.id);
    if (!user) return;
    const lang = getUserLang(user, from.language_code);

    awaitingBroadcast.set(from.id, { adminId: user.id });

    await ctx.reply(
      [
        t(lang, "broadcast.title"),
        "",
        t(lang, "broadcast.description"),
        "",
        t(lang, "broadcast.enterMessage"),
      ].join("\n"),
      {
        reply_markup: new InlineKeyboard().text(
          t(lang, "broadcast.cancel"),
          "broadcast:cancel",
        ),
        parse_mode: "HTML",
      },
    );
  });

  bot.callbackQuery("broadcast:start", async (ctx) => {
    const from = ctx.from;
    if (!from || !isAdmin(from.id)) {
      await ctx.answerCallbackQuery({
        text: "⛔ Ruxsat yo'q",
        show_alert: true,
      });
      return;
    }

    const user = await getBotUser(from.id);
    if (!user) return;
    const lang = getUserLang(user, from.language_code);

    awaitingBroadcast.set(from.id, { adminId: user.id });

    await ctx.answerCallbackQuery();
    await ctx.reply(
      [
        t(lang, "broadcast.title"),
        "",
        t(lang, "broadcast.enterMessage"),
      ].join("\n"),
      {
        reply_markup: new InlineKeyboard().text(
          t(lang, "broadcast.cancel"),
          "broadcast:cancel",
        ),
        parse_mode: "HTML",
      },
    );
  });

  bot.callbackQuery("broadcast:cancel", async (ctx) => {
    const from = ctx.from;
    if (!from) return;

    awaitingBroadcast.delete(from.id);
    await ctx.answerCallbackQuery({ text: "Bekor qilindi" });
    try {
      await ctx.deleteMessage();
    } catch {
      /* ignore */
    }
  });

  bot.on("message:text", async (ctx, next) => {
    const from = ctx.from;
    if (!from) {
      await next();
      return;
    }

    const state = awaitingBroadcast.get(from.id);
    if (!state) {
      await next();
      return;
    }

    if (!isAdmin(from.id)) {
      awaitingBroadcast.delete(from.id);
      await next();
      return;
    }

    const text = ctx.message.text.trim();

    if (text.startsWith("/")) {
      await next();
      return;
    }

    const user = await getBotUser(from.id);
    if (!user) return;
    const lang = getUserLang(user, from.language_code);

    if (!text) {
      await ctx.reply(t(lang, "broadcast.emptyMessage"));
      return;
    }

    if (text.length > 4096) {
      await ctx.reply(t(lang, "broadcast.tooLong"));
      return;
    }

    awaitingBroadcast.delete(from.id);

    /* Notify admin sending in progress */
    const progressMsg = await ctx.reply(t(lang, "broadcast.sending"), {
      parse_mode: "HTML",
    });

    const sent = await sendBroadcastToAll(text);

    /* Edit progress message with result */
    try {
      await ctx.api.editMessageText(
        progressMsg.chat.id,
        progressMsg.message_id,
        `✅ ${t(lang, "broadcast.sent", { sent })}`,
        { parse_mode: "HTML" },
      );
    } catch {
      await ctx.reply(`✅ ${t(lang, "broadcast.sent", { sent })}`);
    }

    /* Log */
    try {
      await db.broadcast.create({
        data: {
          adminId: user.id,
          message: text,
          parseMode: "HTML",
          sentCount: sent,
          failedCount: 0,
          status: "DONE",
          completedAt: new Date(),
        },
      });
    } catch (err) {
      console.error("[broadcast] log error:", err);
    }
  });
}

/* ============================================================
   Broadcast to all
   ============================================================ */
async function sendBroadcastToAll(text: string): Promise<number> {
  if (!botInstance) return 0;

  const users = await db.user.findMany({
    where: { status: "ACTIVE" },
    select: { telegramId: true },
  });

  let sent = 0;
  const BATCH = 25;
  const DELAY_MS = 1000;

  for (let i = 0; i < users.length; i += BATCH) {
    const batch = users.slice(i, i + BATCH);

    await Promise.all(
      batch.map(async (u) => {
        try {
          await botInstance!.api.sendMessage(
            Number(u.telegramId),
            text,
            { parse_mode: "HTML" },
          );
          sent += 1;
        } catch {
          /* ignore */
        }
      }),
    );

    if (i + BATCH < users.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  return sent;
}