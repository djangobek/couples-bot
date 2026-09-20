import { prisma } from "../database/prisma.service.js";
import { ApiError } from "../common/errors/api-error.js";
import { coupleContextService } from "../couples/couple-context.service.js";
import { assertCoupleOwnership } from "../couples/couple-isolation.js";
/* Helper: convert plain object to Prisma JSON input */
function toJsonInput(value) {
    if (value === undefined || value === null)
        return undefined;
    return value;
}
export class ChallengesService {
    async ensureCouple(userId) {
        return coupleContextService.getActiveCoupleForUser(userId);
    }
    async list(userId) {
        const ctx = await this.ensureCouple(userId);
        const challenges = await prisma.coupleChallenge.findMany({
            where: { coupleId: ctx.coupleId },
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
            take: 100,
            select: {
                id: true,
                title: true,
                description: true,
                type: true,
                status: true,
                targetValue: true,
                startsAt: true,
                endsAt: true,
                createdAt: true,
                creatorId: true,
                winnerUserId: true,
                creator: {
                    select: { id: true, firstName: true, photoUrl: true },
                },
                winner: {
                    select: { id: true, firstName: true, photoUrl: true },
                },
                participants: {
                    select: {
                        userId: true,
                        score: true,
                        progress: true,
                        joinedAt: true,
                        completedAt: true,
                        user: {
                            select: { id: true, firstName: true, photoUrl: true },
                        },
                    },
                    orderBy: { score: "desc" },
                },
            },
        });
        return challenges.map((c) => ({
            ...c,
            startsAt: c.startsAt?.toISOString() ?? null,
            endsAt: c.endsAt?.toISOString() ?? null,
            createdAt: c.createdAt.toISOString(),
            participants: c.participants.map((p) => ({
                ...p,
                progress: Number(p.progress),
                joinedAt: p.joinedAt.toISOString(),
                completedAt: p.completedAt?.toISOString() ?? null,
            })),
        }));
    }
    async getById(userId, challengeId) {
        const ctx = await this.ensureCouple(userId);
        const challenge = await prisma.coupleChallenge.findUnique({
            where: { id: challengeId },
            select: {
                id: true,
                coupleId: true,
                title: true,
                description: true,
                type: true,
                status: true,
                targetValue: true,
                startsAt: true,
                endsAt: true,
                createdAt: true,
                updatedAt: true,
                creatorId: true,
                winnerUserId: true,
                bookId: true,
                rules: true,
                creator: {
                    select: { id: true, firstName: true, photoUrl: true },
                },
                winner: {
                    select: { id: true, firstName: true, photoUrl: true },
                },
                book: {
                    select: { id: true, title: true, author: true },
                },
                participants: {
                    select: {
                        userId: true,
                        score: true,
                        progress: true,
                        joinedAt: true,
                        completedAt: true,
                        user: {
                            select: { id: true, firstName: true, photoUrl: true },
                        },
                    },
                    orderBy: { score: "desc" },
                },
            },
        });
        if (!challenge) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Challenge not found", 404);
        }
        assertCoupleOwnership(challenge.coupleId, ctx);
        return {
            ...challenge,
            startsAt: challenge.startsAt?.toISOString() ?? null,
            endsAt: challenge.endsAt?.toISOString() ?? null,
            createdAt: challenge.createdAt.toISOString(),
            updatedAt: challenge.updatedAt.toISOString(),
            participants: challenge.participants.map((p) => ({
                ...p,
                progress: Number(p.progress),
                joinedAt: p.joinedAt.toISOString(),
                completedAt: p.completedAt?.toISOString() ?? null,
            })),
        };
    }
    async create(userId, input) {
        const ctx = await this.ensureCouple(userId);
        /* If linked to a book, verify ownership */
        if (input.bookId) {
            const book = await prisma.readingBook.findUnique({
                where: { id: input.bookId },
                select: { coupleId: true },
            });
            if (!book) {
                throw new ApiError("RESOURCE_NOT_FOUND", "Book not found", 404);
            }
            assertCoupleOwnership(book.coupleId, ctx);
        }
        const challenge = await prisma.$transaction(async (tx) => {
            const created = await tx.coupleChallenge.create({
                data: {
                    coupleId: ctx.coupleId,
                    creatorId: userId,
                    bookId: input.bookId ?? null,
                    type: input.type,
                    status: "ACTIVE",
                    title: input.title,
                    description: input.description ?? null,
                    targetValue: input.targetValue ?? null,
                    startsAt: input.startsAt ?? new Date(),
                    endsAt: input.endsAt ?? null,
                    rules: toJsonInput(input.rules ?? null),
                },
                select: { id: true },
            });
            /* Auto-join the creator */
            await tx.challengeParticipant.create({
                data: {
                    challengeId: created.id,
                    userId,
                },
            });
            await tx.activityEvent.create({
                data: {
                    coupleId: ctx.coupleId,
                    actorId: userId,
                    type: "CHALLENGE_CREATED",
                    entityId: created.id,
                },
            });
            return created;
        });
        return this.getById(userId, challenge.id);
    }
    async join(userId, challengeId) {
        const ctx = await this.ensureCouple(userId);
        const challenge = await prisma.coupleChallenge.findUnique({
            where: { id: challengeId },
            select: { id: true, coupleId: true, status: true },
        });
        if (!challenge) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Challenge not found", 404);
        }
        assertCoupleOwnership(challenge.coupleId, ctx);
        if (challenge.status !== "ACTIVE") {
            throw new ApiError("FORBIDDEN", "This challenge is not active", 403);
        }
        await prisma.challengeParticipant.upsert({
            where: {
                challengeId_userId: { challengeId, userId },
            },
            update: {},
            create: { challengeId, userId },
        });
        return this.getById(userId, challengeId);
    }
    async updateProgress(userId, challengeId, input) {
        const ctx = await this.ensureCouple(userId);
        const challenge = await prisma.coupleChallenge.findUnique({
            where: { id: challengeId },
            select: {
                id: true,
                coupleId: true,
                status: true,
                targetValue: true,
            },
        });
        if (!challenge) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Challenge not found", 404);
        }
        assertCoupleOwnership(challenge.coupleId, ctx);
        if (challenge.status !== "ACTIVE") {
            throw new ApiError("FORBIDDEN", "This challenge is not active", 403);
        }
        const participant = await prisma.challengeParticipant.upsert({
            where: {
                challengeId_userId: { challengeId, userId },
            },
            update: {
                ...(input.score !== undefined ? { score: input.score } : {}),
                ...(input.progress !== undefined ? { progress: input.progress } : {}),
            },
            create: {
                challengeId,
                userId,
                score: input.score ?? 0,
                progress: input.progress ?? 0,
            },
            select: {
                score: true,
                progress: true,
                user: { select: { id: true, firstName: true, photoUrl: true } },
            },
        });
        /* Auto-complete if targetValue reached */
        if (challenge.targetValue &&
            participant.score >= challenge.targetValue &&
            challenge.status === "ACTIVE") {
            await prisma.$transaction([
                prisma.coupleChallenge.update({
                    where: { id: challengeId },
                    data: {
                        status: "COMPLETED",
                        winnerUserId: userId,
                    },
                }),
                prisma.challengeParticipant.update({
                    where: {
                        challengeId_userId: { challengeId, userId },
                    },
                    data: { completedAt: new Date() },
                }),
                prisma.activityEvent.create({
                    data: {
                        coupleId: ctx.coupleId,
                        actorId: userId,
                        type: "CHALLENGE_COMPLETED",
                        entityId: challengeId,
                    },
                }),
            ]);
        }
        return {
            score: participant.score,
            progress: Number(participant.progress),
            user: participant.user,
        };
    }
    async complete(userId, challengeId) {
        const ctx = await this.ensureCouple(userId);
        const challenge = await prisma.coupleChallenge.findUnique({
            where: { id: challengeId },
            select: { id: true, coupleId: true, status: true },
        });
        if (!challenge) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Challenge not found", 404);
        }
        assertCoupleOwnership(challenge.coupleId, ctx);
        const participants = await prisma.challengeParticipant.findMany({
            where: { challengeId },
            orderBy: { score: "desc" },
            take: 1,
            select: { userId: true },
        });
        const winnerUserId = participants[0]?.userId ?? null;
        await prisma.$transaction([
            prisma.coupleChallenge.update({
                where: { id: challengeId },
                data: {
                    status: "COMPLETED",
                    winnerUserId,
                },
            }),
            prisma.activityEvent.create({
                data: {
                    coupleId: ctx.coupleId,
                    actorId: userId,
                    type: "CHALLENGE_COMPLETED",
                    entityId: challengeId,
                },
            }),
        ]);
        return this.getById(userId, challengeId);
    }
    async remove(userId, challengeId) {
        const ctx = await this.ensureCouple(userId);
        const challenge = await prisma.coupleChallenge.findUnique({
            where: { id: challengeId },
            select: { id: true, coupleId: true, creatorId: true },
        });
        if (!challenge) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Challenge not found", 404);
        }
        assertCoupleOwnership(challenge.coupleId, ctx);
        if (challenge.creatorId !== userId) {
            throw new ApiError("FORBIDDEN", "Only the creator can cancel this challenge", 403);
        }
        await prisma.coupleChallenge.update({
            where: { id: challengeId },
            data: { status: "CANCELLED" },
        });
        return { cancelled: true };
    }
}
export const challengesService = new ChallengesService();
