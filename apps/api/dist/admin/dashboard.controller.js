import { z } from "zod";
import { success } from "../common/response.js";
import { adminService } from "./admin.service.js";
import { requireAdmin } from "./admin.middleware.js";
const activityQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});
export function registerAdminDashboardRoutes(app) {
    /* GET /v1/admin/dashboard */
    app.get("/v1/admin/dashboard", async (request) => {
        requireAdmin(request);
        const data = await adminService.getDashboard();
        return success(data);
    });
    /* GET /v1/admin/dashboard/activity */
    app.get("/v1/admin/dashboard/activity", async (request) => {
        requireAdmin(request);
        const query = activityQuerySchema.parse(request.query ?? {});
        const data = await adminService.getRecentActivity({
            cursor: query.cursor,
            limit: query.limit,
        });
        return success(data);
    });
}
