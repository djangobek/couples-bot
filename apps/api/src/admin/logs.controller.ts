/* ============================================================
   ADMIN — Audit Logs Controller
   ============================================================ */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { success } from "../common/response.js";
import { adminService } from "./admin.service.js";
import { requireAdmin } from "./admin.middleware.js";

const listQuerySchema = z.object({
  search: z.string().max(200).optional(),
  action: z.string().max(100).optional(),
  actorId: z.string().uuid().optional(),
  entity: z.string().max(100).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export function registerAdminLogRoutes(app: FastifyInstance) {
  /* GET /v1/admin/logs */
  app.get("/v1/admin/logs", async (request) => {
    requireAdmin(request);
    const query = listQuerySchema.parse(request.query ?? {});

    const data = await adminService.listAuditLogs(
      {
        search: query.search,
        action: query.action,
        actorId: query.actorId,
        entity: query.entity,
        fromDate: query.fromDate,
        toDate: query.toDate,
      },
      {
        cursor: query.cursor,
        limit: query.limit,
      },
    );

    return success(data);
  });

  /* GET /v1/admin/logs/actions — unique action names */
  app.get("/v1/admin/logs/actions", async (request) => {
    requireAdmin(request);
    const actions = await adminService.listAuditActions();
    return success(actions);
  });

  /* GET /v1/admin/logs/entities — unique entity names */
  app.get("/v1/admin/logs/entities", async (request) => {
    requireAdmin(request);
    const entities = await adminService.listAuditEntities();
    return success(entities);
  });
}