/* ============================================================
   DOMAIN TYPES — frontend-internal models
   ============================================================ */

export type TabKey = "home" | "games" | "world" | "profile";

export type AppRoute =
  | { name: "loading" }
  | { name: "error"; message: string }
  | { name: "onboarding" }
  | { name: "join"; code: string }
  | { name: "main"; tab: TabKey };

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
};

export type ToastKind = "success" | "error" | "info";

export type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
  duration?: number;
};

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };