import { createBookSchema, updateBookSchema, bookIdSchema, updateReadingProgressSchema, } from "@couples/shared";
import { ApiError } from "../common/errors/api-error.js";
import { success } from "../common/response.js";
import { requireCouple } from "../auth/auth.middleware.js";
import { readingService } from "./reading.service.js";
function requireAuth(request) {
    if (!request.auth) {
        throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
    }
    return request.auth;
}
export async function registerReadingRoutes(app) {
    /* ---------- GET /v1/reading/books ---------- */
    app.get("/v1/reading/books", async (request) => {
        const auth = requireAuth(request);
        const data = await readingService.list(auth.id);
        return success(data);
    });
    /* ---------- GET /v1/reading/books/:id ---------- */
    app.get("/v1/reading/books/:id", async (request) => {
        const auth = requireAuth(request);
        const params = bookIdSchema.parse(request.params);
        const data = await readingService.getById(auth.id, params.id);
        return success(data);
    });
    /* ---------- POST /v1/reading/books ---------- */
    app.post("/v1/reading/books", { preHandler: requireCouple }, async (request) => {
        const auth = requireAuth(request);
        const input = createBookSchema.parse(request.body);
        const data = await readingService.create(auth.id, input);
        return success(data);
    });
    /* ---------- PATCH /v1/reading/books/:id ---------- */
    app.patch("/v1/reading/books/:id", async (request) => {
        const auth = requireAuth(request);
        const params = bookIdSchema.parse(request.params);
        const input = updateBookSchema.parse(request.body);
        const data = await readingService.update(auth.id, params.id, input);
        return success(data);
    });
    /* ---------- DELETE /v1/reading/books/:id ---------- */
    app.delete("/v1/reading/books/:id", async (request) => {
        const auth = requireAuth(request);
        const params = bookIdSchema.parse(request.params);
        const data = await readingService.remove(auth.id, params.id);
        return success(data);
    });
    /* ---------- POST /v1/reading/progress ---------- */
    app.post("/v1/reading/progress", { preHandler: requireCouple }, async (request) => {
        const auth = requireAuth(request);
        const input = updateReadingProgressSchema.parse(request.body);
        const data = await readingService.updateProgress(auth.id, input);
        return success(data);
    });
}
