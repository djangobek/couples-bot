/* ============================================================
   BROADCAST — Controller (admin-only)
   ============================================================ */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ApiError } from "../common/errors/api-error.js";
import { success } from "../common/response.js";
import { requireAdmin } from "../admin/admin.middleware.js";
import { broadcastService } from "./broadcast.service.js";

const sendSchema = z.object({
  message: z.string().min(1).max(4096),
  parseMode: z.enum(["HTML", "MarkdownV2", ""]).optional(),
  onlyActive: z.boolean().optional(),
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function registerBroadcastRoutes(app: FastifyInstance) {
  /* POST /v1/admin/broadcast/send */
  app.post("/v1/admin/broadcast/send", async (request) => {
    const admin = requireAdmin(request);
    const input = sendSchema.parse(request.body);

    try {
      const result = await broadcastService.send(admin.id, input);
      return success(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Broadcast failed";
      throw new ApiError("VALIDATION_ERROR", message, 400);
    }
  });

  /* GET /v1/admin/broadcast/history */
  app.get("/v1/admin/broadcast/history", async (request) => {
    requireAdmin(request);
    const query = historyQuerySchema.parse(request.query ?? {});
    const items = await broadcastService.list(query.limit);
    return success(items);
  });

  /* GET /v1/admin/broadcast/:id */
  app.get("/v1/admin/broadcast/:id", async (request) => {
    requireAdmin(request);
    const params = request.params as { id: string };
    const item = await broadcastService.getById(params.id);
    if (!item) {
      throw new ApiError("RESOURCE_NOT_FOUND", "Broadcast not found", 404);
    }
    return success(item);
  });
}