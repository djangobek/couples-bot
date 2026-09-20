import { prisma } from "../database/prisma.service.js";
import { ApiError } from "../common/errors/api-error.js";
import { coupleContextService } from "../couples/couple-context.service.js";
import { assertCoupleOwnership } from "../couples/couple-isolation.js";
import type {
  CreateMemoryInput,
  UpdateMemoryInput,
} from "@couples/shared";

export class MemoriesService {
  private async ensureCouple(userId: string) {
    const ctx = await coupleContextService.getActiveCoupleForUser(userId);
    return ctx;
  }

  async list(
    userId: string,
    options: { cursor?: string; limit: number },
  ) {
    const ctx = await this.ensureCouple(userId);

    const items = await prisma.memory.findMany({
      where: {
        coupleId: ctx.coupleId,
        deletedAt: null,
        OR: [
          { visibility: "COUPLE" },
          { visibility: "PRIVATE", privateOwnerId: userId },
        ],
      },
      orderBy: [{ eventAt: "desc" }, { createdAt: "desc" }],
      take: options.limit + 1,
      ...(options.cursor
        ? { cursor: { id: options.cursor }, skip: 1 }
        : {}),
      select: {
        id: true,
        type: true,
        visibility: true,
        title: true,
        caption: true,
        eventAt: true,
        locationName: true,
        createdAt: true,
        privateOwnerId: true,
        author: {
          select: { id: true, firstName: true, photoUrl: true },
        },
        media: {
          where: { deletedAt: null },
          select: {
            id: true,
            storage: true,
            externalUrl: true,
            telegramFile: {
              select: {
                id: true,
                fileType: true,
                mimeType: true,
                fileName: true,
                width: true,
                height: true,
              },
            },
          },
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            media: { where: { deletedAt: null } },
            reactions: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (items.length > options.limit) {
      const next = items.pop();
      nextCursor = next?.id ?? null;
    }

    return {
      items: items.map((m) => ({
        ...m,
        eventAt: m.eventAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
        reactions: m.reactions.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      })),
      nextCursor,
    };
  }

  async getById(userId: string, memoryId: string) {
    const ctx = await this.ensureCouple(userId);

    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: {
        id: true,
        coupleId: true,
        type: true,
        visibility: true,
        title: true,
        caption: true,
        eventAt: true,
        locationName: true,
        privateOwnerId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, firstName: true, photoUrl: true },
        },
        media: {
          where: { deletedAt: null },
          select: {
            id: true,
            storage: true,
            externalUrl: true,
            telegramFile: {
              select: {
                id: true,
                fileType: true,
                mimeType: true,
                fileName: true,
                width: true,
                height: true,
              },
            },
          },
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!memory || !memory.coupleId) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Memory not found", 404);
    }

    assertCoupleOwnership(memory.coupleId, ctx);

    /* Private memory: only owner can view */
    if (
      memory.visibility === "PRIVATE" &&
      memory.privateOwnerId !== userId
    ) {
      throw new ApiError("FORBIDDEN", "You cannot access this memory", 403);
    }

    return {
      ...memory,
      eventAt: memory.eventAt?.toISOString() ?? null,
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
      reactions: memory.reactions.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async create(userId: string, input: CreateMemoryInput) {
    const ctx = await this.ensureCouple(userId);

    const memory = await prisma.memory.create({
      data: {
        coupleId: ctx.coupleId,
        authorId: userId,
        privateOwnerId: input.visibility === "PRIVATE" ? userId : null,
        type: input.type,
        visibility: input.visibility,
        title: input.title ?? null,
        caption: input.caption ?? null,
        eventAt: input.eventAt ?? null,
        locationName: input.locationName ?? null,
      },
      select: { id: true },
    });

    await prisma.activityEvent.create({
      data: {
        coupleId: ctx.coupleId,
        actorId: userId,
        type: "MEMORY_ADDED",
        entityId: memory.id,
      },
    });

    return this.getById(userId, memory.id);
  }

  async update(userId: string, memoryId: string, input: UpdateMemoryInput) {
    const ctx = await this.ensureCouple(userId);

    const existing = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: {
        id: true,
        coupleId: true,
        authorId: true,
        visibility: true,
        privateOwnerId: true,
      },
    });

    if (!existing) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Memory not found", 404);
    }

    assertCoupleOwnership(existing.coupleId, ctx);

    if (existing.authorId !== userId) {
      throw new ApiError("FORBIDDEN", "You can only edit your own memories", 403);
    }

    await prisma.memory.update({
      where: { id: memoryId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.caption !== undefined ? { caption: input.caption } : {}),
        ...(input.eventAt !== undefined ? { eventAt: input.eventAt } : {}),
        ...(input.locationName !== undefined
          ? { locationName: input.locationName }
          : {}),
        ...(input.visibility !== undefined
          ? {
              visibility: input.visibility,
              privateOwnerId:
                input.visibility === "PRIVATE" ? userId : null,
            }
          : {}),
      },
    });

    return this.getById(userId, memoryId);
  }

  async remove(userId: string, memoryId: string) {
    const ctx = await this.ensureCouple(userId);

    const existing = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: {
        id: true,
        coupleId: true,
        authorId: true,
      },
    });

    if (!existing) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Memory not found", 404);
    }

    assertCoupleOwnership(existing.coupleId, ctx);

    if (existing.authorId !== userId) {
      throw new ApiError("FORBIDDEN", "You can only delete your own memories", 403);
    }

    await prisma.memory.update({
      where: { id: memoryId },
      data: { deletedAt: new Date() },
    });

    return { deleted: true };
  }

  /* ---------- Reactions ---------- */

  async addReaction(userId: string, memoryId: string, emoji: string) {
    const ctx = await this.ensureCouple(userId);

    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: {
        id: true,
        coupleId: true,
        visibility: true,
        privateOwnerId: true,
      },
    });

    if (!memory) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Memory not found", 404);
    }

    assertCoupleOwnership(memory.coupleId, ctx);

    if (
      memory.visibility === "PRIVATE" &&
      memory.privateOwnerId !== userId
    ) {
      throw new ApiError("FORBIDDEN", "You cannot react to this memory", 403);
    }

    await prisma.memoryReaction.upsert({
      where: {
        memoryId_userId_emoji: { memoryId, userId, emoji },
      },
      update: {},
      create: { memoryId, userId, emoji },
    });

    return { reacted: true };
  }

  async removeReaction(userId: string, memoryId: string, emoji: string) {
    const ctx = await this.ensureCouple(userId);

    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: { id: true, coupleId: true },
    });

    if (!memory) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Memory not found", 404);
    }

    assertCoupleOwnership(memory.coupleId, ctx);

    await prisma.memoryReaction.deleteMany({
      where: { memoryId, userId, emoji },
    });

    return { reacted: false };
  }
}

export const memoriesService = new MemoriesService();