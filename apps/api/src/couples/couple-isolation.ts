import { ApiError } from "../common/errors/api-error.js";
import type { CoupleContext } from "../auth/auth.types.js";

export function assertCoupleOwnership(resourceCoupleId: string, context: CoupleContext): void {
  if (resourceCoupleId !== context.coupleId) {
    throw new ApiError("FORBIDDEN", "You cannot access this couple resource", 403);
  }
}
