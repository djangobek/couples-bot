/* ============================================================
   GAMES — Short-lived WebSocket tokens (shared for all games)
   ============================================================ */
import crypto from "node:crypto";
const TOKEN_TTL_MS = 60_000;
const CLEANUP_INTERVAL_MS = 30_000;
class GameTokenStore {
    tokens = new Map();
    cleanupTimer;
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
    issue(userId, roomCode, gameType) {
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
    consume(token) {
        const payload = this.tokens.get(token);
        if (!payload)
            return null;
        if (payload.used)
            return null;
        if (payload.expiresAt <= Date.now()) {
            this.tokens.delete(token);
            return null;
        }
        payload.used = true;
        this.tokens.delete(token);
        return payload;
    }
    shutdown() {
        clearInterval(this.cleanupTimer);
        this.tokens.clear();
    }
}
export const gameTokenStore = new GameTokenStore();
