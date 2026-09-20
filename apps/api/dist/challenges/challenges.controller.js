import { createChallengeSchema, challengeIdSchema, challengeProgressSchema, } from "@couples/shared";
import { ApiError } from "../common/errors/api-error.js";
import { success } from "../common/response.js";
import { requireCouple } from "../auth/auth.middleware.js";
import { challengesService } from "./challenges.service.js";
function requireAuth(request) {
    if (!request.auth) {
        throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
    }
    return request.auth;
}
export async function registerChallengeRoutes(app) {
    /* ---------- GET /v1/challenges ---------- */
    app.get("/v1/challenges", async (request) => {
        const auth = requireAuth(request);
        const data = await challengesService.list(auth.id);
        return success(data);
    });
    /* ---------- GET /v1/challenges/:id ---------- */
    app.get("/v1/challenges/:id", async (request) => {
        const auth = requireAuth(request);
        const params = challengeIdSchema.parse(request.params);
        const data = await challengesService.getById(auth.id, params.id);
        return success(data);
    });
    /* ---------- POST /v1/challenges ---------- */
    app.post("/v1/challenges", { preHandler: requireCouple }, async (request) => {
        const auth = requireAuth(request);
        const input = createChallengeSchema.parse(request.body);
        const data = await challengesService.create(auth.id, input);
        return success(data);
    });
    /* ---------- POST /v1/challenges/:id/join ---------- */
    app.post("/v1/challenges/:id/join", { preHandler: requireCouple }, async (request) => {
        const auth = requireAuth(request);
        const params = challengeIdSchema.parse(request.params);
        const data = await challengesService.join(auth.id, params.id);
        return success(data);
    });
    /* ---------- POST /v1/challenges/:id/progress ---------- */
    app.post("/v1/challenges/:id/progress", { preHandler: requireCouple }, async (request) => {
        const auth = requireAuth(request);
        const params = challengeIdSchema.parse(request.params);
        const input = challengeProgressSchema.parse(request.body);
        const data = await challengesService.updateProgress(auth.id, params.id, input);
        return success(data);
    });
    /* ---------- POST /v1/challenges/:id/complete ---------- */
    app.post("/v1/challenges/:id/complete", { preHandler: requireCouple }, async (request) => {
        const auth = requireAuth(request);
        const params = challengeIdSchema.parse(request.params);
        const data = await challengesService.complete(auth.id, params.id);
        return success(data);
    });
    /* ---------- DELETE /v1/challenges/:id ---------- */
    app.delete("/v1/challenges/:id", async (request) => {
        const auth = requireAuth(request);
        const params = challengeIdSchema.parse(request.params);
        const data = await challengesService.remove(auth.id, params.id);
        return success(data);
    });
}
