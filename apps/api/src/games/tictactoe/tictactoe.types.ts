/* ============================================================
   TIC-TAC-TOE — Types
   ============================================================ */

import type {
  Cell,
  Symbol,
  BoardSize,
  PlayerIcon,
} from "./tictactoe.logic.js";

export type TttStatus =
  | "WAITING"
  | "ACTIVE"
  | "FINISHED"
  | "DRAW"
  | "ABANDONED"
  | "EXPIRED";

export type TttPlayer = {
  userId: string;
  seat: 0 | 1;
  firstName: string | null;
  photoUrl: string | null;
  symbol: Symbol;
  icon: PlayerIcon;
  connected: boolean;
  disconnectedAt: number | null;
};

export type TttRoom = {
  code: string;
  sessionId: string;
  coupleId: string;
  size: BoardSize;
  winLength: number;
  board: Cell[];
  status: TttStatus;
  players: [TttPlayer | null, TttPlayer | null];
  turn: string | null;
  turnDeadline: number | null;
  startedAt: number | null;
  finishedAt: number | null;
  winnerId: string | null;
  winningLine: number[] | null;
  createdAt: number;
  pausedAt: number | null;
  pausedByUserId: string | null;
  pausedFromStatus: TttStatus | null;
  reconnectDeadline: number | null;
  lastActivityAt: number;
  /* Rematch state */
  rematchVotes: Set<string>;
};

export type TttClientMessage =
  | { type: "PING" }
  | { type: "DISCONNECT" }
  | { type: "READY"; icon?: string }
  | { type: "MOVE"; row: number; col: number }
  | { type: "REMATCH_REQUEST" }
  | { type: "REMATCH_CANCEL" };

export type TttServerMessage =
  | { type: "PONG" }
  | { type: "STATE"; state: TttPublicState }
  | { type: "ERROR"; code: string; message: string }
  | {
      type: "MOVE_MADE";
      row: number;
      col: number;
      symbol: Symbol;
      actorId: string;
      nextTurn: string | null;
      winningLine: number[] | null;
      isDraw: boolean;
    }
  | {
      type: "GAME_OVER";
      winnerId: string | null;
      isDraw: boolean;
      winningLine: number[] | null;
    }
  | {
      type: "OPPONENT_JOINED";
      opponent: {
        firstName: string | null;
        photoUrl: string | null;
        icon: PlayerIcon;
      };
    }
  | { type: "OPPONENT_READY"; opponentName: string | null }
  | {
      type: "OPPONENT_DISCONNECTED";
      reconnectDeadline: number;
      opponentName: string | null;
    }
  | { type: "OPPONENT_RECONNECTED"; opponentName: string | null }
  | { type: "OPPONENT_LEFT" }
  | { type: "REMATCH_REQUESTED"; byUserId: string }
  | { type: "REMATCH_CANCELLED"; byUserId: string }
  | { type: "REMATCH_STARTED" };

export type TttPublicState = {
  code: string;
  size: BoardSize;
  winLength: number;
  board: Cell[];
  status: TttStatus;
  players: Array<{
    userId: string;
    seat: 0 | 1;
    firstName: string | null;
    photoUrl: string | null;
    symbol: Symbol;
    icon: PlayerIcon;
    connected: boolean;
    disconnectedAt: number | null;
  }>;
  turn: string | null;
  turnDeadline: number | null;
  winnerId: string | null;
  winningLine: number[] | null;
  myUserId: string;
  mySeat: 0 | 1;
  pausedAt: number | null;
  pausedByUserId: string | null;
  reconnectDeadline: number | null;
  rematchVotes: string[];
};