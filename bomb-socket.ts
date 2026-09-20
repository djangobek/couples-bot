/* ============================================================
   BOMB GAME — WebSocket client
   ============================================================ */

import { api } from "./api";
import type {
  ClientMessage,
  ServerMessage,
  PublicRoomState,
} from "../features/games/bomb/bomb-types";

const WS_BASE = (() => {
  const apiUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ??
    "http://localhost:3001";
  return apiUrl.replace(/^http/, "ws");
})();

export type BombSocketEvents = {
  onState: (state: PublicRoomState) => void;
  onMoveResult: (payload: {
    row: number;
    col: number;
    hit: boolean;
    actorId: string;
    nextTurn: string | null;
  }) => void;
  onGameOver: (payload: { winnerId: string; reward: string }) => void;
  onOpponentReady: (name: string | null) => void;
  onOpponentJoined: (opponent: {
    firstName: string | null;
    photoUrl: string | null;
  }) => void;
  onOpponentDisconnected: (payload: {
    reconnectDeadline: number;
    opponentName: string | null;
  }) => void;
  onOpponentReconnected: (opponentName: string | null) => void;
  onOpponentLeft: () => void;
  onError: (code: string, message: string) => void;
  onClose: () => void;
  onOpen: () => void;
};

export class BombSocket {
  private ws: WebSocket | null = null;
  private roomCode: string;
  private events: Partial<BombSocketEvents> = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private closed = false;
  private queue: ClientMessage[] = [];
  private connecting = false;
  private intentionalClose = false;

  constructor(roomCode: string) {
    this.roomCode = roomCode;
  }

  on<K extends keyof BombSocketEvents>(
    event: K,
    handler: BombSocketEvents[K],
  ): this {
    this.events[event] = handler as never;
    return this;
  }

  async connect(): Promise<void> {
    if (this.connecting || this.ws) return;
    this.connecting = true;
    this.intentionalClose = false;

    try {
      const { token } = await api.getBombWsToken(this.roomCode);

      const url = `${WS_BASE}/v1/games/bomb/ws?token=${encodeURIComponent(
        token,
      )}`;

      this.ws = new WebSocket(url);
      this.attachHandlers();
    } catch (err) {
      this.connecting = false;
      this.events.onError?.(
        "TOKEN_ERROR",
        err instanceof Error ? err.message : "Token olishda xato",
      );
      this.scheduleReconnect();
    }
  }

  private attachHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.connecting = false;
      this.reconnectAttempts = 0;
      this.events.onOpen?.();

      while (this.queue.length > 0) {
        const msg = this.queue.shift();
        if (msg) this.send(msg);
      }

      this.pingTimer = window.setInterval(() => {
        this.send({ type: "PING" });
      }, 20_000);
    };

    this.ws.onmessage = (evt) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(evt.data as string);
      } catch {
        return;
      }

      switch (msg.type) {
        case "STATE":
          this.events.onState?.(msg.state);
          break;
        case "MOVE_RESULT":
          this.events.onMoveResult?.({
            row: msg.row,
            col: msg.col,
            hit: msg.hit,
            actorId: msg.actorId,
            nextTurn: msg.nextTurn,
          });
          break;
        case "GAME_OVER":
          this.events.onGameOver?.({
            winnerId: msg.winnerId,
            reward: msg.reward,
          });
          break;
        case "OPPONENT_READY":
          this.events.onOpponentReady?.(msg.opponentName);
          break;
        case "OPPONENT_JOINED":
          this.events.onOpponentJoined?.(msg.opponent);
          break;
        case "OPPONENT_DISCONNECTED":
          this.events.onOpponentDisconnected?.({
            reconnectDeadline: msg.reconnectDeadline,
            opponentName: msg.opponentName,
          });
          break;
        case "OPPONENT_RECONNECTED":
          this.events.onOpponentReconnected?.(msg.opponentName);
          break;
        case "OPPONENT_LEFT":
          this.events.onOpponentLeft?.();
          break;
        case "ERROR":
          this.events.onError?.(msg.code, msg.message);
          break;
        case "PONG":
          break;
      }
    };

    this.ws.onerror = () => {
      this.events.onError?.("NETWORK", "Ulanishda xatolik");
    };

    this.ws.onclose = () => {
      if (this.pingTimer) {
        clearInterval(this.pingTimer);
        this.pingTimer = null;
      }
      this.ws = null;
      this.connecting = false;
      this.events.onClose?.();
      if (!this.closed && !this.intentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.closed || this.intentionalClose) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.events.onError?.(
        "RECONNECT_FAILED",
        "Serverga qayta ulanib bo'lmadi",
      );
      return;
    }
    this.reconnectAttempts += 1;
    const delay = Math.min(
      1000 * Math.pow(1.5, this.reconnectAttempts),
      8000,
    );
    this.reconnectTimer = window.setTimeout(() => {
      void this.connect();
    }, delay);
  }

  send(msg: ClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.queue.push(msg);
      return;
    }
    try {
      this.ws.send(JSON.stringify(msg));
    } catch {
      this.queue.push(msg);
    }
  }

  ready(bombs: number[]): void {
    this.send({ type: "READY", bombs });
  }

  click(row: number, col: number): void {
    this.send({ type: "CLICK", row, col });
  }

  disconnect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: "DISCONNECT" }));
      } catch {
        /* ignore */
      }
    }
    this.intentionalClose = true;
    this.close();
  }

  close(): void {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
  }
}