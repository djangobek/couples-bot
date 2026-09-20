import crypto from "node:crypto";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { ZodError } from "zod";
import { env } from "@couples/config";
import { prisma } from "./database/prisma.service.js";
import { ApiError, isApiError } from "./common/errors/api-error.js";
import { failure, success } from "./common/response.js";
import { registerRateLimit } from "./common/rate-limit.js";
import { registerSecurity } from "./common/security.js";
import { registerAuthHooks } from "./auth/auth.middleware.js";
import { registerHealthRoutes } from "./health/health.controller.js";
import { telegramInitDataSchema, inviteCodeSchema, } from "@couples/shared";
import { coupleService } from "./couples/couple.service.js";
import { registerHomeRoutes } from "./home/home.controller.js";
import { registerMemoryRoutes } from "./memories/memories.controller.js";
import { registerLetterRoutes } from "./letters/letters.controller.js";
import { registerDateRoutes } from "./dates/dates.controller.js";
import { registerReadingRoutes } from "./reading/reading.controller.js";
import { registerChallengeRoutes } from "./challenges/challenges.controller.js";
import { registerActivityRoutes } from "./activity/activity.controller.js";
/* Games */
import { registerBombRoutes } from "./games/bomb/bomb.controller.js";
import { registerBombWebSocket } from "./games/bomb/bomb.websocket.js";
import { registerTttRoutes } from "./games/tictactoe/tictactoe.controller.js";
import { registerTttWebSocket } from "./games/tictactoe/tictactoe.websocket.js";
/* Admin */
import { registerAdminDashboardRoutes } from "./admin/dashboard.controller.js";
import { registerAdminUserRoutes } from "./admin/users.controller.js";
import { registerAdminGameRoutes } from "./admin/games.controller.js";
import { registerAdminLogRoutes } from "./admin/logs.controller.js";
import { registerAdminStatsRoutes } from "./admin/stats.controller.js";
import { registerAdminSystemRoutes } from "./admin/system.controller.js";
/* NEW: Subscription + Broadcast */
import { registerSubscriptionRoutes } from "./subscription/subscription.controller.js";
import { registerBroadcastRoutes } from "./broadcast/broadcast.controller.js";
export function buildApp() {
    const app = Fastify({
        logger: {
            level: env.isProduction ? "info" : "debug",
            redact: {
                paths: [
                    "req.headers.authorization",
                    "req.headers.x-telegram-init-data",
                    "headers.authorization",
                    "headers.x-telegram-init-data",
                ],
                censor: "[REDACTED]",
            },
        },
        bodyLimit: 1_048_576,
        requestIdHeader: false,
        genReqId: (request) => {
            const supplied = request.headers["x-request-id"];
            return typeof supplied === "string" &&
                /^[A-Za-z0-9._:-]{1,128}$/.test(supplied)
                ? supplied
                : crypto.randomUUID();
        },
    });
    const requestStartTimes = new WeakMap();
    app.addHook("onRequest", async (request, reply) => {
        requestStartTimes.set(request, process.hrtime.bigint());
        reply.header("X-Request-ID", request.id);
    });
    registerRateLimit(app);
    registerSecurity(app);
    app.register(cors, {
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            const allowed = new Set([new URL(env.WEB_APP_URL).origin]);
            if (!env.isProduction) {
                allowed.add("http://localhost:5173");
                allowed.add("http://127.0.0.1:5173");
                allowed.add("http://localhost:5174");
                allowed.add("http://127.0.0.1:5174");
                if (origin.includes(".trycloudflare.com")) {
                    return callback(null, true);
                }
                if (origin.includes(".ngrok-free.app") ||
                    origin.includes(".ngrok.io") ||
                    origin.includes(".loca.lt")) {
                    return callback(null, true);
                }
            }
            callback(null, allowed.has(origin));
        },
        credentials: false,
    });
    app.register(websocket);
    app.setErrorHandler((error, request, reply) => {
        if (isApiError(error)) {
            return reply
                .code(error.statusCode)
                .send(failure(error.code, error.message, request.id));
        }
        if (error instanceof ZodError) {
            return reply.code(400).send(failure("VALIDATION_ERROR", error.issues
                .map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`)
                .join("; "), request.id));
        }
        const errorObject = typeof error === "object" && error !== null ? error : null;
        const statusCode = errorObject &&
            "statusCode" in errorObject &&
            typeof errorObject.statusCode === "number"
            ? errorObject.statusCode
            : undefined;
        const message = errorObject &&
            "message" in errorObject &&
            typeof errorObject.message === "string"
            ? errorObject.message
            : "Request failed";
        if (typeof statusCode === "number" &&
            statusCode >= 400 &&
            statusCode < 500) {
            return reply
                .code(statusCode)
                .send(failure("VALIDATION_ERROR", message, request.id));
        }
        request.log.error({ err: error, requestId: request.id }, "Unhandled request error");
        return reply.code(500).send(failure("INTERNAL_SERVER_ERROR", "An unexpected error occurred", request.id));
    });
    app.addHook("onResponse", async (request, reply) => {
        const startedAt = requestStartTimes.get(request);
        const durationMs = startedAt
            ? Number(process.hrtime.bigint() - startedAt) / 1_000_000
            : undefined;
        app.log.info({
            requestId: request.id,
            method: request.method,
            path: request.routeOptions.url,
            statusCode: reply.statusCode,
            ...(durationMs !== undefined
                ? { durationMs: Number(durationMs.toFixed(2)) }
                : {}),
            ...(request.auth ? { userId: request.auth.id } : {}),
        }, "request completed");
    });
    app.addHook("onClose", async () => {
        await prisma.$disconnect();
    });
    registerHealthRoutes(app);
    registerAuthHooks(app);
    /* ============================================================
       AUTH
       ============================================================ */
    app.post("/v1/auth/telegram", async (request) => {
        if (!request.auth) {
            throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
        }
        telegramInitDataSchema.parse({
            initData: request.headers["x-telegram-init-data"],
        });
        return success({
            user: {
                id: request.auth.id,
                telegramId: request.auth.telegramId.toString(),
            },
        });
    });
    app.get("/v1/auth/me", async (request) => {
        if (!request.auth) {
            throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
        }
        const user = await prisma.user.findUnique({
            where: { id: request.auth.id },
            select: {
                id: true,
                telegramId: true,
                firstName: true,
                lastName: true,
                username: true,
                photoUrl: true,
                language: true,
            },
        });
        if (!user) {
            throw new ApiError("UNAUTHORIZED", "User not found", 401);
        }
        return success({
            ...user,
            telegramId: user.telegramId.toString(),
        });
    });
    /* ============================================================
       COUPLE
       ============================================================ */
    app.get("/v1/couple", async (request) => {
        if (!request.auth) {
            throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
        }
        return success(await coupleService.getCurrentCouple(request.auth.id));
    });
    app.post("/v1/couple", async (request) => {
        if (!request.auth) {
            throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
        }
        return success(await coupleService.createCouple(request.auth.id));
    });
    app.get("/v1/couple/members", async (request) => {
        if (!request.auth) {
            throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
        }
        return success(await coupleService.getMembers(request.auth.id));
    });
    app.post("/v1/couple/leave", async (request) => {
        if (!request.auth) {
            throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
        }
        return success(await coupleService.leaveCouple(request.auth.id));
    });
    app.post("/v1/couple/invite", async (request) => {
        if (!request.auth) {
            throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
        }
        return success(await coupleService.createInvite(request.auth.id));
    });
    app.get("/v1/couple/invite/:code", async (request) => {
        if (!request.auth) {
            throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
        }
        const params = request.params;
        const parsed = inviteCodeSchema.parse({ code: params.code ?? "" });
        return success(await coupleService.resolveInvite(parsed.code));
    });
    app.post("/v1/couple/invite/:code/accept", async (request) => {
        if (!request.auth) {
            throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
        }
        const params = request.params;
        const parsed = inviteCodeSchema.parse({ code: params.code ?? "" });
        return success(await coupleService.acceptInvite(request.auth.id, parsed.code));
    });
    app.get("/v1/me", async (request) => {
        if (!request.auth) {
            throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
        }
        const user = await prisma.user.findUnique({
            where: { id: request.auth.id },
            select: {
                id: true,
                telegramId: true,
                firstName: true,
                lastName: true,
                username: true,
                photoUrl: true,
                language: true,
            },
        });
        if (!user) {
            throw new ApiError("UNAUTHORIZED", "User not found", 401);
        }
        return success({
            ...user,
            telegramId: user.telegramId.toString(),
        });
    });
    /* ============================================================
       FEATURE ROUTES
       ============================================================ */
    registerHomeRoutes(app);
    registerActivityRoutes(app);
    registerMemoryRoutes(app);
    registerLetterRoutes(app);
    registerDateRoutes(app);
    registerReadingRoutes(app);
    registerChallengeRoutes(app);
    /* Games */
    registerBombRoutes(app);
    registerTttRoutes(app);
    /* Admin */
    registerAdminDashboardRoutes(app);
    registerAdminUserRoutes(app);
    registerAdminGameRoutes(app);
    registerAdminLogRoutes(app);
    registerAdminStatsRoutes(app);
    registerAdminSystemRoutes(app);
    /* NEW: Subscription + Broadcast */
    registerSubscriptionRoutes(app);
    registerBroadcastRoutes(app);
    /* ============================================================
       WEBSOCKET ROUTES
       ============================================================ */
    app.after(() => {
        registerBombWebSocket(app);
        registerTttWebSocket(app);
    });
    return app;
}
