/* ============================================================
   GAME FILTERS
   ============================================================ */

import type { GameType, GameSessionStatus } from "../../types/admin";

export function GameFilters({
  type,
  onTypeChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
}: {
  type: GameType | "";
  onTypeChange: (v: GameType | "") => void;
  status: GameSessionStatus | "";
  onStatusChange: (v: GameSessionStatus | "") => void;
  sort: string;
  onSortChange: (v: string) => void;
}) {
  return (
    <>
      <select
        value={type}
        onChange={(e) => onTypeChange(e.target.value as GameType | "")}
        style={selectStyle}
      >
        <option value="">Barcha turlar</option>
        <option value="BOMB">💣 Bomba</option>
        <option value="TIC_TAC_TOE">⭕ X-O</option>
      </select>

      <select
        value={status}
        onChange={(e) =>
          onStatusChange(e.target.value as GameSessionStatus | "")
        }
        style={selectStyle}
      >
        <option value="">Barcha holatlar</option>
        <option value="WAITING">Kutilmoqda</option>
        <option value="PLACING">Joylashtirish</option>
        <option value="PLAYING">O'ynalmoqda</option>
        <option value="PAUSED">To'xtatilgan</option>
        <option value="FINISHED">Tugagan</option>
        <option value="ABANDONED">Tashlab ketilgan</option>
        <option value="EXPIRED">Muddati o'tgan</option>
      </select>

      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        style={selectStyle}
      >
        <option value="createdAt:desc">Yangi</option>
        <option value="createdAt:asc">Eski</option>
        <option value="finishedAt:desc">Tugagan (yangi)</option>
        <option value="finishedAt:asc">Tugagan (eski)</option>
      </select>
    </>
  );
}

const selectStyle: React.CSSProperties = {
  height: 36,
  padding: "0 12px",
  borderRadius: "var(--radius-md)",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontFamily: "inherit",
  cursor: "pointer",
  outline: "none",
};