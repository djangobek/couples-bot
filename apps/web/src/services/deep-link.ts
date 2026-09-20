/* ============================================================
   DEEP-LINK MANAGER v4 — StrictMode-safe
   Handles: invite, bomb, tictactoe
   - NO module-level "captured" flags (StrictMode-safe)
   - Always reads from URL → start_param → sessionStorage
   - TTL for stored codes
   ============================================================ */

const STORAGE_KEY_BOMB = "couples_pending_bomb_v4";
const STORAGE_KEY_TTT = "couples_pending_ttt_v4";
const STORAGE_KEY_INVITE = "couples_pending_invite_v4";
const CODE_TTL_MS = 5 * 60_000;

type StoredCode = {
  code: string;
  savedAt: number;
};

function readStorage<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function removeStorage(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function readFromUrl(param: string): string | null {
  try {
    const url = new URL(window.location.href);
    const value = url.searchParams.get(param);
    return value ? value.trim() : null;
  } catch {
    return null;
  }
}

function readFromStartParam(): string | null {
  const tg = window.Telegram?.WebApp;
  const sp = tg?.initDataUnsafe?.start_param;
  if (typeof sp === "string" && sp) return sp;
  return null;
}

/* ============================================================
   BOMB
   ============================================================ */
export function captureInitialBombCode(): string | null {
  /* 1. URL query: ?bomb=XXXXXX */
  const fromUrl = readFromUrl("bomb");
  if (fromUrl && /^[A-Za-z0-9]{6}$/.test(fromUrl)) {
    const code = fromUrl.toUpperCase();
    writeStorage(STORAGE_KEY_BOMB, { code, savedAt: Date.now() } satisfies StoredCode);
    return code;
  }

  /* 2. Telegram start_param: bomb_XXXXXX */
  const sp = readFromStartParam();
  if (sp) {
    const m = sp.match(/^bomb_([A-Za-z0-9]{6})$/i);
    if (m) {
      const code = m[1].toUpperCase();
      writeStorage(STORAGE_KEY_BOMB, { code, savedAt: Date.now() } satisfies StoredCode);
      return code;
    }
  }

  /* 3. sessionStorage (TTL tekshiruvi bilan) */
  const stored = readStorage<StoredCode>(STORAGE_KEY_BOMB);
  if (stored?.code) {
    const age = Date.now() - stored.savedAt;
    if (age < CODE_TTL_MS && /^[A-Za-z0-9]{6}$/.test(stored.code)) {
      return stored.code.toUpperCase();
    }
    removeStorage(STORAGE_KEY_BOMB);
  }

  return null;
}

export function clearPendingBombCode(): void {
  removeStorage(STORAGE_KEY_BOMB);
}

/* ============================================================
   TIC-TAC-TOE
   ============================================================ */
export function captureInitialTttCode(): string | null {
  const fromUrl = readFromUrl("ttt");
  if (fromUrl && /^[A-Za-z0-9]{6}$/.test(fromUrl)) {
    const code = fromUrl.toUpperCase();
    writeStorage(STORAGE_KEY_TTT, { code, savedAt: Date.now() } satisfies StoredCode);
    return code;
  }

  const sp = readFromStartParam();
  if (sp) {
    const m = sp.match(/^ttt_([A-Za-z0-9]{6})$/i);
    if (m) {
      const code = m[1].toUpperCase();
      writeStorage(STORAGE_KEY_TTT, { code, savedAt: Date.now() } satisfies StoredCode);
      return code;
    }
  }

  const stored = readStorage<StoredCode>(STORAGE_KEY_TTT);
  if (stored?.code) {
    const age = Date.now() - stored.savedAt;
    if (age < CODE_TTL_MS && /^[A-Za-z0-9]{6}$/.test(stored.code)) {
      return stored.code.toUpperCase();
    }
    removeStorage(STORAGE_KEY_TTT);
  }

  return null;
}

export function clearPendingTttCode(): void {
  removeStorage(STORAGE_KEY_TTT);
}

/* ============================================================
   INVITE
   ============================================================ */
export function captureInitialInviteCode(): string | null {
  const fromUrl = readFromUrl("invite");
  if (fromUrl) {
    writeStorage(STORAGE_KEY_INVITE, { code: fromUrl, savedAt: Date.now() } satisfies StoredCode);
    return fromUrl;
  }

  const sp = readFromStartParam();
  if (sp) {
    const m = sp.match(/^invite_(.+)$/);
    if (m) {
      writeStorage(STORAGE_KEY_INVITE, { code: m[1], savedAt: Date.now() } satisfies StoredCode);
      return m[1];
    }
  }

  const stored = readStorage<StoredCode>(STORAGE_KEY_INVITE);
  if (stored?.code) {
    const age = Date.now() - stored.savedAt;
    if (age < CODE_TTL_MS) {
      return stored.code;
    }
    removeStorage(STORAGE_KEY_INVITE);
  }

  return null;
}

export function clearPendingInviteCode(): void {
  removeStorage(STORAGE_KEY_INVITE);
}

/* ============================================================
   Legacy aliases (boshqa fayllar uchun)
   ============================================================ */
export function getPendingBombCode(): string | null {
  return captureInitialBombCode();
}

export function getPendingTttCode(): string | null {
  return captureInitialTttCode();
}

export function getPendingInviteCode(): string | null {
  return captureInitialInviteCode();
}

/* ============================================================
   URL CLEANUP
   ============================================================ */
export function cleanUrl(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("bomb");
    url.searchParams.delete("ttt");
    url.searchParams.delete("invite");
    const newUrl = url.pathname + (url.search ? url.search : "");
    window.history.replaceState({}, document.title, newUrl);
  } catch {
    /* ignore */
  }
}