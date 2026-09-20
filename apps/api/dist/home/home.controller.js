import { ApiError } from "../common/errors/api-error.js";
import { success } from "../common/response.js";
import { homeService } from "./home.service.js";
export async function registerHomeRoutes(app) {
    /* ---------- GET /v1/home ---------- */
    app.get("/v1/home", async (request) => {
        if (!request.auth) {
            throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
        }
        const data = await homeService.getHome(request.auth.id);
        return success(data);
    });
}
