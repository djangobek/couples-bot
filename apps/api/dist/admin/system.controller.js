/* ============================================================
   ADMIN — System Status Controller
   ============================================================ */
import { env } from "@couples/config";
import { success } from "../common/response.js";
import { requireAdmin } from "./admin.middleware.js";
import { adminService } from "./admin.service.js";
export function registerAdminSystemRoutes(app) {
    /* GET /v1/admin/system */
    app.get("/v1/admin/system", async (request) => {
        requireAdmin(request);
        /* DB latency check */
        const dbStart = Date.now();
        let dbStatus = "ok";
        let dbLatency = 0;
        try {
            await adminService.pingDatabase();
            dbLatency = Date.now() - dbStart;
            if (dbLatency > 500)
                dbStatus = "degraded";
        }
        catch {
            dbStatus = "down";
            dbLatency = Date.now() - dbStart;
        }
        /* Memory */
        const mem = process.memoryUsage();
        const memMb = Math.round(mem.rss / 1024 / 1024);
        /* Uptime */
        const uptime = Math.floor(process.uptime());
        return success({
            api: {
                status: "ok",
                uptime,
                memoryMb: memMb,
                version: process.version,
            },
            database: {
                status: dbStatus,
                latencyMs: dbLatency,
            },
            bot: {
                status: "unknown",
                username: env.BOT_USERNAME || null,
            },
            environment: env.NODE_ENV ?? "development",
            timestamp: new Date().toISOString(),
        });
    });
    /* GET /v1/admin/system/env — non-sensitive env info */
    app.get("/v1/admin/system/env", async (request) => {
        requireAdmin(request);
        return success({
            nodeEnv: env.NODE_ENV ?? "development",
            apiPort: env.API_PORT,
            webAppUrl: env.WEB_APP_URL,
            adminCount: env.ADMIN_TELEGRAM_IDS.size,
        });
    });
}
