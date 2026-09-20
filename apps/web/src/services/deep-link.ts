/* ============================================================
   DEEP-LINK MANAGER (Senior)
   Handles: invite, bomb, tictactoe
   ============================================================ */

const STORAGE_KEY_BOMB = "couples_pending_bomb_v3";
const STORAGE_KEY_TTT = "couples_pending_ttt_v3";
const STORAGE_KEY_INVITE = "couples_pending_invite_v3";
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
let initialBombCaptured = false;
let initialBombCode: string | null = null;

export function captureInitialBombCode(): string | null {
  if (initialBombCaptured) return initialBombCode;
  initialBombCaptured = true;

  const fromUrl = readFromUrl("bomb");
  if (fromUrl && /^[A-Za-z0-9]{6}$/.test(fromUrl)) {
    initialBombCode = fromUrl.toUpperCase();
    writeStorage(STORAGE_KEY_BOMB, {
      code: initialBombCode,
      savedAt: Date.now(),
    } satisfies StoredCode);
    return initialBombCode;
  }

  const sp = readFromStartParam();
  if (sp) {
    const m = sp.match(/^bomb_([A-Za-z0-9]{6})$/i);
    if (m) {
      initialBombCode = m[1].toUpperCase();
      writeStorage(STORAGE_KEY_BOMB, {
        code: initialBombCode,
        savedAt: Date.now(),
      } satisfies StoredCode);
      return initialBombCode;
    }
  }

  const stored = readStorage<StoredCode>(STORAGE_KEY_BOMB);
  if (stored?.code) {
    const age = Date.now() - stored.savedAt;
    if (age < CODE_TTL_MS && /^[A-Za-z0-9]{6}$/.test(stored.code)) {
      initialBombCode = stored.code.toUpperCase();
      return initialBombCode;
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
let initialTttCaptured = false;
let initialTttCode: string | null = null;

export function captureInitialTttCode(): string | null {
  if (initialTttCaptured) return initialTttCode;
  initialTttCaptured = true;

  const fromUrl = readFromUrl("ttt");
  if (fromUrl && /^[A-Za-z0-9]{6}$/.test(fromUrl)) {
    initialTttCode = fromUrl.toUpperCase();
    writeStorage(STORAGE_KEY_TTT, {
      code: initialTttCode,
      savedAt: Date.now(),
    } satisfies StoredCode);
    return initialTttCode;
  }

  const sp = readFromStartParam();
  if (sp) {
    const m = sp.match(/^ttt_([A-Za-z0-9]{6})$/i);
    if (m) {
      initialTttCode = m[1].toUpperCase();
      writeStorage(STORAGE_KEY_TTT, {
        code: initialTttCode,
        savedAt: Date.now(),
      } satisfies StoredCode);
      return initialTttCode;
    }
  }

  const stored = readStorage<StoredCode>(STORAGE_KEY_TTT);
  if (stored?.code) {
    const age = Date.now() - stored.savedAt;
    if (age < CODE_TTL_MS && /^[A-Za-z0-9]{6}$/.test(stored.code)) {
      initialTttCode = stored.code.toUpperCase();
      return initialTttCode;
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
let initialInviteCaptured = false;
let initialInviteCode: string | null = null;

export function captureInitialInviteCode(): string | null {
  if (initialInviteCaptured) return initialInviteCode;
  initialInviteCaptured = true;

  const fromUrl = readFromUrl("invite");
  if (fromUrl) {
    initialInviteCode = fromUrl;
    writeStorage(STORAGE_KEY_INVITE, {
      code: fromUrl,
      savedAt: Date.now(),
    } satisfies StoredCode);
    return fromUrl;
  }

  const sp = readFromStartParam();
  if (sp) {
    const m = sp.match(/^invite_(.+)$/);
    if (m) {
      initialInviteCode = m[1];
      writeStorage(STORAGE_KEY_INVITE, {
        code: m[1],
        savedAt: Date.now(),
      } satisfies StoredCode);
      return m[1];
    }
  }

  const stored = readStorage<StoredCode>(STORAGE_KEY_INVITE);
  if (stored?.code) {
    const age = Date.now() - stored.savedAt;
    if (age < CODE_TTL_MS) {
      initialInviteCode = stored.code;
      return stored.code;
    }
    removeStorage(STORAGE_KEY_INVITE);
  }

  return null;
}

export function getPendingBombCode(): string | null {
  return captureInitialBombCode();
}

export function getPendingTttCode(): string | null {
  return captureInitialTttCode();
}

export function getPendingInviteCode(): string | null {
  return captureInitialInviteCode();
}

export function clearPendingInviteCode(): void {
  removeStorage(STORAGE_KEY_INVITE);
}

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