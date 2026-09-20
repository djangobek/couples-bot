import { prisma } from "../database/prisma.service.js";
import { ApiError } from "../common/errors/api-error.js";
import type { CoupleContext } from "../auth/auth.types.js";

type MembershipCandidate = {
  id: string;
  role: "OWNER" | "PARTNER";
  couple: { id: string; status: "PENDING" | "ACTIVE" | "PAUSED" | "ARCHIVED" };
};

export function toCoupleContext(userId: string, membership: MembershipCandidate | null): CoupleContext {
  if (!membership || membership.couple.status !== "ACTIVE") {
    throw new ApiError(
      "COUPLE_MEMBERSHIP_REQUIRED",
      "An active couple membership is required",
      403,
    );
  }

  return {
    userId,
    coupleId: membership.couple.id,
    membershipId: membership.id,
    role: membership.role,
  };
}

export class CoupleContextService {
  async getActiveCoupleForUser(userId: string): Promise<CoupleContext> {
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
