/* ============================================================
   SUBSCRIPTION — Controller
   ============================================================ */
import { ApiError } from "../common/errors/api-error.js";
import { success } from "../common/response.js";
import { subscriptionService } from "./subscription.service.js";
function requireAuth(request) {
    if (!request.auth) {
        throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
    }
    return request.auth;
}
export function registerSubscriptionRoutes(app) {
    /* GET /v1/subscription/status */
    app.get("/v1/subscription/status", async (request) => {
        const auth = requireAuth(request);
        const status = await subscriptionService.checkStatus(auth.id);
        return success(status);
    });
    /* POST /v1/subscription/check (force refresh) */
    app.post("/v1/subscription/check", async (request) => {
        const auth = requireAuth(request);
        const status = await subscriptionService.forceCheckStatus(auth.id);
        return success(status);
    });
}
