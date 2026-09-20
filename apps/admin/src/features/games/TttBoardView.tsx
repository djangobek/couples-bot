/* ============================================================
   TTT BOARD VIEW — read-only board for admin
   ============================================================ */

export function TttBoardView({
  board,
  size,
  winningLine,
}: {
  board: (string | null)[];
  size: number;
  winningLine?: number[] | null;
}) {
  if (!board || board.length === 0) {
    return (
      <div
        style={{
          padding: 20,
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-tertiary)",
        }}
      >
        Maydon mavjud emas
      </div>
    );
  }

  const winningSet = new Set(winningLine ?? []);

  /* Cell size — smaller for larger boards */
  const cellSize = Math.max(28, Math.min(56, 360 / size));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
        gap: 4,
        padding: 6,
        borderRadius: "var(--radius-md)",
        background: "var(--bg-subtle)",
        border: "1px solid var(--border)",
        width: "fit-content",
      }}
    >
      {board.map((cell, i) => {
        const isWinning = winningSet.has(i);
        return (
          <div
            key={i}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: "var(--radius-sm)",
              background: isWinning
                ? "var(--success-soft)"
                : "var(--surface)",
              border: `1.5px solid ${isWinning ? "var(--success)" : "var(--border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: cellSize * 0.5,
              fontWeight: 700,
              color:
                cell === "X"
                  ? "var(--accent-strong)"
                  : cell === "O"
                    ? "var(--success)"
                    : "var(--text-tertiary)",
            }}
          >
            {cell ?? ""}
          </div>
        );
      })}
    </div>
  );
}