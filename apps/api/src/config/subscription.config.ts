/* ============================================================
   SUBSCRIPTION — Backend config
   Parses REQUIRED_CHANNELS from env
   ============================================================ */

import { env } from "@couples/config";

export type ChannelConfig = {
  id: string;
  username: string | null;
  chatId: string | null;
  label: string;
};

function parseChannels(raw: string): ChannelConfig[] {
  if (!raw || !raw.trim()) return [];

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

export const subscriptionConfig = {
  channels: parseChannels(env.REQUIRED_CHANNELS),
  cacheTtlSeconds: env.SUBSCRIPTION_CACHE_TTL_SECONDS ?? 300,
};

export function hasRequiredChannels(): boolean {
  return subscriptionConfig.channels.length > 0;
}