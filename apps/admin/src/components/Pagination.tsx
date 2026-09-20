/* ============================================================
   PAGINATION — Cursor-based (next/prev)
   ============================================================ */

export function Pagination({
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  current,
  total,
}: {
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  current: number;
  total?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        borderTop: "1px solid var(--border)",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: "var(--text-tertiary)",
        }}
      >
        Sahifa {current}
        {total !== undefined ? ` · Jami: ${total}` : ""}
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          style={btnStyle(!hasPrev)}
        >
          ← Oldingi
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          style={btnStyle(!hasNext)}
        >
          Keyingi →
        </button>
      </div>
    </div>
  );
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    height: 30,
    padding: "0 12px",
    borderRadius: "var(--radius-sm)",
    background: "var(--surface-elevated)",
    border: "1px solid var(--border)",
    color: disabled ? "var(--text-tertiary)" : "var(--text-primary)",
    fontSize: 12,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    fontFamily: "inherit",
  };
}