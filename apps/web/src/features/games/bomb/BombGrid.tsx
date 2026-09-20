import { memo, useEffect, useRef, useState } from "react";
import { hapticTap } from "../../../services/telegram";

type Cell = {
  index: number;
  disabled?: boolean;
  hasBomb?: boolean;
  revealed?: boolean;
  hit?: boolean;
  isMyGrid?: boolean;
};

type CellProps = {
  cell: Cell;
  size: number;
  interactive: boolean;
  isLastMove: boolean;
  revealAll: boolean;
  onClick?: (index: number) => void;
};

/* ============================================================
   Individual Cell — memoized
   ============================================================ */
const Cell = memo(function Cell({
  cell,
  size,
  interactive,
  isLastMove,
  revealAll,
  onClick,
}: CellProps) {
  const disabled = cell.disabled || !interactive;

  const isRevealed = cell.revealed ?? false;
  const isHit = cell.hit ?? false;
  const hasBomb = cell.hasBomb ?? false;
  const isMyGrid = cell.isMyGrid ?? false;

  let bg = "var(--surface-elevated)";
  let borderColor = "var(--border)";
  let color = "var(--text-tertiary)";
  let content: React.ReactNode = "";
  let extraClass = "";

  if (isMyGrid) {
    /* ===== MY GRID ===== */
    if (isRevealed && isHit) {
      /* Opponent found my bomb */
      bg =
        "linear-gradient(135deg, rgba(240,138,149,0.32), rgba(240,138,149,0.15))";
      borderColor = "rgba(240,138,149,0.6)";
      color = "var(--danger)";
      content = "✕";
      extraClass = "cell-hit-x";
    } else if (isRevealed) {
      bg = "var(--bg-subtle)";
      borderColor = "var(--border)";
      color = "var(--text-tertiary)";
      content = "·";
    } else if (hasBomb) {
      bg =
        "linear-gradient(135deg, var(--accent-soft), var(--violet-soft))";
      borderColor = "var(--border-accent)";
      content = "💣";
      extraClass = "cell-bomb-hidden";
    }
  } else {
    /* ===== OPPONENT GRID ===== */
    if (isRevealed && isHit) {
      /* I found opponent's bomb */
      bg =
        "linear-gradient(135deg, rgba(240,138,149,0.35), rgba(255,180,150,0.18))";
      borderColor = "rgba(240,138,149,0.7)";
      color = "var(--danger)";
      content = "💥";
      extraClass = "cell-opp-hit";
    } else if (isRevealed) {
      bg = "var(--bg-subtle)";
      borderColor = "var(--border)";
      color = "var(--text-tertiary)";
      content = "·";
    } else if (revealAll && hasBomb) {
      /* On game over — reveal unclicked bombs */
      bg =
        "linear-gradient(135deg, rgba(232,165,192,0.14), rgba(180,155,216,0.08))";
      borderColor = "var(--border-accent)";
      content = "💣";
      extraClass = "cell-bomb-revealed";
    }
  }

  const fontSize = Math.max(14, Math.min(26, 400 / size / 1.6));

  return (
    <button
      onClick={
        disabled || !onClick
          ? undefined
          : () => {
              hapticTap("light");
              onClick(cell.index);
            }
      }
      disabled={disabled}
      className={`bomb-cell ${extraClass} ${isLastMove ? "cell-flash" : ""}`}
      style={{
        aspectRatio: "1 / 1",
        borderRadius: 8,
        background: bg,
        border: `1px solid ${borderColor}`,
        color,
        fontSize,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        position: "relative",
        padding: 0,
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
        transition:
          "background 180ms ease-out, border-color 180ms ease-out, transform 180ms ease-out",
      }}
      aria-label={`Katak ${cell.index + 1}`}
    >
      {content}
    </button>
  );
});

/* ============================================================
   Grid container
   ============================================================ */
export function BombGrid({
  size,
  cells,
  onCellClick,
  interactive,
  highlightLast,
  revealAll = false,
}: {
  size: number;
  cells: Cell[];
  onCellClick?: (index: number) => void;
  interactive: boolean;
  highlightLast?: number | null;
  revealAll?: boolean;
}) {
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const lastHighlightRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      highlightLast !== null &&
      highlightLast !== undefined &&
      highlightLast !== lastHighlightRef.current
    ) {
      lastHighlightRef.current = highlightLast;
      setFlashIndex(highlightLast);
      const t = window.setTimeout(() => setFlashIndex(null), 700);
      return () => window.clearTimeout(t);
    }
  }, [highlightLast]);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gap: 5,
          padding: 5,
          borderRadius: 16,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          width: "100%",
          maxWidth: 400,
          margin: "0 auto",
        }}
      >
        {cells.map((cell) => (
          <Cell
            key={cell.index}
            cell={cell}
            size={size}
            interactive={interactive}
            isLastMove={flashIndex === cell.index}
            revealAll={revealAll}
            onClick={onCellClick}
          />
        ))}
      </div>

      <style>
        {`
          @keyframes cellFlash {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 var(--accent-glow);
            }
            30% {
              transform: scale(1.12);
              box-shadow: 0 0 0 3px var(--accent), 0 0 20px var(--accent-glow);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 transparent;
            }
          }
          @keyframes cellHitXPulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(240,138,149,0.8);
            }
            40% {
              transform: scale(1.08);
              box-shadow: 0 0 0 4px rgba(240,138,149,0.4);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(240,138,149,0);
            }
          }
          @keyframes cellOppHitBurst {
            0% {
              transform: scale(0.85);
              box-shadow: 0 0 0 0 rgba(255,180,150,0.9);
            }
            25% {
              transform: scale(1.22);
              box-shadow:
                0 0 0 6px rgba(255,180,150,0.55),
                0 0 24px rgba(255,180,150,0.85);
            }
            60% {
              transform: scale(1.04);
              box-shadow:
                0 0 0 3px rgba(240,138,149,0.4),
                0 0 16px rgba(240,138,149,0.6);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(240,138,149,0);
            }
          }
          @keyframes bombHiddenPulse {
            0%, 100% {
              filter: brightness(1);
              transform: scale(1);
            }
            50% {
              filter: brightness(1.22);
              transform: scale(1.03);
            }
          }
          @keyframes bombRevealed {
            0% {
              transform: scale(0.6);
              opacity: 0;
            }
            60% {
              transform: scale(1.15);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          .bomb-cell.cell-flash {
            animation: cellFlash 650ms cubic-bezier(0.16,1,0.3,1) forwards;
            z-index: 5;
            will-change: transform, box-shadow;
          }
          .bomb-cell.cell-hit-x {
            animation: cellHitXPulse 900ms cubic-bezier(0.16,1,0.3,1);
          }
          .bomb-cell.cell-opp-hit {
            animation: cellOppHitBurst 750ms cubic-bezier(0.16,1,0.3,1);
            z-index: 6;
            will-change: transform, box-shadow;
          }
          .bomb-cell.cell-bomb-hidden {
            animation: bombHiddenPulse 2.4s ease-in-out infinite;
          }
          .bomb-cell.cell-bomb-revealed {
            animation: bombRevealed 500ms cubic-bezier(0.16,1,0.3,1) forwards;
          }
        `}
      </style>
    </>
  );
}