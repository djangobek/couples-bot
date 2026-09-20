/* ============================================================
   TIC-TAC-TOE — WebSocket client (token-based)
   ============================================================ */

import { api } from "./api";
import type {
  TttClientMessage,
  TttServerMessage,
  TttPublicState,
} from "../features/games/tictactoe/tictactoe-types";

const WS_BASE = (() => {
  const apiUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ??
    "http://localhost:3001";
  return apiUrl.replace(/^http/, "ws");
})();

export type TttSocketEvents = {
  onState: (state: TttPublicState) => void;
  onMoveMade: (payload: {
    row: number;
    col: number;
    symbol: "X" | "O";
    actorId: string;
    nextTurn: string | null;
    winningLine: number[] | null;
    isDraw: boolean;
  }) => void;
  onGameOver: (payload: {
    winnerId: string | null;
    isDraw: boolean;
    winningLine: number[] | null;
  }) => void;
  onOpponentJoined: (opponent: {
    firstName: string | null;
    photoUrl: string | null;
    icon: string;
  }) => void;
  onOpponentDisconnected: (payload: {
    reconnectDeadline: number;
    opponentName: string | null;
  }) => void;
  onOpponentReconnected: (name: string | null) => void;
  onOpponentLeft: () => void;
  onRematchRequested: (byUserId: string) => void;
  onRematchCancelled: (byUserId: string) => void;
  onRematchStarted: () => void;
  onError: (code: string, message: string) => void;
  onClose: () => void;
  onOpen: () => void;
};

export class TttSocket {
  private ws: WebSocket | null = null;
  private roomCode: string;
  private events: Partial<TttSocketEvents> = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private closed = false;
  private queue: TttClientMessage[] = [];
  private connecting = false;
  private intentionalClose = false;

  constructor(roomCode: string) {
    this.roomCode = roomCode;
  }

  on<K extends keyof TttSocketEvents>(
    event: K,
    handler: TttSocketEvents[K],
  ): this {
    this.events[event] = handler as never;
    return this;
  }

  async connect(): Promise<void> {
    if (this.connecting || this.ws) return;
    this.connecting = true;
    this.intentionalClose = false;

    try {
      const { token } = await api.getTttWsToken(this.roomCode);

      const url = `${WS_BASE}/v1/games/tictactoe/ws?token=${encodeURIComponent(
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
      let msg: TttServerMessage;
      try {
        msg = JSON.parse(evt.data as string);
      } catch {
        return;
      }

      switch (msg.type) {
        case "STATE":
          this.events.onState?.(msg.state);
          break;
        case "MOVE_MADE":
          this.events.onMoveMade?.({
            row: msg.row,
            col: msg.col,
            symbol: msg.symbol,
            actorId: msg.actorId,
            nextTurn: msg.nextTurn,
            winningLine: msg.winningLine,
            isDraw: msg.isDraw,
          });
          break;
        case "GAME_OVER":
          this.events.onGameOver?.({
            winnerId: msg.winnerId,
            isDraw: msg.isDraw,
            winningLine: msg.winningLine,
          });
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
        case "REMATCH_REQUESTED":
          this.events.onRematchRequested?.(msg.byUserId);
          break;
        case "REMATCH_CANCELLED":
          this.events.onRematchCancelled?.(msg.byUserId);
          break;
        case "REMATCH_STARTED":
          this.events.onRematchStarted?.();
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

  send(msg: TttClientMessage): void {
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

  setIcon(icon: string): void {
    this.send({ type: "READY", icon });
  }

  move(row: number, col: number): void {
    this.send({ type: "MOVE", row, col });
  }

  requestRematch(): void {
    this.send({ type: "REMATCH_REQUEST" });
  }

  cancelRematch(): void {
    this.send({ type: "REMATCH_CANCEL" });
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