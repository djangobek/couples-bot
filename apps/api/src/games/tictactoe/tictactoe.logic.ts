/* ============================================================
   TIC-TAC-TOE — Pure game logic
   ============================================================ */

export type Symbol = "X" | "O";
export type Cell = Symbol | null;

/* ---------- Game config ---------- */
export const GAME_CONFIG = {
  3: { winLength: 3, label: "Klassik" },
  4: { winLength: 4, label: "Keng" },
  5: { winLength: 4, label: "O'rta" },
  6: { winLength: 4, label: "Katta" },
  7: { winLength: 5, label: "Ulkan" },
} as const;

export type BoardSize = 3 | 4 | 5 | 6 | 7;

export const VALID_SIZES: BoardSize[] = [3, 4, 5, 6, 7];

export function isValidSize(size: number): size is BoardSize {
  return size === 3 || size === 4 || size === 5 || size === 6 || size === 7;
}

export function winLengthForSize(size: BoardSize): number {
  return GAME_CONFIG[size].winLength;
}

/* ---------- Symbols ---------- */
export function randomSymbol(): Symbol {
  return Math.random() < 0.5 ? "X" : "O";
}

export function oppositeSymbol(s: Symbol): Symbol {
  return s === "X" ? "O" : "X";
}

/* ---------- Board helpers ---------- */
export function emptyBoard(size: number): Cell[] {
  return new Array(size * size).fill(null);
}

export function indexOf(row: number, col: number, size: number): number {
  return row * size + col;
}

export function isInside(row: number, col: number, size: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

/* ---------- Win detection ----------
   Returns winning cells (indices) if any, otherwise null.
   Optimized: only checks lines through the last move.
   ============================================================ */
export function findWinningLine(
  board: Cell[],
  size: number,
  winLength: number,
  lastIndex: number,
): number[] | null {
  const last = board[lastIndex];
  if (!last) return null;

  const lastRow = Math.floor(lastIndex / size);
  const lastCol = lastIndex % size;

  /* Four directions to check */
  const directions: [number, number][] = [
    [0, 1],   // horizontal →
    [1, 0],   // vertical ↓
    [1, 1],   // diagonal ↘
    [1, -1],  // diagonal ↙
  ];

  for (const [dr, dc] of directions) {
    const line: number[] = [lastIndex];

    /* Walk in + direction */
    for (let step = 1; step < winLength; step += 1) {
      const r = lastRow + dr * step;
      const c = lastCol + dc * step;
      if (!isInside(r, c, size)) break;
      const idx = indexOf(r, c, size);
      if (board[idx] !== last) break;
      line.push(idx);
    }

    /* Walk in - direction */
    for (let step = 1; step < winLength; step += 1) {
      const r = lastRow - dr * step;
      const c = lastCol - dc * step;
      if (!isInside(r, c, size)) break;
      const idx = indexOf(r, c, size);
      if (board[idx] !== last) break;
      line.unshift(idx);
    }

    if (line.length >= winLength) {
      return line;
    }
  }

  return null;
}

/* ---------- Full board check ---------- */
export function isBoardFull(board: Cell[]): boolean {
  return board.every((c) => c !== null);
}

/* ---------- Room code ---------- */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/* ---------- Icon validation ---------- */
export const VALID_ICONS = {
  X: ["❌", "✖️", "✕", "✗", "×"],
  O: ["⭕", "⚪", "◯", "○", "◉"],
} as const;

export type PlayerIcon = string;

export function isValidIcon(symbol: Symbol, icon: string): boolean {
  return (VALID_ICONS[symbol] as readonly string[]).includes(icon);
}

export function defaultIconForSymbol(symbol: Symbol): PlayerIcon {
  return symbol === "X" ? "❌" : "⭕";
}