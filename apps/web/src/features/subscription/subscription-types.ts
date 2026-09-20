/* ============================================================
   SUBSCRIPTION — Types (mirror backend)
   ============================================================ */

export type ChannelCheck = {
  id: string;
  label: string;
  username: string | null;
  link: string | null;
  isMember: boolean;
};

export type SubscriptionStatus = {
  channels: ChannelCheck[];
  isSubscribed: boolean;
  missingCount: number;
};