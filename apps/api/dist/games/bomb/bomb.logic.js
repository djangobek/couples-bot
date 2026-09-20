/* ============================================================
   BOMB GAME — Pure logic
   ============================================================ */
/* ---------- Time constants (single source of truth) ---------- */
export const PLACEMENT_TIME_MS = 60_000; // 60s to place bombs
export const TURN_TIME_MS = 45_000; // 45s per turn
export const GAME_TIME_MS = 15 * 60_000; // 15 min total
export const RECONNECT_WINDOW_MS = 5 * 60_000; // 5 min reconnect
export const GRACE_BEFORE_PAUSE_MS = 10_000; // 10s grace on disconnect
/* ---------- Bomb count ---------- */
export function bombCountForSize(size) {
    const table = {
        5: 3,
        6: 4,
        7: 5,
        8: 6,
        9: 7,
        10: 9,
    };
    return table[size] ?? Math.floor(size * 0.7);
}
export function validateSize(size) {
    return Number.isInteger(size) && size >= 5 && size <= 10;
}
/* ---------- Grid math ---------- */
export function indexToRC(index, size) {
    return { row: Math.floor(index / size), col: index % size };
}
export function rcToIndex(row, col, size) {
    return row * size + col;
}
export function isValidCell(row, col, size) {
    return row >= 0 && row < size && col >= 0 && col < size;
}
/* ---------- Bomb placement ---------- */
export function randomBombs(size, count) {
    const total = size * size;
    if (count > total)
        count = total;
    const result = new Set();
    while (result.size < count) {
        result.add(Math.floor(Math.random() * total));
    }
    return result;
}
export function validateBombs(bombs, size, expectedCount) {
    if (bombs.size !== expectedCount)
        return false;
    const total = size * size;
    for (const b of bombs) {
        if (!Number.isInteger(b) || b < 0 || b >= total)
            return false;
    }
    return true;
}
/* ---------- Room code ---------- */
export function generateRoomCode() {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
/* ---------- Turn ---------- */
export function opponentSeat(seat) {
    return seat === 0 ? 1 : 0;
}
export function hasWon(hits, opponentBombCount) {
    return hits >= opponentBombCount;
}
/* ---------- Formatting ---------- */
export function formatRemainingMs(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min === 0)
        return `${sec}s`;
    return `${min}m ${sec}s`;
}
