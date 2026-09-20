/* ============================================================
   TIC-TAC-TOE — Frontend Types
   ============================================================ */

export type TttSymbol = "X" | "O";
export type TttCell = TttSymbol | null;

export type TttStatus =
  | "WAITING"
  | "ACTIVE"
  | "FINISHED"
  | "DRAW"
  | "ABANDONED"
  | "EXPIRED";

export type TttBoardSize = 3 | 4 | 5 | 6 | 7;

export type TttPublicState = {
  code: string;
  size: TttBoardSize;
  winLength: number;
  board: TttCell[];
  status: TttStatus;
  players: Array<{
    userId: string;
    seat: 0 | 1;
    firstName: string | null;
    photoUrl: string | null;
    symbol: TttSymbol;
    icon: string;
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
      symbol: TttSymbol;
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
        icon: string;
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

export type TttHistoryItem = {
  id: string;
  code: string;
  status: string;
  size: number;
  winLength: number;
  winnerId: string | null;
  winner: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  } | null;
  players: Array<{
    userId: string;
    firstName: string | null;
    photoUrl: string | null;
    symbol: string;
    icon: string;
  }>;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  myResult: "WIN" | "LOSS" | "DRAW" | "IN_PROGRESS" | "CANCELLED";
};