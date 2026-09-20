import { prisma } from "../database/prisma.service.js";
import { ApiError } from "../common/errors/api-error.js";
import { coupleContextService } from "../couples/couple-context.service.js";
import { assertCoupleOwnership } from "../couples/couple-isolation.js";
export class ReadingService {
    async ensureCouple(userId) {
        return coupleContextService.getActiveCoupleForUser(userId);
    }
    async list(userId) {
        const ctx = await this.ensureCouple(userId);
        const books = await prisma.readingBook.findMany({
            where: { coupleId: ctx.coupleId, status: { not: "ARCHIVED" } },
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
            take: 100,
            select: {
                id: true,
                title: true,
                author: true,
                description: true,
                pageCount: true,
                status: true,
                externalUrl: true,
                startedAt: true,
                completedAt: true,
                createdAt: true,
                addedById: true,
                addedBy: {
                    select: { id: true, firstName: true, photoUrl: true },
                },
                participants: {
                    select: {
                        userId: true,
                        status: true,
                        joinedAt: true,
                        user: {
                            select: { id: true, firstName: true, photoUrl: true },
                        },
                    },
                },
                progress: {
                    select: {
                        userId: true,
                        currentPage: true,
                        pagesRead: true,
                        percent: true,
                        lastReadAt: true,
                        streakDays: true,
                        totalReadSeconds: true,
                    },
                },
                _count: {
                    select: { challenges: true },
                },
            },
        });
        return books.map((b) => ({
            ...b,
            startedAt: b.startedAt?.toISOString() ?? null,
            completedAt: b.completedAt?.toISOString() ?? null,
            createdAt: b.createdAt.toISOString(),
            participants: b.participants.map((p) => ({
                ...p,
                joinedAt: p.joinedAt.toISOString(),
            })),
            progress: b.progress.map((p) => ({
                ...p,
                percent: Number(p.percent),
                lastReadAt: p.lastReadAt.toISOString(),
            })),
        }));
    }
    async getById(userId, bookId) {
        const ctx = await this.ensureCouple(userId);
        const book = await prisma.readingBook.findUnique({
            where: { id: bookId },
            select: {
                id: true,
                coupleId: true,
                title: true,
                author: true,
                description: true,
                pageCount: true,
                status: true,
                externalUrl: true,
                startedAt: true,
                completedAt: true,
                createdAt: true,
                updatedAt: true,
                addedById: true,
                addedBy: {
                    select: { id: true, firstName: true, photoUrl: true },
                },
                participants: {
                    select: {
                        userId: true,
                        status: true,
                        joinedAt: true,
                        completedAt: true,
                        user: {
                            select: { id: true, firstName: true, photoUrl: true },
                        },
                    },
                },
                progress: {
                    select: {
                        userId: true,
                        currentPage: true,
                        pagesRead: true,
                        percent: true,
                        lastReadAt: true,
                        streakDays: true,
                        totalReadSeconds: true,
                    },
                },
            },
        });
        if (!book) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Book not found", 404);
        }
        assertCoupleOwnership(book.coupleId, ctx);
        return {
            ...book,
            startedAt: book.startedAt?.toISOString() ?? null,
            completedAt: book.completedAt?.toISOString() ?? null,
            createdAt: book.createdAt.toISOString(),
            updatedAt: book.updatedAt.toISOString(),
            participants: book.participants.map((p) => ({
                ...p,
                joinedAt: p.joinedAt.toISOString(),
                completedAt: p.completedAt?.toISOString() ?? null,
            })),
            progress: book.progress.map((p) => ({
                ...p,
                percent: Number(p.percent),
                lastReadAt: p.lastReadAt.toISOString(),
            })),
        };
    }
    async create(userId, input) {
        const ctx = await this.ensureCouple(userId);
        const book = await prisma.$transaction(async (tx) => {
            const created = await tx.readingBook.create({
                data: {
                    coupleId: ctx.coupleId,
                    addedById: userId,
                    title: input.title,
                    author: input.author ?? null,
                    description: input.description ?? null,
                    pageCount: input.pageCount ?? null,
                    externalUrl: input.externalUrl ?? null,
                    status: "ACTIVE",
                    startedAt: new Date(),
                },
                select: { id: true },
            });
            await tx.readingParticipant.create({
                data: {
                    bookId: created.id,
                    userId,
                    status: "ACTIVE",
                },
            });
            await tx.activityEvent.create({
                data: {
                    coupleId: ctx.coupleId,
                    actorId: userId,
                    type: "BOOK_ADDED",
                    entityId: created.id,
                },
            });
            return created;
        });
        return this.getById(userId, book.id);
    }
    async update(userId, bookId, input) {
        const ctx = await this.ensureCouple(userId);
        const existing = await prisma.readingBook.findUnique({
            where: { id: bookId },
            select: { id: true, coupleId: true, status: true },
        });
        if (!existing) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Book not found", 404);
        }
        assertCoupleOwnership(existing.coupleId, ctx);
        const updateData = {};
        if (input.title !== undefined)
            updateData.title = input.title;
        if (input.author !== undefined)
            updateData.author = input.author;
        if (input.description !== undefined)
            updateData.description = input.description;
        if (input.pageCount !== undefined)
            updateData.pageCount = input.pageCount;
        if (input.status !== undefined) {
            updateData.status = input.status;
            if (input.status === "COMPLETED" && existing.status !== "COMPLETED") {
                updateData.completedAt = new Date();
            }
        }
        await prisma.readingBook.update({
            where: { id: bookId },
            data: updateData,
        });
        return this.getById(userId, bookId);
    }
    async remove(userId, bookId) {
        const ctx = await this.ensureCouple(userId);
        const existing = await prisma.readingBook.findUnique({
            where: { id: bookId },
            select: { id: true, coupleId: true },
        });
        if (!existing) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Book not found", 404);
        }
        assertCoupleOwnership(existing.coupleId, ctx);
        await prisma.readingBook.update({
            where: { id: bookId },
            data: { status: "ARCHIVED" },
        });
        return { archived: true };
    }
    /* ---------- Progress ---------- */
    async updateProgress(userId, input) {
        const ctx = await this.ensureCouple(userId);
        const book = await prisma.readingBook.findUnique({
            where: { id: input.bookId },
            select: {
                id: true,
                coupleId: true,
                pageCount: true,
                status: true,
            },
        });
        if (!book) {
            throw new ApiError("RESOURCE_NOT_FOUND", "Book not found", 404);
        }
        assertCoupleOwnership(book.coupleId, ctx);
        if (book.status === "ARCHIVED") {
            throw new ApiError("FORBIDDEN", "This book is archived", 403);
        }
        const percent = book.pageCount
            ? Math.min(100, Math.round((input.currentPage / book.pageCount) * 10000) / 100)
            : 0;
        const existing = await prisma.readingProgress.findUnique({
            where: {
                bookId_userId: { bookId: input.bookId, userId },
            },
            select: { id: true, streakDays: true, lastReadAt: true },
        });
        /* ---------- Streak calculation ---------- */
        let streakDays = existing?.streakDays ?? 0;
        if (existing?.lastReadAt) {
            const last = new Date(existing.lastReadAt);
            const now = new Date();
            const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
            const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const diffDays = Math.floor((nowDay.getTime() - lastDay.getTime()) / 86_400_000);
            if (diffDays === 0) {
                /* same day — keep streak */
            }
            else if (diffDays === 1) {
                streakDays += 1;
            }
            else {
                streakDays = 1;
            }
        }
        else {
            streakDays = 1;
        }
        const progress = await prisma.readingProgress.upsert({
            where: {
                bookId_userId: { bookId: input.bookId, userId },
            },
            update: {
                currentPage: input.currentPage,
                pagesRead: input.pagesRead,
                percent,
                lastReadAt: new Date(),
                streakDays,
                ...(input.totalReadSeconds !== undefined
                    ? { totalReadSeconds: input.totalReadSeconds }
                    : {}),
            },
            create: {
                bookId: input.bookId,
                userId,
                currentPage: input.currentPage,
                pagesRead: input.pagesRead,
                percent,
                lastReadAt: new Date(),
                streakDays,
                totalReadSeconds: input.totalReadSeconds ?? 0,
            },
            select: {
                userId: true,
                currentPage: true,
                pagesRead: true,
                percent: true,
                lastReadAt: true,
                streakDays: true,
                totalReadSeconds: true,
            },
        });
        /* Ensure participant row exists (in case user joined later) */
        await prisma.readingParticipant.upsert({
            where: {
                bookId_userId: { bookId: input.bookId, userId },
            },
            update: {},
            create: {
                bookId: input.bookId,
                userId,
                status: "ACTIVE",
            },
        });
        /* Auto-complete book if page count reached */
        if (book.pageCount && input.currentPage >= book.pageCount) {
            await prisma.readingBook.update({
                where: { id: input.bookId },
                data: { status: "COMPLETED", completedAt: new Date() },
            });
        }
        await prisma.activityEvent.create({
            data: {
                coupleId: ctx.coupleId,
                actorId: userId,
                type: "READING_PROGRESS",
                entityId: input.bookId,
                payload: { currentPage: input.currentPage, percent },
            },
        });
        return {
            ...progress,
            percent: Number(progress.percent),
            lastReadAt: progress.lastReadAt.toISOString(),
        };
    }
}
export const readingService = new ReadingService();
