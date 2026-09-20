import { prisma } from "../database/prisma.service.js";
import { ApiError } from "../common/errors/api-error.js";
import { coupleContextService } from "../couples/couple-context.service.js";
import { assertCoupleOwnership } from "../couples/couple-isolation.js";
import type {
  CreateLetterInput,
  UpdateLetterInput,
} from "@couples/shared";

export class LettersService {
  private async ensureCouple(userId: string) {
    return coupleContextService.getActiveCoupleForUser(userId);
  }

  private async resolveReceiverId(coupleId: string, senderId: string) {
    const partner = await prisma.coupleMember.findFirst({
      where: { coupleId, leftAt: null, userId: { not: senderId } },
      select: { userId: true },
    });

    if (!partner) {
      throw new ApiError(
        "COUPLE_MEMBERSHIP_REQUIRED",
        "Your partner has not joined yet",
        403,
      );
    }

    return partner.userId;
  }

  async list(userId: string) {
    const ctx = await this.ensureCouple(userId);

    const letters = await prisma.letter.findMany({
      where: {
        coupleId: ctx.coupleId,
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: { not: "DRAFT" },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        body: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
        readAt: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        sender: {
          select: { id: true, firstName: true, photoUrl: true },
        },
        receiver: {
          select: { id: true, firstName: true, photoUrl: true },
        },
      },
    });

    return letters.map((l) => ({
      ...l,
      scheduledAt: l.scheduledAt?.toISOString() ?? null,
      sentAt: l.sentAt?.toISOString() ?? null,
      readAt: l.readAt?.toISOString() ?? null,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async getById(userId: string, letterId: string) {
    const ctx = await this.ensureCouple(userId);

    const letter = await prisma.letter.findUnique({
      where: { id: letterId },
      select: {
        id: true,
        coupleId: true,
        title: true,
        body: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
        readAt: true,
        createdAt: true,
        updatedAt: true,
        senderId: true,
        receiverId: true,
        sender: {
          select: { id: true, firstName: true, photoUrl: true },
        },
        receiver: {
          select: { id: true, firstName: true, photoUrl: true },
        },
      },
    });

    if (!letter) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Letter not found", 404);
    }

    assertCoupleOwnership(letter.coupleId, ctx);

    if (letter.senderId !== userId && letter.receiverId !== userId) {
      throw new ApiError("FORBIDDEN", "You cannot access this letter", 403);
    }

    return {
      ...letter,
      scheduledAt: letter.scheduledAt?.toISOString() ?? null,
      sentAt: letter.sentAt?.toISOString() ?? null,
      readAt: letter.readAt?.toISOString() ?? null,
      createdAt: letter.createdAt.toISOString(),
      updatedAt: letter.updatedAt.toISOString(),
    };
  }

  async create(userId: string, input: CreateLetterInput) {
    const ctx = await this.ensureCouple(userId);
    const receiverId = await this.resolveReceiverId(ctx.coupleId, userId);

    const isSendNow = input.sendNow && !input.scheduledAt;

    const letter = await prisma.letter.create({
      data: {
        coupleId: ctx.coupleId,
        senderId: userId,
        receiverId,
        title: input.title ?? null,
        body: input.body,
        scheduledAt: input.scheduledAt ?? null,
        status: isSendNow ? "SENT" : "DRAFT",
        sentAt: isSendNow ? new Date() : null,
      },
      select: { id: true },
    });

    if (isSendNow) {
      await prisma.activityEvent.create({
        data: {
          coupleId: ctx.coupleId,
          actorId: userId,
          type: "LETTER_SENT",
          entityId: letter.id,
        },
      });
    }

    return this.getById(userId, letter.id);
  }

  async update(userId: string, letterId: string, input: UpdateLetterInput) {
    const ctx = await this.ensureCouple(userId);

    const existing = await prisma.letter.findUnique({
      where: { id: letterId },
      select: {
        id: true,
        coupleId: true,
        senderId: true,
        status: true,
      },
    });

    if (!existing) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Letter not found", 404);
    }

    assertCoupleOwnership(existing.coupleId, ctx);

    if (existing.senderId !== userId) {
      throw new ApiError("FORBIDDEN", "You can only edit your own letters", 403);
    }

    if (existing.status === "READ" || existing.status === "ARCHIVED") {
      throw new ApiError(
        "FORBIDDEN",
        "This letter can no longer be edited",
        403,
      );
    }

    await prisma.letter.update({
      where: { id: letterId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.body !== undefined ? { body: input.body } : {}),
        ...(input.scheduledAt !== undefined
          ? { scheduledAt: input.scheduledAt }
          : {}),
      },
    });

    return this.getById(userId, letterId);
  }

  async markRead(userId: string, letterId: string) {
    const ctx = await this.ensureCouple(userId);

    const existing = await prisma.letter.findUnique({
      where: { id: letterId },
      select: {
        id: true,
        coupleId: true,
        receiverId: true,
        status: true,
      },
    });

    if (!existing) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Letter not found", 404);
    }

    assertCoupleOwnership(existing.coupleId, ctx);

    if (existing.receiverId !== userId) {
      throw new ApiError("FORBIDDEN", "Only the receiver can mark as read", 403);
    }

    if (existing.status !== "SENT") {
      return this.getById(userId, letterId);
    }

    await prisma.letter.update({
      where: { id: letterId },
      data: { status: "READ", readAt: new Date() },
    });

    return this.getById(userId, letterId);
  }

  async remove(userId: string, letterId: string) {
    const ctx = await this.ensureCouple(userId);

    const existing = await prisma.letter.findUnique({
      where: { id: letterId },
      select: {
        id: true,
        coupleId: true,
        senderId: true,
        status: true,
      },
    });

    if (!existing) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Letter not found", 404);
    }

    assertCoupleOwnership(existing.coupleId, ctx);

    if (existing.senderId !== userId) {
      throw new ApiError(
        "FORBIDDEN",
        "You can only delete your own letters",
        403,
      );
    }

    await prisma.letter.update({
      where: { id: letterId },
      data: { status: "ARCHIVED" },
    });

    return { archived: true };
  }
}

export const lettersService = new LettersService();