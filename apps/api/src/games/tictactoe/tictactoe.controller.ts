import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ApiError } from "../../common/errors/api-error.js";
import { success } from "../../common/response.js";
import { requireCouple } from "../../auth/auth.middleware.js";
import { tttRoomManager } from "./tictactoe.room.js";
import { gameTokenStore } from "../game.tokens.js";
import { tttHistoryService } from "./tictactoe.history.js";
import { coupleContextService } from "../../couples/couple-context.service.js";
import { prisma } from "../../database/prisma.service.js";
import { VALID_SIZES } from "./tictactoe.logic.js";

const createSchema = z.object({
  size: z.union([
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
  ]),
});

const tokenSchema = z.object({
  roomCode: z.string().regex(/^[A-Z0-9]{6}$/),
});

function requireAuth(request: { auth?: { id: string } }) {
  if (!request.auth) {
    throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
  }
  return request.auth;
}

export function registerTttRoutes(app: FastifyInstance) {
  /* ============================================================
     ORDER MATTERS!
     Specific routes MUST be registered BEFORE wildcard /:code
     ============================================================ */

  /* ---------- 1. VALID SIZES ---------- */
  app.get("/v1/games/tictactoe/sizes", async () => {
    return success({
      sizes: VALID_SIZES,
      winLengths: {
        3: 3,
        4: 4,
        5: 4,
        6: 4,
        7: 5,
      },
    });
  });

  /* ---------- 2. CREATE ROOM ---------- */
  app.post(
    "/v1/games/tictactoe/create",
    { preHandler: requireCouple },
    async (request) => {
      const auth = requireAuth(request);
      const body = createSchema.parse(request.body);
      const ctx = await coupleContextService.getActiveCoupleForUser(auth.id);

      const room = await tttRoomManager.createRoom({
        userId: auth.id,
        coupleId: ctx.coupleId,
        size: body.size,
      });

      return success({
        code: room.code,
        size: room.size,
        winLength: room.winLength,
      });
    },
  );

  /* ---------- 3. MY ACTIVE ROOM ---------- */
  app.get("/v1/games/tictactoe/my", async (request) => {
    const auth = requireAuth(request);
    const room = tttRoomManager.getRoomByUser(auth.id);
    if (!room) {
      return success(null);
    }
    return success({
      code: room.code,
      status: room.status,
      size: room.size,
      winLength: room.winLength,
    });
  });

  /* ---------- 4. HISTORY ---------- */
  app.get("/v1/games/tictactoe/history", async (request) => {
    const auth = requireAuth(request);
    const query = request.query as { limit?: string };
    const limit = query.limit ? parseInt(query.limit, 10) : 20;

    const data = await tttHistoryService.list(auth.id, {
      limit: isNaN(limit) ? 20 : limit,
    });

    return success(data);
  });

  /* ---------- 5. WS TOKEN ---------- */
  app.post(
    "/v1/games/tictactoe/ws-token",
    { preHandler: requireCouple },
    async (request) => {
      const auth = requireAuth(request);
      const body = tokenSchema.parse(request.body);
      const code = body.roomCode.toUpperCase();

      const room = tttRoomManager.getRoom(code);
      if (!room) {
        throw new ApiError("GAME_NOT_FOUND", "Game not found", 404);
      }

      const isMember = room.players.some((p) => p?.userId === auth.id);
      if (!isMember && room.status !== "WAITING") {
        throw new ApiError("FORBIDDEN", "You are not in this game", 403);
      }

      if (!isMember && room.status === "WAITING") {
        const user = await prisma.user.findUnique({
          where: { id: auth.id },
          select: { firstName: true, photoUrl: true },
        });
        await tttRoomManager.joinRoom({
          code,
          userId: auth.id,
          firstName: user?.firstName ?? null,
          photoUrl: user?.photoUrl ?? null,
        });
      }

      const { token, expiresAt } = gameTokenStore.issue(
        auth.id,
        code,
        "TIC_TAC_TOE",
      );

      return success({ token, expiresAt, code });
    },
  );

  /* ---------- 6. JOIN ROOM ---------- */
  app.post(
    "/v1/games/tictactoe/:code/join",
    { preHandler: requireCouple },
    async (request) => {
      const auth = requireAuth(request);
      const params = request.params as { code: string };
      const code = params.code.toUpperCase();

      const user = await prisma.user.findUnique({
        where: { id: auth.id },
        select: { firstName: true, photoUrl: true },
      });

      const room = await tttRoomManager.joinRoom({
        code,
        userId: auth.id,
        firstName: user?.firstName ?? null,
        photoUrl: user?.photoUrl ?? null,
      });

      return success({
        code: room.code,
        status: room.status,
        size: room.size,
        winLength: room.winLength,
      });
    },
  );

  /* ---------- 7. GET ROOM INFO — MUST BE LAST ---------- */
  app.get("/v1/games/tictactoe/:code", async (request) => {
    const auth = requireAuth(request);
    const params = request.params as { code: string };
    const code = params.code.toUpperCase();

    const room = tttRoomManager.getRoom(code);
    if (!room) {
      throw new ApiError("GAME_NOT_FOUND", "Game not found", 404);
    }

    const isMember = room.players.some((p) => p?.userId === auth.id);
    if (!isMember && room.status !== "WAITING") {
      throw new ApiError("FORBIDDEN", "You are not in this game", 403);
    }

    return success({
      code: room.code,
      status: room.status,
      size: room.size,
      winLength: room.winLength,
      playerCount: room.players.filter((p) => p !== null).length,
      isMember,
    });
  });
}