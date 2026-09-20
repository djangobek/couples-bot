import crypto from "node:crypto";
import { prisma } from "../database/prisma.service.js";
import { ApiError } from "../common/errors/api-error.js";
import { env } from "@couples/config";
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
function tokenHash(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}
function newToken() {
    return crypto.randomBytes(32).toString("base64url");
}
export class CoupleService {
    async createCouple(userId) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.coupleMember.findFirst({
                where: { userId, leftAt: null, couple: { status: "ACTIVE" } },
                select: { id: true },
            });
            if (existing) {
                throw new ApiError("ALREADY_IN_COUPLE", "You are already in an active couple", 409);
            }
            const couple = await tx.couple.create({
                data: { status: "ACTIVE" },
                select: { id: true, status: true },
            });
            const membership = await tx.coupleMember.create({
                data: { coupleId: couple.id, userId, role: "OWNER" },
                select: { id: true, role: true },
            });
            return { couple, membership };
        }, { isolationLevel: "Serializable" });
    }
    async getCurrentCouple(userId) {
        const membership = await prisma.coupleMember.findFirst({
            where: { userId, leftAt: null, couple: { status: "ACTIVE" } },
            orderBy: { joinedAt: "desc" },
            select: { id: true, role: true, joinedAt: true, coupleId: true },
        });
        if (!membership)
            return null;
        const couple = await prisma.couple.findUnique({
            where: { id: membership.coupleId },
            select: {
                id: true, status: true, displayName: true, anniversaryDate: true,
                timezone: true, createdAt: true, updatedAt: true,
            },
        });
        if (!couple || couple.status !== "ACTIVE")
            return null;
        const members = await prisma.coupleMember.findMany({
            where: { coupleId: couple.id, leftAt: null },
            select: {
                id: true, role: true, joinedAt: true,
                user: { select: { id: true, telegramId: true, username: true, firstName: true, lastName: true, photoUrl: true } },
            },
            orderBy: { joinedAt: "asc" },
        });
        const me = members.find((m) => m.user.id === userId);
        const partner = members.find((m) => m.user.id !== userId);
        return {
            couple,
            me: me ? {
                id: me.user.id, telegramId: me.user.telegramId.toString(),
                username: me.user.username, firstName: me.user.firstName,
                lastName: me.user.lastName, photoUrl: me.user.photoUrl,
                role: me.role, joinedAt: me.joinedAt,
            } : null,
            partner: partner ? {
                id: partner.user.id, telegramId: partner.user.telegramId.toString(),
                username: partner.user.username, firstName: partner.user.firstName,
                lastName: partner.user.lastName, photoUrl: partner.user.photoUrl,
                role: partner.role, joinedAt: partner.joinedAt,
            } : null,
        };
    }
    async getMembers(userId) {
        const current = await this.getCurrentCouple(userId);
        if (!current)
            throw new ApiError("COUPLE_MEMBERSHIP_REQUIRED", "An active couple membership is required", 403);
        return prisma.coupleMember.findMany({
            where: { coupleId: current.couple.id, leftAt: null },
            select: {
                id: true, role: true, joinedAt: true,
                user: { select: { id: true, username: true, firstName: true, lastName: true, photoUrl: true } },
            },
            orderBy: { joinedAt: "asc" },
        });
    }
    async createInvite(userId) {
        const current = await this.getCurrentCouple(userId);
        if (!current)
            throw new ApiError("COUPLE_MEMBERSHIP_REQUIRED", "An active couple membership is required", 403);
        const count = await prisma.coupleMember.count({ where: { coupleId: current.couple.id, leftAt: null } });
        if (count >= 2)
            throw new ApiError("COUPLE_FULL", "This couple already has two members", 409);
        const token = newToken();
        const invite = await prisma.coupleInvite.create({
            data: {
                coupleId: current.couple.id,
                senderId: userId,
                tokenHash: tokenHash(token),
                expiresAt: new Date(Date.now() + INVITE_TTL_MS),
            },
            select: { expiresAt: true, status: true },
        });
        const botUsername = env.BOT_USERNAME;
        const shareUrl = botUsername
            ? `https://t.me/${botUsername}?start=invite_${encodeURIComponent(token)}`
            : null;
        return { code: token, expiresAt: invite.expiresAt, status: invite.status, shareUrl };
    }
    async resolveInvite(code) {
        const invite = await prisma.coupleInvite.findUnique({
            where: { tokenHash: tokenHash(code) },
            select: {
                id: true, status: true, expiresAt: true, senderId: true, coupleId: true,
                couple: { select: { id: true, status: true, displayName: true } },
                sender: { select: { firstName: true, username: true, photoUrl: true } },
            },
        });
        if (!invite)
            throw new ApiError("INVITE_NOT_FOUND", "Invite not found", 404);
        if (invite.status === "ACCEPTED")
            throw new ApiError("INVITE_ALREADY_ACCEPTED", "Invite has already been accepted", 409);
        if (invite.status === "REVOKED")
            throw new ApiError("INVITE_REVOKED", "Invite has been revoked", 409);
        if (invite.expiresAt <= new Date()) {
            await prisma.coupleInvite.updateMany({
                where: { id: invite.id, status: "PENDING" }, data: { status: "EXPIRED" },
            });
            throw new ApiError("INVITE_EXPIRED", "Invite has expired", 410);
        }
        if (invite.couple.status !== "ACTIVE")
            throw new ApiError("INVITE_NOT_FOUND", "Couple is no longer active", 404);
        return {
            code,
            expiresAt: invite.expiresAt,
            couple: invite.couple,
            sender: invite.sender,
        };
    }
    async acceptInvite(userId, code) {
        return prisma.$transaction(async (tx) => {
            const invite = await tx.coupleInvite.findUnique({
                where: { tokenHash: tokenHash(code) },
                select: { id: true, coupleId: true, senderId: true, status: true, expiresAt: true, couple: { select: { status: true } } },
            });
            if (!invite)
                throw new ApiError("INVITE_NOT_FOUND", "Invite not found", 404);
            if (invite.status === "ACCEPTED")
                throw new ApiError("INVITE_ALREADY_ACCEPTED", "Invite has already been accepted", 409);
            if (invite.status === "REVOKED")
                throw new ApiError("INVITE_REVOKED", "Invite has been revoked", 409);
            if (invite.expiresAt <= new Date()) {
                await tx.coupleInvite.updateMany({ where: { id: invite.id, status: "PENDING" }, data: { status: "EXPIRED" } });
                throw new ApiError("INVITE_EXPIRED", "Invite has expired", 410);
            }
            if (invite.couple.status !== "ACTIVE")
                throw new ApiError("INVITE_NOT_FOUND", "Couple is no longer active", 404);
            if (invite.senderId === userId)
                throw new ApiError("SELF_INVITE", "You cannot accept your own invite", 409);
            const ownMembership = await tx.coupleMember.findFirst({
                where: { userId, leftAt: null, couple: { status: "ACTIVE" } },
                select: { id: true },
            });
            if (ownMembership)
                throw new ApiError("ALREADY_IN_COUPLE", "You are already in an active couple", 409);
            const members = await tx.coupleMember.count({ where: { coupleId: invite.coupleId, leftAt: null } });
            if (members >= 2)
                throw new ApiError("COUPLE_FULL", "This couple already has two members", 409);
            const membership = await tx.coupleMember.create({
                data: { coupleId: invite.coupleId, userId, role: "PARTNER" },
                select: { id: true, role: true },
            });
            await tx.coupleInvite.update({
                where: { id: invite.id },
                data: { status: "ACCEPTED", acceptedAt: new Date(), receiverId: userId },
            });
            await tx.activityEvent.create({
                data: { coupleId: invite.coupleId, actorId: userId, type: "PARTNER_JOINED" },
            });
            return { coupleId: invite.coupleId, membership };
        }, { isolationLevel: "Serializable" });
    }
    async leaveCouple(userId) {
        return prisma.$transaction(async (tx) => {
            const membership = await tx.coupleMember.findFirst({
                where: { userId, leftAt: null, couple: { status: "ACTIVE" } },
                select: { id: true, coupleId: true },
            });
            if (!membership)
                throw new ApiError("COUPLE_MEMBERSHIP_REQUIRED", "An active couple membership is required", 403);
            await tx.coupleMember.update({ where: { id: membership.id }, data: { leftAt: new Date() } });
            await tx.activityEvent.create({ data: { coupleId: membership.coupleId, actorId: userId, type: "PARTNER_LEFT" } });
            const remaining = await tx.coupleMember.count({ where: { coupleId: membership.coupleId, leftAt: null } });
            if (remaining === 0) {
                await tx.couple.update({ where: { id: membership.coupleId }, data: { status: "ARCHIVED", archivedAt: new Date() } });
            }
            return { left: true };
        });
    }
}
export const coupleService = new CoupleService();
