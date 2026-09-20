import { createMemorySchema, updateMemorySchema, memoryIdSchema, reactionSchema, paginationSchema, } from "@couples/shared";
import { ApiError } from "../common/errors/api-error.js";
import { success } from "../common/response.js";
import { requireCouple } from "../auth/auth.middleware.js";
import { memoriesService } from "./memories.service.js";
function requireAuth(request) {
    if (!request.auth) {
        throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
    }
    return request.auth;
}
export async function registerMemoryRoutes(app) {
    /* ---------- GET /v1/memories ---------- */
    app.get("/v1/memories", async (request) => {
        const auth = requireAuth(request);
        const query = paginationSchema.parse(request.query ?? {});
        const data = await memoriesService.list(auth.id, {
            cursor: query.cursor,
            limit: query.limit,
        });
        return success(data);
    });
    /* ---------- GET /v1/memories/:id ---------- */
    app.get("/v1/memories/:id", async (request) => {
        const auth = requireAuth(request);
        const params = memoryIdSchema.parse(request.params);
        const data = await memoriesService.getById(auth.id, params.id);
        return success(data);
    });
    /* ---------- POST /v1/memories ---------- */
    app.post("/v1/memories", { preHandler: requireCouple }, async (request) => {
        const auth = requireAuth(request);
        const input = createMemorySchema.parse(request.body);
        const data = await memoriesService.create(auth.id, input);
        return success(data);
    });
    /* ---------- PATCH /v1/memories/:id ---------- */
    app.patch("/v1/memories/:id", async (request) => {
        const auth = requireAuth(request);
        const params = memoryIdSchema.parse(request.params);
        const input = updateMemorySchema.parse(request.body);
        const data = await memoriesService.update(auth.id, params.id, input);
        return success(data);
    });
    /* ---------- DELETE /v1/memories/:id ---------- */
    app.delete("/v1/memories/:id", async (request) => {
        const auth = requireAuth(request);
        const params = memoryIdSchema.parse(request.params);
        const data = await memoriesService.remove(auth.id, params.id);
        return success(data);
    });
    /* ---------- POST /v1/memories/:id/reactions ---------- */
    app.post("/v1/memories/:id/reactions", async (request) => {
        const auth = requireAuth(request);
        const params = memoryIdSchema.parse(request.params);
        const body = reactionSchema.parse(request.body);
        const data = await memoriesService.addReaction(auth.id, params.id, body.emoji);
        return success(data);
    });
    /* ---------- DELETE /v1/memories/:id/reactions/:emoji ---------- */
    app.delete("/v1/memories/:id/reactions/:emoji", async (request) => {
        const auth = requireAuth(request);
        const params = memoryIdSchema.parse(request.params);
        const emojiParams = request.params;
        const emoji = decodeURIComponent(emojiParams.emoji);
        const data = await memoriesService.removeReaction(auth.id, params.id, emoji);
        return success(data);
    });
}
