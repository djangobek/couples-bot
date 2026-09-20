import { prisma } from "../database/prisma.service.js";
import { ApiError } from "../common/errors/api-error.js";
export function toCoupleContext(userId, membership) {
    if (!membership || membership.couple.status !== "ACTIVE") {
        throw new ApiError("COUPLE_MEMBERSHIP_REQUIRED", "An active couple membership is required", 403);
    }
    return {
        userId,
        coupleId: membership.couple.id,
        membershipId: membership.id,
        role: membership.role,
    };
}
export class CoupleContextService {
    async getActiveCoupleForUser(userId) {
        const membership = await prisma.coupleMember.findFirst({
            where: {
                userId,
                leftAt: null,
                couple: { status: "ACTIVE" },
            },
            orderBy: { joinedAt: "desc" },
            select: {
                id: true,
                role: true,
                couple: { select: { id: true, status: true } },
            },
        });
        return toCoupleContext(userId, membership);
    }
}
export const coupleContextService = new CoupleContextService();
