import { ApiError } from "../common/errors/api-error.js";
export function assertCoupleOwnership(resourceCoupleId, context) {
    if (resourceCoupleId !== context.coupleId) {
        throw new ApiError("FORBIDDEN", "You cannot access this couple resource", 403);
    }
}
