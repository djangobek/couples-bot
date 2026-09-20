/* ============================================================
   BOMB GAME — Pure logic
   ============================================================ */

/* ---------- Time constants (single source of truth) ---------- */
export const PLACEMENT_TIME_MS = 60_000;      // 60s to place bombs
export const TURN_TIME_MS = 45_000;           // 45s per turn
export const GAME_TIME_MS = 15 * 60_000;      // 15 min total
export const RECONNECT_WINDOW_MS = 5 * 60_000; // 5 min reconnect
export const GRACE_BEFORE_PAUSE_MS = 10_000;  // 10s grace on disconnect

/* ---------- Bomb count ---------- */
export function bombCountForSize(size: number): number {
  const table: Record<number, number> = {
    5: 3,
    6: 4,
    7: 5,
    8: 6,
    9: 7,
    10: 9,
  };
  return table[size] ?? Math.floor(size * 0.7);
}

export function validateSize(size: number): boolean {
  return Number.isInteger(size) && size >= 5 && size <= 10;
}

/* ---------- Grid math ---------- */
export function indexToRC(index: number, size: number) {
  return { row: Math.floor(index / size), col: index % size };
}

export function rcToIndex(row: number, col: number, size: number): number {
  return row * size + col;
}

export function isValidCell(row: number, col: number, size: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

/* ---------- Bomb placement ---------- */
export function randomBombs(size: number, count: number): Set<number> {
  const total = size * size;
  if (count > total) count = total;
  const result = new Set<number>();
  while (result.size < count) {
    result.add(Math.floor(Math.random() * total));
  }
  return result;
}

export function validateBombs(
  bombs: Set<number>,
  size: number,
  expectedCount: number,
): boolean {
  if (bombs.size !== expectedCount) return false;
  const total = size * size;
  for (const b of bombs) {
    if (!Number.isInteger(b) || b < 0 || b >= total) return false;
  }
  return true;
}

/* ---------- Room code ---------- */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/* ---------- Turn ---------- */
export function opponentSeat(seat: 0 | 1): 0 | 1 {
  return seat === 0 ? 1 : 0;
}

export function hasWon(hits: number, opponentBombCount: number): boolean {
  return hits >= opponentBombCount;
}

/* ---------- Formatting ---------- */
export function formatRemainingMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}