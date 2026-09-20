/* ============================================================
   GAMES — Short-lived WebSocket tokens (shared for all games)
   ============================================================ */

import crypto from "node:crypto";

type TokenPayload = {
  userId: string;
  roomCode: string;
  gameType: string;
  expiresAt: number;
  used: boolean;
};

const TOKEN_TTL_MS = 60_000;
const CLEANUP_INTERVAL_MS = 30_000;

class GameTokenStore {
  private tokens = new Map<string, TokenPayload>();
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [token, payload] of this.tokens) {
        if (payload.expiresAt <= now || payload.used) {
          this.tokens.delete(token);
        }
      }
    }, CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
  }

  issue(
    userId: string,
    roomCode: string,
    gameType: string,
  ): { token: string; expiresAt: number } {
    const token = crypto.randomBytes(24).toString("base64url");
    const expiresAt = Date.now() + TOKEN_TTL_MS;

    this.tokens.set(token, {
      userId,
      roomCode: roomCode.toUpperCase(),
      gameType,
      expiresAt,
      used: false,
    });

    return { token, expiresAt };
  }

  consume(token: string): TokenPayload | null {
    const payload = this.tokens.get(token);
    if (!payload) return null;
    if (payload.used) return null;
    if (payload.expiresAt <= Date.now()) {
      this.tokens.delete(token);
      return null;
    }

    payload.used = true;
    this.tokens.delete(token);

    return payload;
  }

  shutdown(): void {
    clearInterval(this.cleanupTimer);
    this.tokens.clear();
  }
}

export const gameTokenStore = new GameTokenStore();