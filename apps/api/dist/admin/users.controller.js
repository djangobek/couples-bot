import { z } from "zod";
import { success } from "../common/response.js";
import { ApiError } from "../common/errors/api-error.js";
import { adminService } from "./admin.service.js";
import { requireAdmin } from "./admin.middleware.js";
const listQuerySchema = z.object({
    search: z.string().max(100).optional(),
    status: z.enum(["ACTIVE", "BLOCKED", "DELETED"]).optional(),
    sortBy: z.enum(["createdAt", "lastSeenAt", "username"]).default("createdAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc"),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
});
const userIdSchema = z.object({
    id: z.string().uuid(),
});
export function registerAdminUserRoutes(app) {
    /* GET /v1/admin/users */
    app.get("/v1/admin/users", async (request) => {
        requireAdmin(request);
        const query = listQuerySchema.parse(request.query ?? {});
        const data = await adminService.listUsers({
            search: query.search,
            status: query.status,
            sortBy: query.sortBy,
            sortDir: query.sortDir,
        }, {
            cursor: query.cursor,
            limit: query.limit,
        });
        return success(data);
    });
    /* GET /v1/admin/users/:id */
    app.get("/v1/admin/users/:id", async (request) => {
        requireAdmin(request);
        const params = userIdSchema.parse(request.params);
        const user = await adminService.getUserDetail(params.id);
        if (!user) {
            throw new ApiError("RESOURCE_NOT_FOUND", "User not found", 404);
        }
        return success(user);
    });
    /* POST /v1/admin/users/:id/block */
    app.post("/v1/admin/users/:id/block", async (request) => {
        const admin = requireAdmin(request);
        const params = userIdSchema.parse(request.params);
        await adminService.blockUser(params.id);
        await adminService.logAdminAction({
            actorId: admin.id,
            action: "USER_BLOCKED",
            entity: "User",
            entityId: params.id,
        });
        return success({ blocked: true });
    });
    /* POST /v1/admin/users/:id/unblock */
    app.post("/v1/admin/users/:id/unblock", async (request) => {
        const admin = requireAdmin(request);
        const params = userIdSchema.parse(request.params);
        await adminService.unblockUser(params.id);
        await adminService.logAdminAction({
            actorId: admin.id,
            action: "USER_UNBLOCKED",
            entity: "User",
            entityId: params.id,
        });
        return success({ unblocked: true });
    });
}
