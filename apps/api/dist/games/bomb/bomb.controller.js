import { z } from "zod";
import { ApiError } from "../../common/errors/api-error.js";
import { success } from "../../common/response.js";
import { requireCouple } from "../../auth/auth.middleware.js";
import { bombRoomManager } from "./bomb.room.js";
import { gameTokenStore } from "../game.tokens.js";
import { bombHistoryService } from "./bomb.history.js";
import { coupleContextService } from "../../couples/couple-context.service.js";
import { prisma } from "../../database/prisma.service.js";
const createSchema = z.object({
    size: z.number().int().min(5).max(10),
    reward: z.string().min(1).max(200),
});
const tokenSchema = z.object({
    roomCode: z.string().regex(/^[A-Z0-9]{6}$/),
});
function requireAuth(request) {
    if (!request.auth) {
        throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
    }
    return request.auth;
}
export function registerBombRoutes(app) {
    /* ============ CREATE ROOM ============ */
    app.post("/v1/games/bomb/create", { preHandler: requireCouple }, async (request) => {
        const auth = requireAuth(request);
        const body = createSchema.parse(request.body);
        const ctx = await coupleContextService.getActiveCoupleForUser(auth.id);
        const room = await bombRoomManager.createRoom({
            userId: auth.id,
            coupleId: ctx.coupleId,
            size: body.size,
            reward: body.reward,
        });
        return success({
            code: room.code,
            size: room.size,
            bombCount: room.bombCount,
            reward: room.reward,
        });
    });
    /* ============ GET ROOM INFO ============ */
    app.get("/v1/games/bomb/:code", async (request) => {
        const auth = requireAuth(request);
        const params = request.params;
        const code = params.code.toUpperCase();
        const room = bombRoomManager.getRoom(code);
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
            bombCount: room.bombCount,
            reward: room.reward,
            playerCount: room.players.filter((p) => p !== null).length,
            isMember,
        });
    });
    /* ============ JOIN ROOM ============ */
    app.post("/v1/games/bomb/:code/join", { preHandler: requireCouple }, async (request) => {
        const auth = requireAuth(request);
        const params = request.params;
        const code = params.code.toUpperCase();
        const user = await prisma.user.findUnique({
            where: { id: auth.id },
            select: { firstName: true, photoUrl: true },
        });
        const room = await bombRoomManager.joinRoom({
            code,
            userId: auth.id,
            firstName: user?.firstName ?? null,
            photoUrl: user?.photoUrl ?? null,
        });
        return success({
            code: room.code,
            status: room.status,
            size: room.size,
            bombCount: room.bombCount,
            reward: room.reward,
        });
    });
    /* ============ MY ACTIVE ROOM ============ */
    app.get("/v1/games/bomb/my", async (request) => {
        const auth = requireAuth(request);
        const room = bombRoomManager.getRoomByUser(auth.id);
        if (!room) {
            return success(null);
        }
        return success({
            code: room.code,
            status: room.status,
            size: room.size,
            bombCount: room.bombCount,
            reward: room.reward,
        });
    });
    /* ============ WS TOKEN ============ */
    app.post("/v1/games/bomb/ws-token", { preHandler: requireCouple }, async (request) => {
        const auth = requireAuth(request);
        const body = tokenSchema.parse(request.body);
        const code = body.roomCode.toUpperCase();
        const room = bombRoomManager.getRoom(code);
        if (!room) {
            throw new ApiError("GAME_NOT_FOUND", "Game not found", 404);
        }
        const isMember = room.players.some((p) => p?.userId === auth.id);
        if (!isMember && room.status !== "WAITING" && room.status !== "PAUSED") {
            throw new ApiError("FORBIDDEN", "You are not in this game", 403);
        }
        if (!isMember && room.status === "WAITING") {
            const user = await prisma.user.findUnique({
                where: { id: auth.id },
                select: { firstName: true, photoUrl: true },
            });
            await bombRoomManager.joinRoom({
                code,
                userId: auth.id,
                firstName: user?.firstName ?? null,
                photoUrl: user?.photoUrl ?? null,
            });
        }
        /* ============ Use shared gameTokenStore with gameType ============ */
        const { token, expiresAt } = gameTokenStore.issue(auth.id, code, "BOMB");
        return success({
            token,
            expiresAt,
            code,
        });
    });
    /* ============ HISTORY ============ */
    app.get("/v1/games/bomb/history", async (request) => {
        const auth = requireAuth(request);
        const query = request.query;
        const limit = query.limit ? parseInt(query.limit, 10) : 20;
        const data = await bombHistoryService.list(auth.id, {
            limit: isNaN(limit) ? 20 : limit,
        });
        return success(data);
    });
}
