/* ============================================================
   TELEGRAM WEB APP — Safe access
   ============================================================ */

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramUser;
    start_param?: string;
  };
  colorScheme: "light" | "dark";
  platform: string;
  version: string;
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  disableVerticalSwipes?: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export const tg = window.Telegram?.WebApp;

export function getInitData(): string {
  return tg?.initData ?? "";
}

export function getTelegramUser(): TelegramUser | null {
  return tg?.initDataUnsafe?.user ?? null;
}

export function isTelegram(): boolean {
  return Boolean(tg?.initData);
}

export function initTelegram(): void {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();
    tg.setHeaderColor?.("#0a0a0d");
    tg.setBackgroundColor?.("#0a0a0d");
  } catch {
    /* noop */
  }
}

export function applyTelegramTheme(): void {
  if (!tg) return;
  const scheme = tg.colorScheme;
  /* Default dark; only switch to light if Telegram says so AND user hasn't overridden */
  const stored = localStorage.getItem("couples_admin_theme");
  if (stored === "dark" || stored === "light") {
    document.documentElement.setAttribute("data-theme", stored);
    return;
  }
  document.documentElement.setAttribute(
    "data-theme",
    scheme === "light" ? "light" : "dark",
  );
}