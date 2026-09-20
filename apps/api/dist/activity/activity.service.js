import { prisma } from "../database/prisma.service.js";
import { coupleContextService } from "../couples/couple-context.service.js";
export class ActivityService {
    async list(userId, options) {
        const ctx = await coupleContextService.getActiveCoupleForUser(userId);
        const items = await prisma.activityEvent.findMany({
            where: { coupleId: ctx.coupleId },
            orderBy: { createdAt: "desc" },
            take: options.limit + 1,
            ...(options.cursor
                ? { cursor: { id: options.cursor }, skip: 1 }
                : {}),
            select: {
                id: true,
                type: true,
                entityId: true,
                payload: true,
                createdAt: true,
                actor: {
                    select: {
                        id: true,
                        firstName: true,
                        photoUrl: true,
                    },
                },
            },
        });
        let nextCursor = null;
        if (items.length > options.limit) {
            const next = items.pop();
            nextCursor = next?.id ?? null;
        }
        return {
            items: items.map((a) => ({
                ...a,
                createdAt: a.createdAt.toISOString(),
            })),
            nextCursor,
        };
    }
}
export const activityService = new ActivityService();
