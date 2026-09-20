/* ============================================================
   GAMES BY TYPE BAR — simple bar chart
   ============================================================ */

import { formatNumber } from "../../lib/format";
import type { GameType } from "../../types/admin";

const TYPE_LABELS: Record<GameType, string> = {
  BOMB: "💣 Bomba",
  TIC_TAC_TOE: "⭕ X-O",
};

const TYPE_COLORS: Record<GameType, string> = {
  BOMB: "var(--accent)",
  TIC_TAC_TOE: "#22c55e",
};

export function GamesByTypeBar({
  byType,
}: {
  byType: Array<{ type: GameType; count: number }>;
}) {
  if (byType.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px dashed var(--border-strong)",
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-tertiary)",
        }}
      >
        Hali o'yin yo'q
      </div>
    );
  }

  const total = byType.reduce((sum, t) => sum + t.count, 0);
  const sorted = [...byType].sort((a, b) => b.count - a.count);

  return (
    <div
      style={{
        padding: 16,
        borderRadius: "var(--radius-lg)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {sorted.map((t) => {
        const pct = total > 0 ? (t.count / total) * 100 : 0;
        return (
          <div
            key={t.type}
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 8,
                fontSize: 12,
              }}
            >
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                {TYPE_LABELS[t.type] ?? t.type}
              </span>
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatNumber(t.count)} · {pct.toFixed(1)}%
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: "var(--bg-subtle)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: TYPE_COLORS[t.type] ?? "var(--accent)",
                  borderRadius: 4,
                  transition: "width 400ms var(--ease-out)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}