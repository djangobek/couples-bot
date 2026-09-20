import type { FastifyInstance } from "fastify";
import { paginationSchema } from "@couples/shared";
import { ApiError } from "../common/errors/api-error.js";
import { success } from "../common/response.js";
import { activityService } from "./activity.service.js";

export async function registerActivityRoutes(app: FastifyInstance) {
  app.get("/v1/activity", async (request) => {
    if (!request.auth) {
      throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
    }
    const query = paginationSchema.parse(request.query ?? {});
    const data = await activityService.list(request.auth.id, {
      cursor: query.cursor,
      limit: query.limit,
    });
    return success(data);
  });
}