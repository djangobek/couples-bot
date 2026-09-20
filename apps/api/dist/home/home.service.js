import { prisma } from "../database/prisma.service.js";
import { ApiError } from "../common/errors/api-error.js";
function daysBetween(a, b) {
    return Math.floor(Math.abs(b.getTime() - a.getTime()) / 86_400_000);
}
export class HomeService {
    async getHome(userId) {
        /* ---------- 1. Active couple ---------- */
        const membership = await prisma.coupleMember.findFirst({
            where: { userId, leftAt: null, couple: { status: "ACTIVE" } },
            orderBy: { joinedAt: "desc" },
            select: { coupleId: true, role: true },
        });
        if (!membership) {
            throw new ApiError("COUPLE_MEMBERSHIP_REQUIRED", "An active couple membership is required", 403);
        }
        const coupleId = membership.coupleId;
        /* ---------- 2. Couple + members ---------- */
        const [couple, members, me] = await Promise.all([
            prisma.couple.findUnique({
                where: { id: coupleId },
                select: {
                    id: true,
                    status: true,
                    displayName: true,
                    anniversaryDate: true,
                    timezone: true,
                    createdAt: true,
                },
            }),
            prisma.coupleMember.findMany({
                where: { coupleId, leftAt: null },
                select: {
                    role: true,
                    joinedAt: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            photoUrl: true,
                        },
                    },
                },
                orderBy: { joinedAt: "asc" },
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    photoUrl: true,
                },
            }),
        ]);
        if (!couple || !me) {
            throw new ApiError("COUPLE_NOT_FOUND", "Couple not found", 404);
        }
        const partnerMember = members.find((m) => m.user.id !== userId);
        const partner = partnerMember?.user ?? null;
        /* ---------- 3. Together days ---------- */
        const togetherDays = couple.anniversaryDate
            ? daysBetween(new Date(couple.anniversaryDate), new Date())
            : daysBetween(new Date(couple.createdAt), new Date());
        /* ---------- 4. Recent activity ---------- */
        const recentActivity = await prisma.activityEvent.findMany({
            where: { coupleId },
            orderBy: { createdAt: "desc" },
            take: 20,
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
        /* ---------- 5. Stats (parallel) ---------- */
        const [memoriesCount, lettersCount, datesCount, booksCount, challengesCount] = await Promise.all([
            prisma.memory.count({
                where: { coupleId, deletedAt: null },
            }),
            prisma.letter.count({
                where: { coupleId, status: { in: ["SENT", "READ"] } },
            }),
            prisma.dateEvent.count({ where: { coupleId } }),
            prisma.readingBook.count({
                where: { coupleId, status: { in: ["ACTIVE", "COMPLETED"] } },
            }),
            prisma.coupleChallenge.count({ where: { coupleId } }),
        ]);
        /* ---------- 6. Reading in progress ---------- */
        const activeBook = await prisma.readingBook.findFirst({
            where: { coupleId, status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                author: true,
                pageCount: true,
                progress: {
                    select: {
                        userId: true,
                        currentPage: true,
                        percent: true,
                    },
                },
            },
        });
        /* ---------- 7. Upcoming dates ---------- */
        const upcomingDates = await prisma.dateEvent.findMany({
            where: {
                coupleId,
                startsAt: { gte: new Date() },
            },
            orderBy: { startsAt: "asc" },
            take: 3,
            select: {
                id: true,
                title: true,
                startsAt: true,
                location: true,
            },
        });
        return {
            user: me,
            couple: {
                id: couple.id,
                displayName: couple.displayName,
                anniversaryDate: couple.anniversaryDate?.toISOString() ?? null,
                timezone: couple.timezone,
                createdAt: couple.createdAt.toISOString(),
                togetherDays,
            },
            partner: partner
                ? {
                    id: partner.id,
                    firstName: partner.firstName,
                    lastName: partner.lastName,
                    username: partner.username,
                    photoUrl: partner.photoUrl,
                }
                : null,
            recentActivity: recentActivity.map((a) => ({
                id: a.id,
                type: a.type,
                entityId: a.entityId,
                payload: a.payload,
                createdAt: a.createdAt.toISOString(),
                actor: a.actor
                    ? {
                        id: a.actor.id,
                        firstName: a.actor.firstName,
                        photoUrl: a.actor.photoUrl,
                    }
                    : null,
            })),
            stats: {
                memories: memoriesCount,
                letters: lettersCount,
                dates: datesCount,
                books: booksCount,
                challenges: challengesCount,
            },
            reading: activeBook
                ? {
                    id: activeBook.id,
                    title: activeBook.title,
                    author: activeBook.author,
                    pageCount: activeBook.pageCount,
                    progress: activeBook.progress.map((p) => ({
                        userId: p.userId,
                        currentPage: p.currentPage,
                        percent: Number(p.percent),
                    })),
                }
                : null,
            upcomingDates: upcomingDates.map((d) => ({
                id: d.id,
                title: d.title,
                startsAt: d.startsAt.toISOString(),
                location: d.location,
            })),
        };
    }
}
export const homeService = new HomeService();
