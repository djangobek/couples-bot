import { prisma } from "../database/prisma.service.js";
import { ApiError } from "../common/errors/api-error.js";
import { coupleContextService } from "../couples/couple-context.service.js";
import { assertCoupleOwnership } from "../couples/couple-isolation.js";
export class DatesService {
    async ensureCouple(userId) {
        return coupleContextService.getActiveCoupleForUser(userId);
    }
    async list(userId, options) {
        const ctx = await this.ensureCouple(userId);
        const dates = await prisma.dateEvent.findMany({
            where: {
                coupleId: ctx.coupleId,
                ...(options.upcoming ? { startsAt: { gte: new Date() } } : {}),
            },
            orderBy: { startsAt: options.upcoming ? "asc" : "desc" },
            take: 100,
            select: {
                id: true,
                title: true,
                description: true,
                startsAt: true,
                endsAt: true,
                location: true,
                reminderAt: true,
                createdAt: true,
                creatorId: true,
                creator: {
                    select: { id: true, firstName: true, photoUrl: true },
                },
            },
        });
        return dates.map((d) => ({
            ...d,
            startsAt: d.startsAt.toISOString(),
            endsAt: d.endsAt?.toISOString() ?? null,
            reminderAt: d.reminderAt?.toISOString() ?? null,
            createdAt: d.createdAt.toISOString(),
        }));
    }
    async getById(userId, dateId) {
        const ctx = await this.ensureCouple(userId);
        const date = await prisma.dateEvent.findUnique({
            where: { id: dateId },
            select: {
                id: true,
                coupleId: true,
                title: true,
                description: true,
                startsAt: true,
                endsAt: true,
                location: true,
                reminderAt: true,
                createdAt: true,
                updatedAt: true,
                creatorId: true,
                creator: {
                    select: { id: true, firstName: true, photoUrl: true },
                },
            },
        });
        if (!date) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Date not found", 404);
        }
        assertCoupleOwnership(date.coupleId, ctx);
        return {
            ...date,
            startsAt: date.startsAt.toISOString(),
            endsAt: date.endsAt?.toISOString() ?? null,
            reminderAt: date.reminderAt?.toISOString() ?? null,
            createdAt: date.createdAt.toISOString(),
            updatedAt: date.updatedAt.toISOString(),
        };
    }
    async create(userId, input) {
        const ctx = await this.ensureCouple(userId);
        if (input.endsAt && input.endsAt < input.startsAt) {
            throw new ApiError("VALIDATION_ERROR", "End date cannot be before start date", 400);
        }
        const date = await prisma.dateEvent.create({
            data: {
                coupleId: ctx.coupleId,
                creatorId: userId,
                title: input.title,
                description: input.description ?? null,
                startsAt: input.startsAt,
                endsAt: input.endsAt ?? null,
                location: input.location ?? null,
                reminderAt: input.reminderAt ?? null,
            },
            select: { id: true },
        });
        await prisma.activityEvent.create({
            data: {
                coupleId: ctx.coupleId,
                actorId: userId,
                type: "DATE_CREATED",
                entityId: date.id,
            },
        });
        return this.getById(userId, date.id);
    }
    async update(userId, dateId, input) {
        const ctx = await this.ensureCouple(userId);
        const existing = await prisma.dateEvent.findUnique({
            where: { id: dateId },
            select: {
                id: true,
                coupleId: true,
                startsAt: true,
                endsAt: true,
            },
        });
        if (!existing) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Date not found", 404);
        }
        assertCoupleOwnership(existing.coupleId, ctx);
        const newStartsAt = input.startsAt ?? existing.startsAt;
        const newEndsAt = input.endsAt !== undefined ? input.endsAt : existing.endsAt;
        if (newEndsAt && newEndsAt < newStartsAt) {
            throw new ApiError("VALIDATION_ERROR", "End date cannot be before start date", 400);
        }
        await prisma.dateEvent.update({
            where: { id: dateId },
            data: {
                ...(input.title !== undefined ? { title: input.title } : {}),
                ...(input.description !== undefined
                    ? { description: input.description }
                    : {}),
                ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
                ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
                ...(input.location !== undefined ? { location: input.location } : {}),
                ...(input.reminderAt !== undefined
                    ? { reminderAt: input.reminderAt }
                    : {}),
            },
        });
        return this.getById(userId, dateId);
    }
    async remove(userId, dateId) {
        const ctx = await this.ensureCouple(userId);
        const existing = await prisma.dateEvent.findUnique({
            where: { id: dateId },
            select: { id: true, coupleId: true },
        });
        if (!existing) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Date not found", 404);
        }
        assertCoupleOwnership(existing.coupleId, ctx);
        await prisma.dateEvent.delete({ where: { id: dateId } });
        return { deleted: true };
    }
}
export const datesService = new DatesService();
