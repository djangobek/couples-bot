/* ============================================================
   TIC-TAC-TOE — Room Manager (Senior)
   - Server-authoritative
   - Race-condition safe
   - Auto-cleanup
   - Turn timer (30s)
   - Rematch support
   ============================================================ */
import { EventEmitter } from "node:events";
import { prisma } from "../../database/prisma.service.js";
import { ApiError } from "../../common/errors/api-error.js";
import { emptyBoard, findWinningLine, generateRoomCode, isBoardFull, isValidIcon, isValidSize, oppositeSymbol, randomSymbol, winLengthForSize, defaultIconForSymbol, } from "./tictactoe.logic.js";
/* ---------- Helper: Prisma-safe JSON cast ---------- */
function toJsonInput(value) {
    if (value === undefined || value === null)
        return undefined;
    return value;
}
/* ---------- Timing ---------- */
const TURN_TIME_MS = 30_000;
const RECONNECT_WINDOW_MS = 5 * 60_000;
const GRACE_BEFORE_PAUSE_MS = 10_000;
const CLEANUP_INTERVAL_MS = 15_000;
const ROOM_TTL_MS = 30 * 60_000;
const TURN_TIMEOUT_BUFFER_MS = 200;
const PAUSE_GRACE_BUFFER_MS = 200;
class TttRoomManager extends EventEmitter {
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
       HELPERS
       ============================================================ */
    isActiveStatus(status) {
        return (status === "WAITING" ||
            status === "ACTIVE" ||
            status === "FINISHED" ||
            status === "DRAW");
    }
    isFinishedStatus(status) {
        return (status === "FINISHED" ||
            status === "DRAW" ||
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
       CREATE
       ============================================================ */
    async createRoom(params) {
        const { userId, coupleId, size } = params;
        if (!isValidSize(size)) {
            throw new ApiError("VALIDATION_ERROR", "Board size must be 3, 4, 5, 6, or 7", 400);
        }
        const existingCode = this.userToRoom.get(userId);
        if (existingCode) {
            const existingRoom = this.rooms.get(existingCode);
            if (existingRoom && !this.isFinishedStatus(existingRoom.status)) {
                throw new ApiError("GAME_IN_PROGRESS", "You already have an active game. Finish it first.", 409);
            }
        }
        const boardSize = size;
        const winLength = winLengthForSize(boardSize);
        const code = this.generateUniqueCode();
        const creatorSymbol = randomSymbol();
        const joinerSymbol = oppositeSymbol(creatorSymbol);
        const config = {
            creatorSymbol,
            joinerSymbol,
            creatorIcon: defaultIconForSymbol(creatorSymbol),
            joinerIcon: defaultIconForSymbol(joinerSymbol),
        };
        const session = await prisma.gameSession.create({
            data: {
                code,
                coupleId,
                creatorId: userId,
                type: "TIC_TAC_TOE",
                status: "WAITING",
                size: boardSize,
                config: toJsonInput(config),
            },
            select: { id: true },
        });
        const room = {
            code,
            sessionId: session.id,
            coupleId,
            size: boardSize,
            winLength,
            board: emptyBoard(boardSize),
            status: "WAITING",
            players: [null, null],
            turn: null,
            turnDeadline: null,
            startedAt: null,
            finishedAt: null,
            winnerId: null,
            winningLine: null,
            createdAt: Date.now(),
            pausedAt: null,
            pausedByUserId: null,
            pausedFromStatus: null,
            reconnectDeadline: null,
            lastActivityAt: Date.now(),
            rematchVotes: new Set(),
        };
        this.rooms.set(code, room);
        this.codeToRoom.set(code, session.id);
        return room;
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
            if (wasDisconnected) {
                this.clearPauseGraceTimer(room.code);
                this.emit("opponent-reconnected", room.code, {
                    firstName: player.firstName,
                });
            }
            this.emit("state-changed", room.code);
            return room;
        }
        /* ============================================================
          2. Yangi o'yinchi — bo'sh joyni topamiz
          ============================================================ */
        const emptySeatIdx = room.players.findIndex((p) => p === null);
        if (emptySeatIdx < 0) {
            throw new ApiError("GAME_FULL", "This game is already full", 409);
        }
        if (room.status !== "WAITING") {
            throw new ApiError("GAME_ALREADY_STARTED", "This game has already started", 409);
        }
        const emptySeat = emptySeatIdx;
        const symbol = emptySeat === 0 ? "X" : "O";
        /* Config dan icon ni olamiz */
        const session = await prisma.gameSession.findUnique({
            where: { id: room.sessionId },
            select: { config: true },
        });
        const config = session?.config ?? null;
        const playerSymbol = emptySeat === 0
            ? (config?.creatorSymbol ?? symbol)
            : (config?.joinerSymbol ?? symbol);
        const playerIcon = emptySeat === 0
            ? (config?.creatorIcon ?? defaultIconForSymbol(playerSymbol))
            : (config?.joinerIcon ?? defaultIconForSymbol(playerSymbol));
        const player = {
            userId,
            seat: emptySeat,
            firstName,
            photoUrl,
            symbol: playerSymbol,
            icon: playerIcon,
            connected: true,
            disconnectedAt: null,
        };
        /* ============================================================
          3. DB ga YOZISH — faqat agar hali mavjud bo'lmasa
          Bu yerda upsert ishlatamiz — race condition ham himoyalangan
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
                /* Agar allaqachon mavjud bo'lsa — hech narsa qilmaymiz */
                },
                create: {
                    sessionId: room.sessionId,
                    userId,
                    seat: emptySeat,
                    symbol: playerSymbol,
                },
            });
        }
        catch (err) {
            /* P2002 yoki boshqa xato — log qilamiz, lekin davom etamiz */
            console.error("[ttt.room] gamePlayer.upsert failed:", err);
            /* Agar xato bo'lsa ham, in-memory room'ga qo'shamiz */
        }
        /* ============================================================
          4. In-memory state ni yangilaymiz
          ============================================================ */
        room.players[emptySeat] = player;
        this.userToRoom.set(userId, code);
        /* ============================================================
          5. Ikkala o'yinchi ham bor bo'lsa — o'yinni boshlaymiz
          ============================================================ */
        if (room.players[0] && room.players[1]) {
            const opponent = room.players.find((p) => p?.userId !== userId);
            this.emit("opponent-joined", room.code, {
                firstName: opponent?.firstName ?? null,
                photoUrl: opponent?.photoUrl ?? null,
                icon: opponent?.icon ?? "❌",
            });
            await this.startGame(room);
        }
        this.emit("state-changed", room.code);
        return room;
    }
    /* ============================================================
       SET ICON
       ============================================================ */
    async setIcon(code, userId, icon) {
        const room = this.rooms.get(code);
        if (!room)
            throw new ApiError("GAME_NOT_FOUND", "Game not found", 404);
        const player = room.players.find((p) => p?.userId === userId);
        if (!player)
            throw new ApiError("FORBIDDEN", "You are not in this game", 403);
        if (!isValidIcon(player.symbol, icon)) {
            throw new ApiError("VALIDATION_ERROR", "Invalid icon for your symbol", 400);
        }
        player.icon = icon;
        this.touch(room);
        const session = await prisma.gameSession.findUnique({
            where: { id: room.sessionId },
            select: { config: true },
        });
        const existingConfig = session?.config ?? {};
        const newConfig = {
            ...existingConfig,
            ...(player.seat === 0
                ? { creatorIcon: icon }
                : { joinerIcon: icon }),
        };
        await prisma.gameSession.update({
            where: { id: room.sessionId },
            data: { config: toJsonInput(newConfig) },
        });
        this.emit("state-changed", room.code);
    }
    /* ============================================================
       START GAME
       ============================================================ */
    async startGame(room) {
        room.status = "ACTIVE";
        room.startedAt = Date.now();
        room.board = emptyBoard(room.size);
        const firstSeat = (Math.random() < 0.5 ? 0 : 1);
        const firstPlayer = room.players[firstSeat];
        room.turn = firstPlayer?.userId ?? null;
        room.turnDeadline = Date.now() + TURN_TIME_MS;
        await prisma.gameSession.update({
            where: { id: room.sessionId },
            data: {
                status: "PLAYING",
                startedAt: new Date(),
            },
        });
        this.touch(room);
        this.scheduleTurnTimeout(room.code);
        this.emit("state-changed", room.code);
    }
    /* ============================================================
       MAKE MOVE
       ============================================================ */
    async makeMove(code, userId, row, col) {
        const room = this.rooms.get(code);
        if (!room)
            throw new ApiError("GAME_NOT_FOUND", "Game not found", 404);
        if (room.status !== "ACTIVE") {
            if (this.isFinishedStatus(room.status)) {
                throw new ApiError("GAME_ALREADY_FINISHED", "Game is finished", 409);
            }
            throw new ApiError("INVALID_STATE", "Game is not active", 409);
        }
        if (room.turn !== userId) {
            throw new ApiError("NOT_YOUR_TURN", "It's not your turn", 403);
        }
        const me = room.players.find((p) => p?.userId === userId);
        if (!me)
            throw new ApiError("FORBIDDEN", "You are not in this game", 403);
        if (!Number.isInteger(row) ||
            !Number.isInteger(col) ||
            row < 0 ||
            row >= room.size ||
            col < 0 ||
            col >= room.size) {
            throw new ApiError("VALIDATION_ERROR", "Invalid cell", 400);
        }
        const index = row * room.size + col;
        if (room.board[index] !== null) {
            throw new ApiError("CELL_OCCUPIED", "This cell is taken", 409);
        }
        room.board[index] = me.symbol;
        const opponent = room.players.find((p) => p?.userId !== userId);
        await prisma.gameMove.create({
            data: {
                sessionId: room.sessionId,
                actorId: userId,
                targetSeat: opponent?.seat ?? (me.seat === 0 ? 1 : 0),
                row,
                col,
                symbol: me.symbol,
            },
        });
        const winningLine = findWinningLine(room.board, room.size, room.winLength, index);
        if (winningLine) {
            room.winningLine = winningLine;
            await this.finishGame(room, userId);
            this.emit("move-made", room.code, {
                row,
                col,
                symbol: me.symbol,
                actorId: userId,
                nextTurn: null,
                winningLine,
                isDraw: false,
            });
            return { winningLine, isDraw: false };
        }
        if (isBoardFull(room.board)) {
            await this.finishDraw(room);
            this.emit("move-made", room.code, {
                row,
                col,
                symbol: me.symbol,
                actorId: userId,
                nextTurn: null,
                winningLine: null,
                isDraw: true,
            });
            return { winningLine: null, isDraw: true };
        }
        room.turn = opponent?.userId ?? null;
        room.turnDeadline = Date.now() + TURN_TIME_MS;
        this.touch(room);
        this.scheduleTurnTimeout(room.code);
        this.emit("move-made", room.code, {
            row,
            col,
            symbol: me.symbol,
            actorId: userId,
            nextTurn: room.turn,
            winningLine: null,
            isDraw: false,
        });
        this.emit("state-changed", room.code);
        return { winningLine: null, isDraw: false };
    }
    /* ============================================================
       FINISH (WINNER)
       ============================================================ */
    async finishGame(room, winnerId) {
        room.status = "FINISHED";
        room.winnerId = winnerId;
        room.finishedAt = Date.now();
        room.turn = null;
        room.turnDeadline = null;
        this.touch(room);
        await prisma.gameSession.update({
            where: { id: room.sessionId },
            data: {
                status: "FINISHED",
                winnerId,
                finishedAt: new Date(),
            },
        });
        this.clearTurnTimer(room.code);
        this.emit("game-over", room.code, {
            winnerId,
            isDraw: false,
            winningLine: room.winningLine,
        });
        this.emit("state-changed", room.code);
    }
    /* ============================================================
       FINISH (DRAW)
       ============================================================ */
    async finishDraw(room) {
        room.status = "DRAW";
        room.winnerId = null;
        room.finishedAt = Date.now();
        room.turn = null;
        room.turnDeadline = null;
        this.touch(room);
        await prisma.gameSession.update({
            where: { id: room.sessionId },
            data: {
                status: "FINISHED",
                winnerId: null,
                finishedAt: new Date(),
            },
        });
        this.clearTurnTimer(room.code);
        this.emit("game-over", room.code, {
            winnerId: null,
            isDraw: true,
            winningLine: null,
        });
        this.emit("state-changed", room.code);
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
        if (!room || room.status !== "ACTIVE")
            return;
        if (!room.turnDeadline || Date.now() < room.turnDeadline)
            return;
        const current = room.players.find((p) => p?.userId === room.turn);
        if (!current)
            return;
        const opp = room.players.find((p) => p && p.userId !== current.userId);
        if (!opp)
            return;
        room.turn = opp.userId;
        room.turnDeadline = Date.now() + TURN_TIME_MS;
        this.touch(room);
        this.scheduleTurnTimeout(code);
        this.emit("state-changed", code);
    }
    /* ============================================================
       REMATCH
       ============================================================ */
    async requestRematch(code, userId) {
        const room = this.rooms.get(code);
        if (!room)
            throw new ApiError("GAME_NOT_FOUND", "Game not found", 404);
        if (!this.isFinishedStatus(room.status)) {
            throw new ApiError("INVALID_STATE", "Game is not finished yet", 409);
        }
        const player = room.players.find((p) => p?.userId === userId);
        if (!player)
            throw new ApiError("FORBIDDEN", "You are not in this game", 403);
        room.rematchVotes.add(userId);
        this.touch(room);
        this.emit("rematch-requested", room.code, userId);
        this.emit("state-changed", room.code);
        const both = room.players.every((p) => p && room.rematchVotes.has(p.userId));
        if (both) {
            await this.resetForRematch(room);
        }
    }
    async cancelRematch(code, userId) {
        const room = this.rooms.get(code);
        if (!room)
            throw new ApiError("GAME_NOT_FOUND", "Game not found", 404);
        room.rematchVotes.delete(userId);
        this.touch(room);
        this.emit("rematch-cancelled", room.code, userId);
        this.emit("state-changed", room.code);
    }
    async resetForRematch(room) {
        room.rematchVotes.clear();
        room.board = emptyBoard(room.size);
        room.status = "ACTIVE";
        room.winnerId = null;
        room.winningLine = null;
        room.finishedAt = null;
        room.startedAt = Date.now();
        const firstSeat = (Math.random() < 0.5 ? 0 : 1);
        const firstPlayer = room.players[firstSeat];
        room.turn = firstPlayer?.userId ?? null;
        room.turnDeadline = Date.now() + TURN_TIME_MS;
        this.touch(room);
        await prisma.gameSession.update({
            where: { id: room.sessionId },
            data: {
                status: "PLAYING",
                winnerId: null,
                finishedAt: null,
                startedAt: new Date(),
            },
        });
        await prisma.gameMove.deleteMany({
            where: { sessionId: room.sessionId },
        });
        this.scheduleTurnTimeout(room.code);
        this.emit("rematch-started", room.code);
        this.emit("state-changed", room.code);
    }
    /* ============================================================
       DISCONNECT
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
        if (this.isFinishedStatus(room.status)) {
            this.emit("state-changed", room.code);
            return;
        }
        this.emit("opponent-disconnected", room.code, {
            opponentName: player.firstName,
        });
        const bothDisconnected = room.players.every((p) => p === null || !p.connected);
        if (bothDisconnected) {
            await this.abandonRoom(room);
            return;
        }
        this.clearPauseGraceTimer(room.code);
        const timer = setTimeout(() => {
            void this.maybeAutoAbandon(room.code);
        }, GRACE_BEFORE_PAUSE_MS + PAUSE_GRACE_BUFFER_MS);
        this.pauseGraceTimers.set(room.code, timer);
        this.emit("state-changed", room.code);
    }
    async maybeAutoAbandon(code) {
        const room = this.rooms.get(code);
        if (!room)
            return;
        if (this.isFinishedStatus(room.status))
            return;
        const disconnected = room.players.find((p) => p !== null && !p.connected);
        if (!disconnected)
            return;
        const winner = room.players.find((p) => p && p.connected);
        if (winner) {
            await this.finishGame(room, winner.userId);
        }
        else {
            await this.abandonRoom(room);
        }
    }
    /* ============================================================
       ABANDON
       ============================================================ */
    async abandonRoom(room) {
        room.status = "ABANDONED";
        room.finishedAt = Date.now();
        room.turn = null;
        room.turnDeadline = null;
        this.touch(room);
        await prisma.gameSession.update({
            where: { id: room.sessionId },
            data: { status: "ABANDONED", finishedAt: new Date() },
        });
        this.clearAllTimers(room.code);
        this.emit("state-changed", room.code);
    }
    /* ============================================================
       LEAVE
       ============================================================ */
    async leaveRoom(userId) {
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
        return {
            code: room.code,
            size: room.size,
            winLength: room.winLength,
            board: room.board,
            status: room.status,
            players: room.players
                .filter((p) => p !== null)
                .map((p) => ({
                userId: p.userId,
                seat: p.seat,
                firstName: p.firstName,
                photoUrl: p.photoUrl,
                symbol: p.symbol,
                icon: p.icon,
                connected: p.connected,
                disconnectedAt: p.disconnectedAt,
            })),
            turn: room.turn,
            turnDeadline: room.turnDeadline,
            winnerId: room.winnerId,
            winningLine: room.winningLine,
            myUserId: userId,
            mySeat: me.seat,
            pausedAt: room.pausedAt,
            pausedByUserId: room.pausedByUserId,
            reconnectDeadline: room.reconnectDeadline,
            rematchVotes: [...room.rematchVotes],
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
export const tttRoomManager = new TttRoomManager();
