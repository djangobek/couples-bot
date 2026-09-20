/* ============================================================
   ADMIN — Statistics Controller
   ============================================================ */
import { z } from "zod";
import { success } from "../common/response.js";
import { adminService } from "./admin.service.js";
import { requireAdmin } from "./admin.middleware.js";
const statsQuerySchema = z.object({
    period: z.enum(["today", "7d", "30d", "90d", "custom"]).default("7d"),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
});
export function registerAdminStatsRoutes(app) {
    /* GET /v1/admin/statistics */
    app.get("/v1/admin/statistics", async (request) => {
        requireAdmin(request);
        const query = statsQuerySchema.parse(request.query ?? {});
        const data = await adminService.getStatistics({
            period: query.period,
            fromDate: query.fromDate,
            toDate: query.toDate,
        });
        return success(data);
    });
}
