/* ============================================================
   BROADCAST — Types
   ============================================================ */

export type BroadcastSendInput = {
  message: string;
  parseMode?: "HTML" | "MarkdownV2" | "";
  onlyActive?: boolean;
};

export type BroadcastResult = {
  id: string;
  sent: number;
  failed: number;
  total: number;
};

export type BroadcastHistoryItem = {
  id: string;
  message: string;
  parseMode: string;
  sentCount: number;
  failedCount: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  admin: {
    id: string;
    firstName: string | null;
  } | null;
};