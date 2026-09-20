import { ApiError } from "./errors/api-error.js";
export function registerRateLimit(app) {
    const buckets = new Map();
    const windowMs = 60_000;
    const generalLimit = 300; // 5 req/s o'rtacha
    const authLimit = 60; // auth uchun 60/min
    /* Paths that should NOT be rate-limited (or have higher limit) */
    const EXEMPT_PATHS = [
        "/health",
        "/health/ready",
    ];
    const HIGH_LIMIT_PATHS = [
        "/v1/games/bomb/my", // frontend polls this
        "/v1/games/bomb/ws", // WS upgrade
    ];
    const cleanup = setInterval(() => {
        const now = Date.now();
        for (const [key, bucket] of buckets) {
            if (bucket.resetAt <= now)
                buckets.delete(key);
        }
    }, windowMs);
    cleanup.unref();
    app.addHook("onRequest", async (request, reply) => {
        /* Skip OPTIONS (CORS preflight) */
        if (request.method === "OPTIONS")
            return;
        const url = request.url;
        const path = url.split("?")[0] ?? "";
        /* Skip exempt paths */
        if (EXEMPT_PATHS.includes(path))
            return;
        const key = request.ip;
        const isAuthRequest = path.startsWith("/v1") &&
            Boolean(request.headers["x-telegram-init-data"]);
        let limit = isAuthRequest ? authLimit : generalLimit;
        /* Higher limit for polling endpoints */
        if (HIGH_LIMIT_PATHS.some((p) => path.startsWith(p))) {
            limit = limit * 3; // 3x higher
        }
        const now = Date.now();
        const existing = buckets.get(key);
        if (!existing || existing.resetAt <= now) {
            buckets.set(key, { count: 1, resetAt: now + windowMs });
            return;
        }
        existing.count += 1;
        if (existing.count > limit) {
            const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
            reply.header("Retry-After", retryAfter);
            throw new ApiError("RATE_LIMITED", "Too many requests", 429);
        }
    });
    app.addHook("onClose", async () => clearInterval(cleanup));
}
