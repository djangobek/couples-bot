import { createLetterSchema, updateLetterSchema, letterIdSchema, } from "@couples/shared";
import { ApiError } from "../common/errors/api-error.js";
import { success } from "../common/response.js";
import { requireCouple } from "../auth/auth.middleware.js";
import { lettersService } from "./letters.service.js";
function requireAuth(request) {
    if (!request.auth) {
        throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
    }
    return request.auth;
}
export async function registerLetterRoutes(app) {
    /* ---------- GET /v1/letters ---------- */
    app.get("/v1/letters", async (request) => {
        const auth = requireAuth(request);
        const data = await lettersService.list(auth.id);
        return success(data);
    });
    /* ---------- GET /v1/letters/:id ---------- */
    app.get("/v1/letters/:id", async (request) => {
        const auth = requireAuth(request);
        const params = letterIdSchema.parse(request.params);
        const data = await lettersService.getById(auth.id, params.id);
        return success(data);
    });
    /* ---------- POST /v1/letters ---------- */
    app.post("/v1/letters", { preHandler: requireCouple }, async (request) => {
        const auth = requireAuth(request);
        const input = createLetterSchema.parse(request.body);
        const data = await lettersService.create(auth.id, input);
        return success(data);
    });
    /* ---------- PATCH /v1/letters/:id ---------- */
    app.patch("/v1/letters/:id", async (request) => {
        const auth = requireAuth(request);
        const params = letterIdSchema.parse(request.params);
        const input = updateLetterSchema.parse(request.body);
        const data = await lettersService.update(auth.id, params.id, input);
        return success(data);
    });
    /* ---------- POST /v1/letters/:id/read ---------- */
    app.post("/v1/letters/:id/read", async (request) => {
        const auth = requireAuth(request);
        const params = letterIdSchema.parse(request.params);
        const data = await lettersService.markRead(auth.id, params.id);
        return success(data);
    });
    /* ---------- DELETE /v1/letters/:id ---------- */
    app.delete("/v1/letters/:id", async (request) => {
        const auth = requireAuth(request);
        const params = letterIdSchema.parse(request.params);
        const data = await lettersService.remove(auth.id, params.id);
        return success(data);
    });
}
