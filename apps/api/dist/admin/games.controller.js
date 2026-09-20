/* ============================================================
   ADMIN — Games Controller
   ============================================================ */
import { z } from "zod";
import { success } from "../common/response.js";
import { ApiError } from "../common/errors/api-error.js";
import { adminService } from "./admin.service.js";
import { requireAdmin } from "./admin.middleware.js";
const listQuerySchema = z.object({
    search: z.string().max(100).optional(),
    type: z.enum(["BOMB", "TIC_TAC_TOE"]).optional(),
    status: z
        .enum([
        "WAITING",
        "PLACING",
        "PLAYING",
        "PAUSED",
        "FINISHED",
        "ABANDONED",
        "EXPIRED",
    ])
        .optional(),
    sortBy: z.enum(["createdAt", "finishedAt"]).default("createdAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc"),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
});
const gameIdSchema = z.object({
    id: z.string().uuid(),
});
export function registerAdminGameRoutes(app) {
    /* ============================================================
       GET /v1/admin/games
       ============================================================ */
    app.get("/v1/admin/games", async (request) => {
        requireAdmin(request);
        const query = listQuerySchema.parse(request.query ?? {});
        const data = await adminService.listGames({
            search: query.search,
            type: query.type,
            status: query.status,
            sortBy: query.sortBy,
            sortDir: query.sortDir,
        }, {
            cursor: query.cursor,
            limit: query.limit,
        });
        return success(data);
    });
    /* ============================================================
       GET /v1/admin/games/:id
       ============================================================ */
    app.get("/v1/admin/games/:id", async (request) => {
        requireAdmin(request);
        const params = gameIdSchema.parse(request.params);
        const game = await adminService.getGameDetail(params.id);
        if (!game) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Game not found", 404);
        }
        return success(game);
    });
    /* ============================================================
       POST /v1/admin/games/:id/abandon
       Force abandon active game
       ============================================================ */
    app.post("/v1/admin/games/:id/abandon", async (request) => {
        const admin = requireAdmin(request);
        const params = gameIdSchema.parse(request.params);
        await adminService.abandonGame(params.id);
        await adminService.logAdminAction({
            actorId: admin.id,
            action: "GAME_ABANDONED_BY_ADMIN",
            entity: "GameSession",
            entityId: params.id,
        });
        return success({ abandoned: true });
    });
}
