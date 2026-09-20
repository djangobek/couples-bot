/* ============================================================
   BOMB GAME — Types
   ============================================================ */

export type BombRoomStatus =
  | "WAITING"
  | "PLACING"
  | "PLAYING"
  | "PAUSED"
  | "FINISHED"
  | "ABANDONED"
  | "EXPIRED";

export type BombPlayer = {
  userId: string;
  seat: 0 | 1;
  firstName: string | null;
  photoUrl: string | null;
  bombs: Set<number>;
  revealed: Set<number>;
  hits: number;
  ready: boolean;
  connected: boolean;
  disconnectedAt: number | null;
};

export type BombRoom = {
  code: string;
  sessionId: string;
  coupleId: string;
  size: number;
  bombCount: number;
  reward: string;
  status: BombRoomStatus;
  players: [BombPlayer | null, BombPlayer | null];
  turn: string | null;
  turnDeadline: number | null;
  startedAt: number | null;
  finishedAt: number | null;
  placementDeadline: number | null;
  gameDeadline: number | null;
  winnerId: string | null;
  createdAt: number;
  pausedAt: number | null;
  pausedByUserId: string | null;
  pausedFromStatus: BombRoomStatus | null;
  reconnectDeadline: number | null;
  lastActivityAt: number;
};

export type ClientMessage =
  | { type: "PING" }
  | { type: "DISCONNECT" }
  | { type: "READY"; bombs?: number[] }
  | { type: "PLACE_BOMB"; index: number }
  | { type: "CLEAR_BOMBS" }
  | { type: "RANDOM_BOMBS" }
  | { type: "CLICK"; row: number; col: number };

export type ServerMessage =
  | { type: "PONG" }
  | { type: "STATE"; state: PublicRoomState }
  | { type: "ERROR"; code: string; message: string }
  | {
      type: "MOVE_RESULT";
      row: number;
      col: number;
      hit: boolean;
      actorId: string;
      nextTurn: string | null;
    }
  | { type: "GAME_OVER"; winnerId: string; reward: string }
  | { type: "OPPONENT_READY"; opponentName: string | null }
  | {
      type: "OPPONENT_JOINED";
      opponent: { firstName: string | null; photoUrl: string | null };
    }
  | {
      type: "OPPONENT_DISCONNECTED";
      reconnectDeadline: number;
      opponentName: string | null;
    }
  | { type: "OPPONENT_RECONNECTED"; opponentName: string | null }
  | { type: "OPPONENT_LEFT" };

export type PublicRoomState = {
  code: string;
  size: number;
  bombCount: number;
  reward: string;
  status: BombRoomStatus;
  myBombs: number[];
  myRevealed: number[];
  opponentRevealed: Array<{ index: number; hit: boolean }>;
  /* Only populated when game is FINISHED */
  opponentBombs: number[];
  myHits: number;
  opponentHits: number;
  turn: string | null;
  turnDeadline: number | null;
  placementDeadline: number | null;
  gameDeadline: number | null;
  winnerId: string | null;
  players: Array<{
    userId: string;
    seat: 0 | 1;
    firstName: string | null;
    photoUrl: string | null;
    ready: boolean;
    connected: boolean;
    disconnectedAt: number | null;
  }>;
  mySeat: 0 | 1;
  myUserId: string;
  pausedAt: number | null;
  pausedByUserId: string | null;
  reconnectDeadline: number | null;
};