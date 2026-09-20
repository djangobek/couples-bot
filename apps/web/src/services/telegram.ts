/* ============================================================
   TELEGRAM WEB APP SERVICE
   ============================================================ */

import type { TelegramUser } from "../types/domain";

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type HapticNotification = "error" | "success" | "warning";

type TelegramWebApp = {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;

  ready: () => void;
  expand: () => void;
  close: () => void;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;

  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;

  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;

  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (
    message: string,
    callback?: (confirmed: boolean) => void,
  ) => void;
  showPopup?: (params: unknown, callback?: (id: string) => void) => void;

  HapticFeedback?: {
    impactOccurred: (style: HapticStyle) => void;
    notificationOccurred: (type: HapticNotification) => void;
    selectionChanged: () => void;
  };

  BackButton?: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };

  MainButton?: {
    text: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };

  onEvent: (event: string, cb: () => void) => void;
  offEvent: (event: string, cb: () => void) => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export const tg = window.Telegram?.WebApp;

export const isTelegram = Boolean(tg?.initData);

export function getInitData(): string {
  return tg?.initData ?? "";
}

export function getTelegramUser(): TelegramUser | null {
  return tg?.initDataUnsafe?.user ?? null;
}

/**
 * Get the start_param from Telegram WebApp.
 *
 * Formats it as "invite_CODE" or "bomb_CODE" for consistency
 * with URL query params.
 */
export function getStartParam(): string | null {
  /* 1. Telegram start_param */
  const fromTg = tg?.initDataUnsafe?.start_param ?? null;
  if (fromTg) {
    /* If already prefixed, return as-is */
    if (fromTg.startsWith("invite_") || fromTg.startsWith("bomb_")) {
      return fromTg;
    }
    /* Otherwise return raw (could be a code) */
    return fromTg;
  }

  /* 2. URL query params (?invite=... or ?bomb=...) */
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);

    const invite = params.get("invite");
    if (invite) return `invite_${invite}`;

    const bomb = params.get("bomb");
    if (bomb) return `bomb_${bomb}`;
  }

  return null;
}

/**
 * Parse the current URL for a bomb code (either from query or start_param).
 * Returns the uppercase code or null.
 */
export function getBombCodeFromDeepLink(): string | null {
  /* 1. URL query (?bomb=XXXXXX) */
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const bomb = params.get("bomb");
    if (bomb && /^[A-Za-z0-9]{6}$/.test(bomb)) {
      return bomb.toUpperCase();
    }
  }

  /* 2. start_param (bomb_XXXXXX) */
  const startParam = tg?.initDataUnsafe?.start_param ?? null;
  if (startParam) {
    const match = startParam.match(/^bomb_([A-Za-z0-9]{6})$/);
    if (match) return match[1].toUpperCase();
  }

  return null;
}

/**
 * Parse the current URL for an invite code.
 */
export function getInviteCodeFromDeepLink(): string | null {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    if (invite) return invite;
  }

  const startParam = tg?.initDataUnsafe?.start_param ?? null;
  if (startParam) {
    const match = startParam.match(/^invite_(.+)$/);
    if (match) return match[1];
  }

  return null;
}

export function initTelegram(): void {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();
    tg.setHeaderColor?.("#0a0709");
    tg.setBackgroundColor?.("#0a0709");
  } catch {
    /* noop */
  }
}

export function applyTelegramTheme(): void {
  if (!tg) return;
  const scheme = tg.colorScheme;
  document.documentElement.setAttribute(
    "data-theme",
    scheme === "light" ? "light" : "dark",
  );
}

export function hapticTap(style: HapticStyle = "light"): void {
  tg?.HapticFeedback?.impactOccurred(style);
}

export function hapticNotify(type: HapticNotification): void {
  tg?.HapticFeedback?.notificationOccurred(type);
}

export function hapticSelection(): void {
  tg?.HapticFeedback?.selectionChanged();
}

export function openExternal(url: string): void {
  if (tg?.openLink) {
    tg.openLink(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function shareInviteLink(url: string, text: string): void {
  const share = `https://t.me/share/url?url=${encodeURIComponent(
    url,
  )}&text=${encodeURIComponent(text)}`;

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(share);
  } else {
    window.open(share, "_blank", "noopener,noreferrer");
  }
}

export function showBackButton(cb: () => void): () => void {
  const btn = tg?.BackButton;
  if (!btn) return () => {};
  btn.onClick(cb);
  btn.show();
  return () => {
    btn.offClick(cb);
    btn.hide();
  };
}