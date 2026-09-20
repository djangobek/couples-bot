import type { FastifyInstance } from "fastify";
import {
  createDateSchema,
  updateDateSchema,
  dateIdSchema,
} from "@couples/shared";
import { ApiError } from "../common/errors/api-error.js";
import { success } from "../common/response.js";
import { requireCouple } from "../auth/auth.middleware.js";
import { datesService } from "./dates.service.js";

function requireAuth(request: { auth?: { id: string } }) {
  if (!request.auth) {
    throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
  }
  return request.auth;
}

export async function registerDateRoutes(app: FastifyInstance) {
  /* ---------- GET /v1/dates ---------- */
  app.get("/v1/dates", async (request) => {
    const auth = requireAuth(request);
    const query = request.query as { upcoming?: string };
    const upcoming = query.upcoming === "true";
    const data = await datesService.list(auth.id, { upcoming });
    return success(data);
  });

  /* ---------- GET /v1/dates/:id ---------- */
  app.get("/v1/dates/:id", async (request) => {
    const auth = requireAuth(request);
    const params = dateIdSchema.parse(request.params);
    const data = await datesService.getById(auth.id, params.id);
    return success(data);
  });

  /* ---------- POST /v1/dates ---------- */
  app.post(
    "/v1/dates",
    { preHandler: requireCouple },
    async (request) => {
      const auth = requireAuth(request);
      const input = createDateSchema.parse(request.body);
      const data = await datesService.create(auth.id, input);
      return success(data);
    },
  );

  /* ---------- PATCH /v1/dates/:id ---------- */
  app.patch("/v1/dates/:id", async (request) => {
    const auth = requireAuth(request);
    const params = dateIdSchema.parse(request.params);
    const input = updateDateSchema.parse(request.body);
    const data = await datesService.update(auth.id, params.id, input);
    return success(data);
  });

  /* ---------- DELETE /v1/dates/:id ---------- */
  app.delete("/v1/dates/:id", async (request) => {
    const auth = requireAuth(request);
    const params = dateIdSchema.parse(request.params);
    const data = await datesService.remove(auth.id, params.id);
    return success(data);
  });
}