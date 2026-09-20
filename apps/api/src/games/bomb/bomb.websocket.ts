/* ============================================================
   BOMB GAME — WebSocket handler
   @fastify/websocket v11: first arg IS the WebSocket
   ============================================================ */

import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import { bombRoomManager } from "./bomb.room.js";
import { gameTokenStore } from "../game.tokens.js";
import type { ClientMessage, ServerMessage } from "./bomb.types.js";

type Client = {
  socket: WebSocket;
  userId: string;
  roomCode: string | null;
  alive: boolean;
};

const clients = new Map<string, Client>();
let socketCounter = 0;

function sendState(roomCode: string) {
  const room = bombRoomManager.getRoom(roomCode);
  if (!room) return;

  for (const client of clients.values()) {
    if (client.roomCode !== roomCode) continue;
    if (!room.players.some((p) => p?.userId === client.userId)) continue;

    try {
      const state = bombRoomManager.getPublicState(roomCode, client.userId);
      client.socket.send(JSON.stringify({ type: "STATE", state }));
    } catch {
      /* ignore */
    }
  }
}

function broadcast(
  roomCode: string,
  msg: ServerMessage,
  exceptUserId?: string,
) {
  for (const client of clients.values()) {
    if (client.roomCode !== roomCode) continue;
    if (exceptUserId && client.userId === exceptUserId) continue;
    try {
      client.socket.send(JSON.stringify(msg));
    } catch {
      /* ignore */
    }
  }
}

bombRoomManager.on("state-changed", (code: string) => sendState(code));

bombRoomManager.on(
  "opponent-joined",
  (
    code: string,
    opponent: { firstName: string | null; photoUrl: string | null },
  ) => {
    broadcast(code, { type: "OPPONENT_JOINED", opponent });
  },
);

bombRoomManager.on(
  "opponent-disconnected",
  (code: string, payload: { opponentName: string | null }) => {
    const room = bombRoomManager.getRoom(code);
    broadcast(code, {
      type: "OPPONENT_DISCONNECTED",
      reconnectDeadline: room?.reconnectDeadline ?? 0,
      opponentName: payload.opponentName,
    });
  },
);

bombRoomManager.on(
  "opponent-reconnected",
  (code: string, payload: { firstName: string | null }) => {
    broadcast(code, {
      type: "OPPONENT_RECONNECTED",
      opponentName: payload.firstName,
    });
  },
);

bombRoomManager.on(
  "move-result",
  (
    code: string,
    payload: { row: number; col: number; hit: boolean; actorId: string },
  ) => {
    const room = bombRoomManager.getRoom(code);
    broadcast(code, {
      type: "MOVE_RESULT",
      row: payload.row,
      col: payload.col,
      hit: payload.hit,
      actorId: payload.actorId,
      nextTurn: room?.turn ?? null,
    });
  },
);

bombRoomManager.on(
  "game-over",
  (code: string, winnerId: string, reward: string) => {
    broadcast(code, { type: "GAME_OVER", winnerId, reward });
  },
);

bombRoomManager.on(
  "opponent-ready",
  (code: string, opponentName: string | null) => {
    broadcast(code, { type: "OPPONENT_READY", opponentName });
  },
);

bombRoomManager.on("opponent-left", (code: string) => {
  broadcast(code, { type: "OPPONENT_LEFT" });
});

function parseQuery(url: string): Record<string, string> {
  const idx = url.indexOf("?");
  if (idx === -1) return {};
  const qs = url.slice(idx + 1);
  const out: Record<string, string> = {};
  for (const pair of qs.split("&")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const k = decodeURIComponent(pair.slice(0, eq));
    const v = decodeURIComponent(pair.slice(eq + 1));
    out[k] = v;
  }
  return out;
}

export function registerBombWebSocket(app: FastifyInstance) {
  app.get(
    "/v1/games/bomb/ws",
    { websocket: true },
    (socket: WebSocket, request) => {
      const req = request as {
        raw?: { url?: string };
        url?: string;
        query?: Record<string, unknown>;
      };

      const url = req.raw?.url ?? req.url ?? "";
      const q = req.query as { token?: string } | undefined;

      let token: string | undefined;
      if (q?.token) {
        token = String(q.token);
      } else {
        const parsed = parseQuery(url);
        token = parsed.token;
      }

      if (!token) {
        try {
          socket.close(4001, "Missing token");
        } catch {
          /* ignore */
        }
        return;
      }

      /* ============ Use shared gameTokenStore ============ */
      const payload = gameTokenStore.consume(token);
      if (!payload || payload.gameType !== "BOMB") {
        try {
          socket.close(4003, "Invalid or expired token");
        } catch {
          /* ignore */
        }
        return;
      }

      const { userId, roomCode } = payload;

      (async () => {
        const room = bombRoomManager.getRoom(roomCode);
        if (!room) {
          try {
            socket.close(4004, "Game not found");
          } catch {
            /* ignore */
          }
          return;
        }

        try {
          await bombRoomManager.joinRoom({
            code: roomCode,
            userId,
            firstName: null,
            photoUrl: null,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Cannot join";
          console.error("[bomb.ws] join failed:", message);
          try {
            socket.close(4005, message);
          } catch {
            /* ignore */
          }
          return;
        }

        socketCounter += 1;
        const socketId = `s_${Date.now()}_${socketCounter}`;

        const client: Client = {
          socket,
          userId,
          roomCode,
          alive: true,
        };

        clients.set(socketId, client);

        try {
          const state = bombRoomManager.getPublicState(roomCode, userId);
          socket.send(JSON.stringify({ type: "STATE", state }));
        } catch (err) {
          console.error("[bomb.ws] initial state failed:", err);
        }

        const pingInterval = setInterval(() => {
          if (!client.alive) {
            try {
              socket.close();
            } catch {
              /* ignore */
            }
            return;
          }
          client.alive = false;
          try {
            socket.ping();
          } catch {
            /* ignore */
          }
        }, 30_000);

        socket.on("pong", () => {
          client.alive = true;
        });

        socket.on("message", async (raw: Buffer) => {
          client.alive = true;

          let msg: ClientMessage;
          try {
            msg = JSON.parse(raw.toString());
          } catch {
            return;
          }

          try {
            switch (msg.type) {
              case "PING":
                socket.send(JSON.stringify({ type: "PONG" }));
                return;

              case "DISCONNECT":
                await bombRoomManager.disconnectUser(userId);
                return;

              case "READY":
                await bombRoomManager.playerReady(
                  roomCode,
                  userId,
                  msg.bombs,
                );
                return;

              case "PLACE_BOMB":
              case "CLEAR_BOMBS":
              case "RANDOM_BOMBS":
                return;

              case "CLICK": {
                const { row, col } = msg;
                await bombRoomManager.clickCell(
                  roomCode,
                  userId,
                  row,
                  col,
                );
                return;
              }

              default:
                return;
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : "Error";
            console.error("[bomb.ws] action failed:", message);
            try {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  code: "ACTION_FAILED",
                  message,
                }),
              );
            } catch {
              /* ignore */
            }
          }
        });

        socket.on("close", async () => {
          clearInterval(pingInterval);
          clients.delete(socketId);
          await bombRoomManager.leaveRoom(userId);
        });

        socket.on("error", (err) => {
          console.error("[bomb.ws] socket error:", err);
        });
      })();
    },
  );
}