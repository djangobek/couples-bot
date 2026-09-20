/* ============================================================
   SUBSCRIPTION — Service
   Checks Telegram channel membership via Bot API
   ============================================================ */
import { env } from "@couples/config";
import { prisma } from "../database/prisma.service.js";
import { subscriptionConfig } from "../config/subscription.config.js";
/* ============================================================
   Telegram Bot API — getChatMember
   ============================================================ */
async function checkChannelMembership(chatId, userId) {
    const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/getChatMember`;
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                user_id: userId,
            }),
        });
        if (!res.ok) {
            console.error("[subscription] HTTP error:", res.status);
            return false;
        }
        const data = (await res.json());
        if (!data.ok || !data.result) {
            console.error("[subscription] API error:", data.description ?? "unknown");
            return false;
        }
        /* Bot API statuses:
           - creator / administrator / member / restricted (is_member=true)
           - left / kicked — not a member
           - restricted can be a member with limitations
        */
        const status = data.result.status;
        if (status === "creator" ||
            status === "administrator" ||
            status === "member") {
            return true;
        }
        /* Restricted — check is_member flag */
        if (status === "restricted") {
            const restricted = data.result;
            return restricted.is_member === true;
        }
        return false;
    }
    catch (err) {
        console.error("[subscription] fetch error:", err);
        return false;
    }
}
/* ============================================================
   Resolve chat_id for a channel
   - public: @username (can be used directly in getChatMember)
   - private: numeric ID
   ============================================================ */
function resolveChatId(channel) {
    if (channel.username)
        return `@${channel.username}`;
    if (channel.chatId) {
        /* Numeric — try parsing to number for better API compatibility */
        const n = Number(channel.chatId);
        return Number.isFinite(n) ? n : channel.chatId;
    }
    return channel.id;
}
/* ============================================================
   Build user-facing link
   ============================================================ */
function resolveLink(channel) {
    if (channel.username)
        return `https://t.me/${channel.username}`;
    if (channel.chatId)
        return `https://t.me/c/${channel.chatId.replace(/^-100/, "")}`;
    return null;
}
/* ============================================================
   Check subscription with cache
   ============================================================ */
export class SubscriptionService {
    /**
     * Check if a user is subscribed to all required channels.
     * Uses DB cache with TTL to avoid hammering Telegram API.
     */
    async checkStatus(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { telegramId: true },
        });
        if (!user) {
            return {
                channels: [],
                isSubscribed: false,
                missingCount: 0,
            };
        }
        /* If no channels required — always OK */
        if (subscriptionConfig.channels.length === 0) {
            return {
                channels: [],
                isSubscribed: true,
                missingCount: 0,
            };
        }
        const telegramIdStr = user.telegramId.toString();
        const ttlMs = subscriptionConfig.cacheTtlSeconds * 1000;
        const now = Date.now();
        /* Load cached subscriptions */
        const cached = await prisma.subscription.findMany({
            where: { userId },
        });
        const cacheMap = new Map(cached.map((c) => [c.channelId, c]));
        const checks = await Promise.all(subscriptionConfig.channels.map(async (channel) => {
            const cachedRow = cacheMap.get(channel.id);
            /* Use cache if fresh */
            if (cachedRow && now - cachedRow.checkedAt.getTime() < ttlMs) {
                return {
                    id: channel.id,
                    label: channel.label,
                    username: channel.username,
                    link: resolveLink(channel),
                    isMember: cachedRow.isActive,
                };
            }
            /* Fresh check via Telegram API */
            const isMember = await checkChannelMembership(resolveChatId(channel), telegramIdStr);
            /* Upsert cache */
            await prisma.subscription.upsert({
                where: {
                    userId_channelId: {
                        userId,
                        channelId: channel.id,
                    },
                },
                update: {
                    isActive: isMember,
                    checkedAt: new Date(),
                },
                create: {
                    userId,
                    channelId: channel.id,
                    isActive: isMember,
                    checkedAt: new Date(),
                },
            });
            return {
                id: channel.id,
                label: channel.label,
                username: channel.username,
                link: resolveLink(channel),
                isMember,
            };
        }));
        const missingCount = checks.filter((c) => !c.isMember).length;
        return {
            channels: checks,
            isSubscribed: missingCount === 0,
            missingCount,
        };
    }
    /**
     * Force refresh — ignore cache.
     * Useful for the "Check" button.
     */
    async forceCheckStatus(userId) {
        /* Clear cache for this user */
        await prisma.subscription.deleteMany({
            where: { userId },
        });
        return this.checkStatus(userId);
    }
}
export const subscriptionService = new SubscriptionService();
