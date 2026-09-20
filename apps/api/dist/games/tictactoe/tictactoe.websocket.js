/* ============================================================
   TIC-TAC-TOE — WebSocket handler
   @fastify/websocket v11: first arg IS the WebSocket
   ============================================================ */
import { tttRoomManager } from "./tictactoe.room.js";
import { gameTokenStore } from "../game.tokens.js";
const clients = new Map();
let socketCounter = 0;
/* ---------- State sender ---------- */
function sendState(roomCode) {
    const room = tttRoomManager.getRoom(roomCode);
    if (!room)
        return;
    for (const client of clients.values()) {
        if (client.roomCode !== roomCode)
            continue;
        if (!room.players.some((p) => p?.userId === client.userId))
            continue;
        try {
            const state = tttRoomManager.getPublicState(roomCode, client.userId);
            client.socket.send(JSON.stringify({ type: "STATE", state }));
        }
        catch {
            /* ignore */
        }
    }
}
/* ---------- Broadcast ---------- */
function broadcast(roomCode, msg, exceptUserId) {
    for (const client of clients.values()) {
        if (client.roomCode !== roomCode)
            continue;
        if (exceptUserId && client.userId === exceptUserId)
            continue;
        try {
            client.socket.send(JSON.stringify(msg));
        }
        catch {
            /* ignore */
        }
    }
}
/* ---------- Event wiring ---------- */
tttRoomManager.on("state-changed", (code) => sendState(code));
tttRoomManager.on("opponent-joined", (code, opponent) => {
    broadcast(code, { type: "OPPONENT_JOINED", opponent });
});
tttRoomManager.on("opponent-disconnected", (code, payload) => {
    broadcast(code, {
        type: "OPPONENT_DISCONNECTED",
        reconnectDeadline: Date.now() + 5 * 60_000,
        opponentName: payload.opponentName,
    });
});
tttRoomManager.on("opponent-reconnected", (code, payload) => {
    broadcast(code, {
        type: "OPPONENT_RECONNECTED",
        opponentName: payload.firstName,
    });
});
tttRoomManager.on("move-made", (code, payload) => {
    broadcast(code, {
        type: "MOVE_MADE",
        row: payload.row,
        col: payload.col,
        symbol: payload.symbol,
        actorId: payload.actorId,
        nextTurn: payload.nextTurn,
        winningLine: payload.winningLine,
        isDraw: payload.isDraw,
    });
});
tttRoomManager.on("game-over", (code, payload) => {
    broadcast(code, {
        type: "GAME_OVER",
        winnerId: payload.winnerId,
        isDraw: payload.isDraw,
        winningLine: payload.winningLine,
    });
});
tttRoomManager.on("rematch-requested", (code, userId) => {
    broadcast(code, { type: "REMATCH_REQUESTED", byUserId: userId });
});
tttRoomManager.on("rematch-cancelled", (code, userId) => {
    broadcast(code, { type: "REMATCH_CANCELLED", byUserId: userId });
});
tttRoomManager.on("rematch-started", (code) => {
    broadcast(code, { type: "REMATCH_STARTED" });
});
/* ---------- Query parser ---------- */
function parseQuery(url) {
    const idx = url.indexOf("?");
    if (idx === -1)
        return {};
    const qs = url.slice(idx + 1);
    const out = {};
    for (const pair of qs.split("&")) {
        const eq = pair.indexOf("=");
        if (eq === -1)
            continue;
        const k = decodeURIComponent(pair.slice(0, eq));
        const v = decodeURIComponent(pair.slice(eq + 1));
        out[k] = v;
    }
    return out;
}
/* ---------- Register ---------- */
export function registerTttWebSocket(app) {
    app.get("/v1/games/tictactoe/ws", { websocket: true }, (socket, request) => {
        const req = request;
        const url = req.raw?.url ?? req.url ?? "";
        const q = req.query;
        let token;
        if (q?.token) {
            token = String(q.token);
        }
        else {
            const parsed = parseQuery(url);
            token = parsed.token;
        }
        if (!token) {
            try {
                socket.close(4001, "Missing token");
            }
            catch {
                /* ignore */
            }
            return;
        }
        const payload = gameTokenStore.consume(token);
        if (!payload || payload.gameType !== "TIC_TAC_TOE") {
            try {
                socket.close(4003, "Invalid or expired token");
            }
            catch {
                /* ignore */
            }
            return;
        }
        const { userId, roomCode } = payload;
        (async () => {
            const room = tttRoomManager.getRoom(roomCode);
            if (!room) {
                try {
                    socket.close(4004, "Game not found");
                }
                catch {
                    /* ignore */
                }
                return;
            }
            try {
                await tttRoomManager.joinRoom({
                    code: roomCode,
                    userId,
                    firstName: null,
                    photoUrl: null,
                });
            }
            catch (err) {
                const message = err instanceof Error ? err.message : "Cannot join";
                console.error("[ttt.ws] join failed:", message);
                try {
                    socket.close(4005, message);
                }
                catch {
                    /* ignore */
                }
                return;
            }
            socketCounter += 1;
            const socketId = `s_${Date.now()}_${socketCounter}`;
            const client = {
                socket,
                userId,
                roomCode,
                alive: true,
            };
            clients.set(socketId, client);
            try {
                const state = tttRoomManager.getPublicState(roomCode, userId);
                socket.send(JSON.stringify({ type: "STATE", state }));
            }
            catch (err) {
                console.error("[ttt.ws] initial state failed:", err);
            }
            /* Ping/pong keepalive */
            const pingInterval = setInterval(() => {
                if (!client.alive) {
                    try {
                        socket.close();
                    }
                    catch {
                        /* ignore */
                    }
                    return;
                }
                client.alive = false;
                try {
                    socket.ping();
                }
                catch {
                    /* ignore */
                }
            }, 30_000);
            socket.on("pong", () => {
                client.alive = true;
            });
            /* ---------- Messages ---------- */
            socket.on("message", async (raw) => {
                client.alive = true;
                let msg;
                try {
                    msg = JSON.parse(raw.toString());
                }
                catch {
                    return;
                }
                try {
                    switch (msg.type) {
                        case "PING":
                            socket.send(JSON.stringify({ type: "PONG" }));
                            return;
                        case "DISCONNECT":
                            await tttRoomManager.disconnectUser(userId);
                            return;
                        case "READY":
                            if (msg.icon) {
                                await tttRoomManager.setIcon(roomCode, userId, msg.icon);
                            }
                            return;
                        case "MOVE":
                            await tttRoomManager.makeMove(roomCode, userId, msg.row, msg.col);
                            return;
                        case "REMATCH_REQUEST":
                            await tttRoomManager.requestRematch(roomCode, userId);
                            return;
                        case "REMATCH_CANCEL":
                            await tttRoomManager.cancelRematch(roomCode, userId);
                            return;
                        default:
                            return;
                    }
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : "Error";
                    console.error("[ttt.ws] action failed:", message);
                    try {
                        socket.send(JSON.stringify({
                            type: "ERROR",
                            code: "ACTION_FAILED",
                            message,
                        }));
                    }
                    catch {
                        /* ignore */
                    }
                }
            });
            /* ---------- Close ---------- */
            socket.on("close", async () => {
                clearInterval(pingInterval);
                clients.delete(socketId);
                await tttRoomManager.leaveRoom(userId);
            });
            socket.on("error", (err) => {
                console.error("[ttt.ws] socket error:", err);
            });
        })();
    });
}
