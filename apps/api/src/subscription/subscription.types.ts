/* ============================================================
   SUBSCRIPTION — Types
   ============================================================ */

export type ChannelCheck = {
  id: string;
  label: string;
  username: string | null;
  /* Direct link for user to click (t.me/...) */
  link: string | null;
  isMember: boolean;
};

export type SubscriptionStatus = {
  /* All channels the user must be subscribed to */
  channels: ChannelCheck[];
  /* True if user is a member of ALL channels */
  isSubscribed: boolean;
  /* How many channels user is missing */
  missingCount: number;
};