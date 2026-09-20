/* ============================================================
   BROADCAST — Service
   Sends messages to all users (with rate limiting)
   ============================================================ */

import { env } from "@couples/config";
import { prisma } from "../database/prisma.service.js";
import type {
  BroadcastSendInput,
  BroadcastResult,
  BroadcastHistoryItem,
} from "./broadcast.types.js";

const TELEGRAM_API = "https://api.telegram.org";

async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode || undefined,
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) return false;
    const data = (await res.json()) as { ok: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class BroadcastService {
  /**
   * Send a broadcast to all users.
   * Runs in background — returns immediately with a record ID.
   */
  async send(
    adminId: string,
    input: BroadcastSendInput,
  ): Promise<BroadcastResult> {
    const message = input.message.trim();
    if (!message) {
      throw new Error("Message cannot be empty");
    }
    if (message.length > 4096) {
      throw new Error("Message too long (max 4096 characters)");
    }

    /* Create broadcast record */
    const broadcast = await prisma.broadcast.create({
      data: {
        adminId,
        message,
        parseMode: input.parseMode ?? "HTML",
        status: "PENDING",
      },
    });

    /* Get all recipients */
    const users = await prisma.user.findMany({
      where:
        input.onlyActive === false
          ? { status: { not: "DELETED" } }
          : { status: "ACTIVE" },
      select: { telegramId: true },
    });

    /* Fire and forget — do NOT await */
    void this.runBroadcast(
      broadcast.id,
      users.map((u) => u.telegramId.toString()),
      message,
      broadcast.parseMode,
    );

    return {
      id: broadcast.id,
      sent: 0,
      failed: 0,
      total: users.length,
    };
  }

  /**
   * Actually send messages with batching.
   * Updates DB as it goes.
   */
  private async runBroadcast(
    broadcastId: string,
    recipients: string[],
    message: string,
    parseMode: string,
  ): Promise<void> {
    const batchSize = env.BROADCAST_BATCH_SIZE ?? 25;
    const delayMs = env.BROADCAST_BATCH_DELAY_MS ?? 1000;

    let sent = 0;
    let failed = 0;

    try {
      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: { status: "SENDING" },
      });

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (chatId) => {
            const ok = await sendTelegramMessage(chatId, message, parseMode);
            if (ok) sent += 1;
            else failed += 1;
          }),
        );

        /* Update progress in DB after each batch */
        await prisma.broadcast.update({
          where: { id: broadcastId },
          data: { sentCount: sent, failedCount: failed },
        });

        /* Small delay between batches to avoid Telegram rate limits */
        if (i + batchSize < recipients.length) {
          await sleep(delayMs);
        }
      }

      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: {
          status: "DONE",
          sentCount: sent,
          failedCount: failed,
          completedAt: new Date(),
        },
      });
    } catch (err) {
      console.error("[broadcast] failed:", err);
      await prisma.broadcast.update({
        where: { id: broadcastId },
        data: {
          status: "FAILED",
          sentCount: sent,
          failedCount: failed,
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * List recent broadcasts (admin history)
   */
  async list(limit = 20): Promise<BroadcastHistoryItem[]> {
    const items = await prisma.broadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      select: {
        id: true,
        message: true,
        parseMode: true,
        sentCount: true,
        failedCount: true,
        status: true,
        createdAt: true,
        completedAt: true,
        admin: {
          select: { id: true, firstName: true },
        },
      },
    });

    return items.map((b) => ({
      id: b.id,
      message: b.message,
      parseMode: b.parseMode,
      sentCount: b.sentCount,
      failedCount: b.failedCount,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      completedAt: b.completedAt?.toISOString() ?? null,
      admin: b.admin,
    }));
  }

  async getById(id: string): Promise<BroadcastHistoryItem | null> {
    const b = await prisma.broadcast.findUnique({
      where: { id },
      select: {
        id: true,
        message: true,
        parseMode: true,
        sentCount: true,
        failedCount: true,
        status: true,
        createdAt: true,
        completedAt: true,
        admin: {
          select: { id: true, firstName: true },
        },
      },
    });
    if (!b) return null;
    return {
      id: b.id,
      message: b.message,
      parseMode: b.parseMode,
      sentCount: b.sentCount,
      failedCount: b.failedCount,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      completedAt: b.completedAt?.toISOString() ?? null,
      admin: b.admin,
    };
  }
}

export const broadcastService = new BroadcastService();