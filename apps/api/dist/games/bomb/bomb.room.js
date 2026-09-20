/* ============================================================
   BOMB GAME — Room Manager (senior, fully correct)
   ============================================================ */
import { EventEmitter } from "node:events";
import { prisma } from "../../database/prisma.service.js";
import { ApiError } from "../../common/errors/api-error.js";
import { GAME_TIME_MS, GRACE_BEFORE_PAUSE_MS, PLACEMENT_TIME_MS, RECONNECT_WINDOW_MS, TURN_TIME_MS, bombCountForSize, generateRoomCode, opponentSeat, randomBombs, rcToIndex, validateBombs, validateSize, } from "./bomb.logic.js";
const CLEANUP_INTERVAL_MS = 15_000;
const ROOM_TTL_MS = 30 * 60_000;
const TURN_TIMEOUT_BUFFER_MS = 200;
const PAUSE_GRACE_BUFFER_MS = 200;
class BombRoomManager extends EventEmitter {
    rooms = new Map();
    codeToRoom = new Map();
    userToRoom = new Map();
    cleanupTimer = null;
    reconnectTimers = new Map();
    pauseGraceTimers = new Map();
    turnTimers = new Map();
    constructor() {
        super();
        this.startCleanup();
    }
    /* ============================================================
       CREATE
       ============================================================ */
    async createRoom(params) {
        const { userId, coupleId, size, reward } = params;
        if (!validateSize(size)) {
            throw new ApiError("VALIDATION_ERROR", "Grid size must be between 5 and 10", 400);
        }
        const trimmedReward = reward.trim();
        if (!trimmedReward || trimmedReward.length > 200) {
            throw new ApiError("VALIDATION_ERROR", "Reward must be 1-200 characters", 400);
        }
        const existingCode = this.userToRoom.get(userId);
        if (existingCode) {
            const existingRoom = this.rooms.get(existingCode);
            if (existingRoom && this.isActiveStatus(existingRoom.status)) {
                throw new ApiError("GAME_IN_PROGRESS", "You already have an active game. Finish or leave it first.", 409);
            }
        }
        const bombCount = bombCountForSize(size);
        const code = this.generateUniqueCode();
        const session = await prisma.gameSession.create({
            data: {
                code,
                coupleId,
                creatorId: userId,
                type: "BOMB",
                status: "WAITING",
                size,
                bombCount,
                reward: trimmedReward,
            },
            select: { id: true },
        });
        const room = {
            code,
            sessionId: session.id,
            coupleId,
            size,
            bombCount,
            reward: trimmedReward,
            status: "WAITING",
            players: [null, null],
            turn: null,
            turnDeadline: null,
            startedAt: null,
            finishedAt: null,
            placementDeadline: null,
            gameDeadline: null,
            winnerId: null,
            createdAt: Date.now(),
            pausedAt: null,
            pausedByUserId: null,
            pausedFromStatus: null,
            reconnectDeadline: null,
            lastActivityAt: Date.now(),
        };
        this.rooms.set(code, room);
        this.codeToRoom.set(code, session.id);
        return room;
    }
    /* ============================================================
       HELPERS
       ============================================================ */
    isActiveStatus(status) {
        return (status === "WAITING" ||
            status === "PLACING" ||
            status === "PLAYING" ||
            status === "PAUSED");
    }
    isFinishedStatus(status) {
        return (status === "FINISHED" ||
            status === "ABANDONED" ||
            status === "EXPIRED");
    }
    touch(room) {
        room.lastActivityAt = Date.now();
    }
    clearReconnectTimer(code) {
        const t = this.reconnectTimers.get(code);
        if (t) {
            clearTimeout(t);
            this.reconnectTimers.delete(code);
        }
    }
    clearPauseGraceTimer(code) {
        const t = this.pauseGraceTimers.get(code);
        if (t) {
            clearTimeout(t);
            this.pauseGraceTimers.delete(code);
        }
    }
    clearTurnTimer(code) {
        const t = this.turnTimers.get(code);
        if (t) {
            clearTimeout(t);
            this.turnTimers.delete(code);
        }
    }
    clearAllTimers(code) {
        this.clearReconnectTimer(code);
        this.clearPauseGraceTimer(code);
        this.clearTurnTimer(code);
    }
    /* ============================================================
       GETTERS
       ============================================================ */
    getRoom(code) {
        return this.rooms.get(code);
    }
    getRoomByUser(userId) {
        const code = this.userToRoom.get(userId);
        return code ? this.rooms.get(code) : undefined;
    }
    /* ============================================================
     JOIN — idempotent, StrictMode-safe
     ============================================================ */
    async joinRoom(params) {
        const { code, userId, firstName, photoUrl } = params;
        const room = this.rooms.get(code);
        if (!room) {
            throw new ApiError("GAME_NOT_FOUND", "Game not found or expired", 404);
        }
        this.touch(room);
        /* ============================================================
          1. Agar foydalanuvchi allaqachon xonada bo'lsa — faqat
          connection statusini yangilaymiz, DB ga YOZMAYMIZ
          ============================================================ */
        const existingSeat = room.players.findIndex((p) => p?.userId === userId);
        if (existingSeat >= 0) {
            const player = room.players[existingSeat];
            const wasDisconnected = !player.connected;
            player.connected = true;
            player.disconnectedAt = null;
            player.firstName = firstName ?? player.firstName;
            player.photoUrl = photoUrl ?? player.photoUrl;
            if (wasDisconnected && room.status === "PAUSED") {
                this.clearPauseGraceTimer(room.code);
                await this.resumeGame(room);
            }
            else {
                this.emit("state-changed", room.code);
            }
            return room;
        }
        /* ============================================================
          2. Yangi o'yinchi
          ============================================================ */
        const emptySeatIdx = room.players.findIndex((p) => p === null);
        if (emptySeatIdx < 0) {
            throw new ApiError("GAME_FULL", "This game is already full", 409);
        }
        if (room.status !== "WAITING" && room.status !== "PAUSED") {
            throw new ApiError("GAME_ALREADY_STARTED", "This game has already started", 409);
        }
        const emptySeat = emptySeatIdx;
        const player = {
            userId,
            seat: emptySeat,
            firstName,
            photoUrl,
            bombs: new Set(),
            revealed: new Set(),
            hits: 0,
            ready: false,
            connected: true,
            disconnectedAt: null,
        };
        /* ============================================================
          3. DB ga YOZISH — upsert bilan (idempotent)
          ============================================================ */
        try {
            await prisma.gamePlayer.upsert({
                where: {
                    sessionId_userId: {
                        sessionId: room.sessionId,
                        userId,
                    },
                },
                update: {
                /* Allaqachon mavjud bo'lsa — hech narsa qilmaymiz */
                },
                create: {
                    sessionId: room.sessionId,
                    userId,
                    seat: emptySeat,
                },
            });
        }
        catch (err) {
            console.error("[bomb.room] gamePlayer.upsert failed:", err);
        }
        /* ============================================================
          4. In-memory state
          ============================================================ */
        room.players[emptySeat] = player;
        this.userToRoom.set(userId, code);
        /* ============================================================
          5. Ikkala o'yinchi ham bor bo'lsa
          ============================================================ */
        if (room.players[0] && room.players[1]) {
            const opponent = room.players.find((p) => p?.userId !== userId);
            this.emit("opponent-joined", room.code, {
                firstName: opponent?.firstName ?? null,
                photoUrl: opponent?.photoUrl ?? null,
            });
            if (room.status === "PAUSED") {
                await this.resumeGame(room);
            }
            else if (room.status === "WAITING") {
                await this.startPlacement(room);
            }
        }
        this.emit("state-changed", room.code);
        return room;
    }
    /* ============================================================
       START PLACEMENT
       ============================================================ */
    async startPlacement(room) {
        room.status = "PLACING";
        room.placementDeadline = Date.now() + PLACEMENT_TIME_MS;
        this.touch(room);
        await prisma.gameSession.update({
            where: { id: room.sessionId },
            data: { status: "PLACING" },
        });
        setTimeout(() => {
            void this.autoFillPlacement(room.code);
        }, PLACEMENT_TIME_MS + 200);
        this.emit("state-changed", room.code);
    }
    async autoFillPlacement(code) {
        const room = this.rooms.get(code);
        if (!room || room.status !== "PLACING")
            return;
        for (const player of room.players) {
            if (!player || player.ready)
                continue;
            player.bombs = randomBombs(room.size, room.bombCount);
            player.ready = true;
        }
        await this.startPlaying(room);
    }
    async startPlaying(room) {
        room.status = "PLAYING";
        room.startedAt = Date.now();
        room.gameDeadline = Date.now() + GAME_TIME_MS;
        this.touch(room);
        /* First turn — random */
        const firstSeat = (Math.random() < 0.5 ? 0 : 1);
        const firstPlayer = room.players[firstSeat];
        room.turn = firstPlayer?.userId ?? null;
        room.turnDeadline = Date.now() + TURN_TIME_MS;
        await prisma.gameSession.update({
            where: { id: room.sessionId },
            data: { status: "PLAYING", startedAt: new Date() },
        });
        this.scheduleTurnTimeout(room.code);
        setTimeout(() => {
            void this.expireGame(room.code);
        }, GAME_TIME_MS + 500);
        this.emit("state-changed", room.code);
    }
    /* ============================================================
       READY
       ============================================================ */
    async playerReady(code, userId, bombs) {
        const room = this.rooms.get(code);
        if (!room)
            throw new ApiError("GAME_NOT_FOUND", "Game not found", 404);
        if (room.status !== "PLACING") {
            throw new ApiError("INVALID_STATE", "Not in placement phase", 409);
        }
        const player = room.players.find((p) => p?.userId === userId);
        if (!player)
            throw new ApiError("FORBIDDEN", "You are not in this game", 403);
        this.touch(room);
        if (bombs && Array.isArray(bombs) && bombs.length > 0) {
            const bombSet = new Set(bombs);
            if (!validateBombs(bombSet, room.size, room.bombCount)) {
                throw new ApiError("VALIDATION_ERROR", `You must place exactly ${room.bombCount} bombs`, 400);
            }
            player.bombs = bombSet;
        }
        else if (player.bombs.size !== room.bombCount) {
            player.bombs = randomBombs(room.size, room.bombCount);
        }
        player.ready = true;
        await prisma.gamePlayer.updateMany({
            where: { sessionId: room.sessionId, userId },
            data: {
                bombs: JSON.stringify([...player.bombs]),
                readyAt: new Date(),
            },
        });
        const bothReady = room.players.every((p) => p?.ready);
        if (bothReady) {
            await this.startPlaying(room);
        }
        else {
            const opponent = room.players.find((p) => p?.userId !== userId);
            this.emit("opponent-ready", room.code, opponent?.firstName ?? null);
        }
        this.emit("state-changed", room.code);
    }
    /* ============================================================
       CLICK — senior correct logic
       ============================================================
       - `me.hits` = how many of OPPONENT's bombs I have found
       - `opp.hits` = how many of MY bombs opponent has found
       - Win condition: me.hits >= opponent's bomb count
       - Bonus turn: if hit, same player continues
       - Turn passes: if miss
       ============================================================ */
    async clickCell(code, userId, row, col) {
        const room = this.rooms.get(code);
        if (!room)
            throw new ApiError("GAME_NOT_FOUND", "Game not found", 404);
        if (room.status !== "PLAYING") {
            throw new ApiError("INVALID_STATE", "Game is not playing", 409);
        }
        if (room.turn !== userId) {
            throw new ApiError("NOT_YOUR_TURN", "It's not your turn", 403);
        }
        const me = room.players.find((p) => p?.userId === userId);
        if (!me)
            throw new ApiError("FORBIDDEN", "You are not in this game", 403);
        const opp = room.players[opponentSeat(me.seat)];
        if (!opp)
            throw new ApiError("INVALID_STATE", "Opponent missing", 500);
        this.touch(room);
        const index = rcToIndex(row, col, room.size);
        if (opp.revealed.has(index)) {
            throw new ApiError("CELL_ALREADY_REVEALED", "This cell is already revealed", 409);
        }
        /* =============================================
           Calculate hit
           ============================================= */
        const hit = opp.bombs.has(index);
        opp.revealed.add(index);
        if (hit) {
            /* I found one of OPPONENT's bombs → my counter up */
            me.hits += 1;
            /* Opponent's "found-by-me" counter — increment for opponent tracking */
            opp.hits += 0;
            /* NOTE: opp.hits is used to track how many of MY bombs they found,
               so we DON'T increment it here. */
        }
        await prisma.gameMove.create({
            data: {
                sessionId: room.sessionId,
                actorId: userId,
                targetSeat: opp.seat,
                row,
                col,
                hit,
            },
        });
        this.emit("move-result", room.code, {
            row,
            col,
            hit,
            actorId: userId,
        });
        /* =============================================
           WIN CHECK: I found ALL of opponent's bombs
           ============================================= */
        if (me.hits >= room.bombCount) {
            await this.finishGame(room, userId);
            return { hit, gameOver: true };
        }
        /* =============================================
           Turn logic
           ============================================= */
        if (!hit) {
            /* Miss → turn passes */
            room.turn = opp.userId;
            room.turnDeadline = Date.now() + TURN_TIME_MS;
            this.scheduleTurnTimeout(room.code);
        }
        else {
            /* Hit → same player continues (bonus turn) */
            room.turnDeadline = Date.now() + TURN_TIME_MS;
            this.scheduleTurnTimeout(room.code);
        }
        this.emit("state-changed", room.code);
        return { hit, gameOver: false };
    }
    /* ============================================================
       TURN TIMEOUT
       ============================================================ */
    scheduleTurnTimeout(code) {
        this.clearTurnTimer(code);
        const timer = setTimeout(() => {
            void this.handleTurnTimeout(code);
        }, TURN_TIME_MS + TURN_TIMEOUT_BUFFER_MS);
        this.turnTimers.set(code, timer);
    }
    async handleTurnTimeout(code) {
        const room = this.rooms.get(code);
        if (!room || room.status !== "PLAYING")
            return;
        if (!room.turnDeadline || Date.now() < room.turnDeadline)
            return;
        const current = room.players.find((p) => p?.userId === room.turn);
        if (!current)
            return;
        const opp = room.players[opponentSeat(current.seat)];
        if (!opp)
            return;
        room.turn = opp.userId;
        room.turnDeadline = Date.now() + TURN_TIME_MS;
        this.touch(room);
        this.scheduleTurnTimeout(code);
        this.emit("state-changed", code);
    }
    /* ============================================================
       FINISH
       ============================================================ */
    async finishGame(room, winnerId) {
        room.status = "FINISHED";
        room.winnerId = winnerId;
        room.finishedAt = Date.now();
        room.turn = null;
        room.turnDeadline = null;
        room.pausedAt = null;
        room.pausedByUserId = null;
        room.pausedFromStatus = null;
        room.reconnectDeadline = null;
        this.touch(room);
        await prisma.gameSession.update({
            where: { id: room.sessionId },
            data: {
                status: "FINISHED",
                winnerId,
                finishedAt: new Date(),
            },
        });
        /* Clear ALL timers — nothing should fire after finish */
        this.clearAllTimers(room.code);
        this.emit("game-over", room.code, winnerId, room.reward);
        this.emit("state-changed", room.code);
    }
    async expireGame(code) {
        const room = this.rooms.get(code);
        if (!room || room.status !== "PLAYING")
            return;
        const p0 = room.players[0];
        const p1 = room.players[1];
        if (!p0 || !p1)
            return;
        let winnerId = null;
        if (p0.hits > p1.hits)
            winnerId = p0.userId;
        else if (p1.hits > p0.hits)
            winnerId = p1.userId;
        if (winnerId) {
            await this.finishGame(room, winnerId);
        }
        else {
            room.status = "EXPIRED";
            room.finishedAt = Date.now();
            this.touch(room);
            await prisma.gameSession.update({
                where: { id: room.sessionId },
                data: { status: "EXPIRED", finishedAt: new Date() },
            });
            this.clearAllTimers(code);
            this.emit("state-changed", room.code);
        }
    }
    /* ============================================================
       DISCONNECT — only pauses if active play in progress
       ============================================================ */
    async disconnectUser(userId) {
        const code = this.userToRoom.get(userId);
        if (!code)
            return;
        const room = this.rooms.get(code);
        if (!room)
            return;
        const player = room.players.find((p) => p?.userId === userId);
        if (!player)
            return;
        if (!player.connected)
            return;
        player.connected = false;
        player.disconnectedAt = Date.now();
        this.touch(room);
        /* If game is already finished, don't do anything else */
        if (this.isFinishedStatus(room.status)) {
            this.emit("state-changed", room.code);
            return;
        }
        this.emit("opponent-disconnected", room.code, {
            opponentName: player.firstName,
        });
        const bothDisconnected = room.players.every((p) => p === null || !p.connected);
        if (bothDisconnected) {
            if (room.status !== "PAUSED") {
                await this.pauseGame(room, userId);
            }
            else {
                this.scheduleReconnectTimeout(room.code);
            }
            return;
        }
        /* Grace period — if user doesn't return in 10s, pause */
        this.clearPauseGraceTimer(room.code);
        const timer = setTimeout(() => {
            void this.maybeAutoPause(room.code);
        }, GRACE_BEFORE_PAUSE_MS + PAUSE_GRACE_BUFFER_MS);
        this.pauseGraceTimers.set(room.code, timer);
        this.emit("state-changed", room.code);
    }
    async maybeAutoPause(code) {
        const room = this.rooms.get(code);
        if (!room)
            return;
        /* Don't pause finished games */
        if (this.isFinishedStatus(room.status))
            return;
        if (room.status === "PAUSED")
            return;
        const disconnected = room.players.find((p) => p !== null && !p.connected);
        if (!disconnected)
            return;
        await this.pauseGame(room, disconnected.userId);
    }
    /* ============================================================
       PAUSE — only for active games
       ============================================================ */
    async pauseGame(room, pausedByUserId) {
        if (room.status === "PAUSED")
            return;
        if (this.isFinishedStatus(room.status))
            return;
        if (room.status === "WAITING") {
            /* Nothing to pause — just abandon */
            await this.abandonRoom(room);
            return;
        }
        const previousStatus = room.status;
        const reconnectDeadline = Date.now() + RECONNECT_WINDOW_MS;
        room.status = "PAUSED";
        room.pausedAt = Date.now();
        room.pausedByUserId = pausedByUserId;
        room.pausedFromStatus = previousStatus;
        room.reconnectDeadline = reconnectDeadline;
        this.touch(room);
        this.clearTurnTimer(room.code);
        await prisma.gameSession.update({
            where: { id: room.sessionId },
            data: {
                status: "PAUSED",
                pausedAt: new Date(),
                pausedByUserId,
                pausedFromStatus: previousStatus,
                reconnectDeadline: new Date(reconnectDeadline),
            },
        });
        this.scheduleReconnectTimeout(room.code);
        this.emit("state-changed", room.code);
    }
    /* ============================================================
       RESUME
       ============================================================ */
    async resumeGame(room) {
        if (room.status !== "PAUSED")
            return;
        const previousStatus = room.pausedFromStatus ?? "PLAYING";
        room.status = previousStatus;
        room.pausedAt = null;
        room.pausedByUserId = null;
        room.pausedFromStatus = null;
        room.reconnectDeadline = null;
        this.touch(room);
        if (previousStatus === "PLAYING") {
            room.turnDeadline = Date.now() + TURN_TIME_MS;
            this.scheduleTurnTimeout(room.code);
        }
        if (previousStatus === "PLACING") {
            room.placementDeadline = Date.now() + PLACEMENT_TIME_MS;
        }
        await prisma.gameSession.update({
            where: { id: room.sessionId },
            data: {
                status: previousStatus,
                pausedAt: null,
                pausedByUserId: null,
                pausedFromStatus: null,
                reconnectDeadline: null,
            },
        });
        this.clearReconnectTimer(room.code);
        const resumedPlayer = room.players.find((p) => p?.connected);
        this.emit("opponent-reconnected", room.code, {
            firstName: resumedPlayer?.firstName ?? null,
        });
        this.emit("state-changed", room.code);
    }
    /* ============================================================
       RECONNECT TIMEOUT (5 min)
       ============================================================ */
    scheduleReconnectTimeout(code) {
        this.clearReconnectTimer(code);
        const timer = setTimeout(() => {
            void this.handleReconnectTimeout(code);
        }, RECONNECT_WINDOW_MS + 500);
        this.reconnectTimers.set(code, timer);
    }
    async handleReconnectTimeout(code) {
        const room = this.rooms.get(code);
        if (!room || room.status !== "PAUSED")
            return;
        const winner = room.players.find((p) => p?.connected);
        if (winner) {
            await this.finishGame(room, winner.userId);
        }
        else {
            await this.abandonRoom(room);
        }
        for (const p of room.players) {
            if (p)
                this.userToRoom.delete(p.userId);
        }
        this.emit("state-changed", room.code);
    }
    /* ============================================================
       ABANDON
       ============================================================ */
    async abandonRoom(room) {
        room.status = "ABANDONED";
        room.finishedAt = Date.now();
        room.pausedAt = null;
        room.pausedByUserId = null;
        room.pausedFromStatus = null;
        room.reconnectDeadline = null;
        this.touch(room);
        await prisma.gameSession.update({
            where: { id: room.sessionId },
            data: { status: "ABANDONED", finishedAt: new Date() },
        });
        this.clearAllTimers(room.code);
    }
    /* ============================================================
       LEAVE
       ============================================================ */
    async leaveRoom(userId) {
        const code = this.userToRoom.get(userId);
        if (!code)
            return;
        const room = this.rooms.get(code);
        if (!room)
            return;
        const player = room.players.find((p) => p?.userId === userId);
        if (!player)
            return;
        await this.disconnectUser(userId);
    }
    /* ============================================================
       PUBLIC STATE
       ============================================================ */
    getPublicState(code, userId) {
        const room = this.rooms.get(code);
        if (!room)
            throw new ApiError("GAME_NOT_FOUND", "Game not found", 404);
        const me = room.players.find((p) => p?.userId === userId);
        if (!me)
            throw new ApiError("FORBIDDEN", "You are not in this game", 403);
        const opp = room.players[opponentSeat(me.seat)];
        /* =============================================
           For FINISHED status — reveal EVERYTHING
           ============================================= */
        const isFinished = this.isFinishedStatus(room.status);
        return {
            code: room.code,
            size: room.size,
            bombCount: room.bombCount,
            reward: room.reward,
            status: room.status,
            myBombs: [...me.bombs],
            myRevealed: [...me.revealed],
            opponentRevealed: opp
                ? [...opp.revealed].map((index) => ({
                    index,
                    hit: opp.bombs.has(index),
                }))
                : [],
            /* On finish, reveal opponent's bombs too */
            opponentBombs: isFinished && opp ? [...opp.bombs] : [],
            myHits: me.hits,
            opponentHits: opp?.hits ?? 0,
            turn: room.turn,
            turnDeadline: room.turnDeadline,
            placementDeadline: room.placementDeadline,
            gameDeadline: room.gameDeadline,
            winnerId: room.winnerId,
            players: room.players
                .filter((p) => p !== null)
                .map((p) => ({
                userId: p.userId,
                seat: p.seat,
                firstName: p.firstName,
                photoUrl: p.photoUrl,
                ready: p.ready,
                connected: p.connected,
                disconnectedAt: p.disconnectedAt,
            })),
            mySeat: me.seat,
            myUserId: me.userId,
            pausedAt: room.pausedAt,
            pausedByUserId: room.pausedByUserId,
            reconnectDeadline: room.reconnectDeadline,
        };
    }
    /* ============================================================
       CLEANUP
       ============================================================ */
    generateUniqueCode() {
        let code = generateRoomCode();
        let attempts = 0;
        while (this.rooms.has(code) && attempts < 10) {
            code = generateRoomCode();
            attempts += 1;
        }
        return code;
    }
    startCleanup() {
        this.cleanupTimer = setInterval(() => {
            const now = Date.now();
            for (const [code, room] of this.rooms) {
                if (room.finishedAt && now - room.finishedAt > ROOM_TTL_MS) {
                    this.rooms.delete(code);
                    this.codeToRoom.delete(code);
                    for (const p of room.players) {
                        if (p)
                            this.userToRoom.delete(p.userId);
                    }
                    this.clearAllTimers(code);
                    continue;
                }
                if (!room.finishedAt &&
                    this.isActiveStatus(room.status) &&
                    now - room.lastActivityAt > ROOM_TTL_MS) {
                    void this.abandonRoom(room).then(() => {
                        this.rooms.delete(code);
                        this.codeToRoom.delete(code);
                        for (const p of room.players) {
                            if (p)
                                this.userToRoom.delete(p.userId);
                        }
                        this.clearAllTimers(code);
                    });
                }
            }
        }, CLEANUP_INTERVAL_MS);
        this.cleanupTimer.unref();
    }
    shutdown() {
        if (this.cleanupTimer)
            clearInterval(this.cleanupTimer);
        for (const t of this.reconnectTimers.values())
            clearTimeout(t);
        for (const t of this.pauseGraceTimers.values())
            clearTimeout(t);
        for (const t of this.turnTimers.values())
            clearTimeout(t);
        this.reconnectTimers.clear();
        this.pauseGraceTimers.clear();
        this.turnTimers.clear();
        this.rooms.clear();
        this.codeToRoom.clear();
        this.userToRoom.clear();
    }
}
export const bombRoomManager = new BombRoomManager();
