/* ============================================================
   BOT — Subscription service
   Checks channel membership + caches to DB
   ============================================================ */
import { env } from "@couples/config";
import { db } from "@couples/database";
const CACHE_TTL_MS = 5 * 60 * 1000; /* 5 min */
/* ---------- Parse channels from env ---------- */
function parseChannels(raw) {
    if (!raw || !raw.trim())
        return [];
    return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((id) => {
        if (id.startsWith("@")) {
            const username = id.slice(1);
            return {
                id,
                username,
                chatId: null,
                label: `@${username}`,
            };
        }
        if (/^-?\d+$/.test(id)) {
            return {
                id,
                username: null,
                chatId: id,
                label: `Channel ${id}`,
            };
        }
        return {
            id,
            username: null,
            chatId: null,
            label: id,
        };
    });
}
const CHANNELS = parseChannels(env.REQUIRED_CHANNELS);
export function hasRequiredChannels() {
    return CHANNELS.length > 0;
}
/* ---------- Telegram API check ---------- */
async function checkMembership(chatId, userId) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/getChatMember`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                user_id: userId,
            }),
        });
        if (!res.ok)
            return false;
        const data = (await res.json());
        if (!data.ok || !data.result)
            return false;
        const status = data.result.status;
        if (status === "creator" ||
            status === "administrator" ||
            status === "member") {
            return true;
        }
        if (status === "restricted") {
            return data.result.is_member === true;
        }
        return false;
    }
    catch {
        return false;
    }
}
function resolveChatId(channel) {
    if (channel.username)
        return `@${channel.username}`;
    if (channel.chatId) {
        const n = Number(channel.chatId);
        return Number.isFinite(n) ? n : channel.chatId;
    }
    return channel.id;
}
function resolveLink(channel) {
    if (channel.username)
        return `https://t.me/${channel.username}`;
    if (channel.chatId) {
        return `https://t.me/c/${channel.chatId.replace(/^-100/, "")}`;
    }
    return null;
}
/* ============================================================
   SERVICE
   ============================================================ */
export class BotSubscriptionService {
    /**
     * Check all channels. Uses DB cache (5 min TTL).
     */
    async check(userId, telegramId) {
        if (CHANNELS.length === 0) {
            return {
                channels: [],
                isSubscribed: true,
                missingCount: 0,
            };
        }
        const now = Date.now();
        /* Load cached rows */
        const cached = await db.subscription.findMany({
            where: { userId },
        });
        const cacheMap = new Map(cached.map((c) => [c.channelId, c]));
        const channels = await Promise.all(CHANNELS.map(async (channel) => {
            const cachedRow = cacheMap.get(channel.id);
            if (cachedRow && now - cachedRow.checkedAt.getTime() < CACHE_TTL_MS) {
                return {
                    id: channel.id,
                    label: channel.label,
                    username: channel.username,
                    link: resolveLink(channel),
                    isMember: cachedRow.isActive,
                };
            }
            /* Fresh check */
            const isMember = await checkMembership(resolveChatId(channel), telegramId);
            /* Upsert cache */
            await db.subscription.upsert({
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
        const missingCount = channels.filter((c) => !c.isMember).length;
        return {
            channels,
            isSubscribed: missingCount === 0,
            missingCount,
        };
    }
    /**
     * Force re-check (clears cache).
     */
    async forceCheck(userId, telegramId) {
        await db.subscription.deleteMany({ where: { userId } });
        return this.check(userId, telegramId);
    }
    /**
     * Get all required channels (for display).
     */
    getChannels() {
        return CHANNELS.map((c) => ({
            id: c.id,
            label: c.label,
            username: c.username,
            link: resolveLink(c),
            isMember: false,
        }));
    }
}
export const botSubscriptionService = new BotSubscriptionService();
