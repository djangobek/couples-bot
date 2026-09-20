import { memo } from "react";
import { hapticTap } from "../../../services/telegram";
import type { TttCell, TttBoardSize } from "./tictactoe-types";

/* ============================================================
   Cell — memoized
   ============================================================ */
type CellProps = {
  index: number;
  value: TttCell;
  iconX: string;
  iconO: string;
  onClick?: (index: number) => void;
  disabled: boolean;
  isWinning: boolean;
  isLastMove: boolean;
  size: TttBoardSize;
};

const Cell = memo(function Cell({
  index,
  value,
  iconX,
  iconO,
  onClick,
  disabled,
  isWinning,
  isLastMove,
  size,
}: CellProps) {
  const isX = value === "X";
  const isEmpty = value === null;

  const icon = isX ? iconX : iconO;
  const color = isX
    ? "var(--accent)"
    : value === "O"
      ? "var(--violet)"
      : "var(--text-tertiary)";

  /* Compute fontSize based on board size for perfect fit */
  const fontSizeMap: Record<number, number> = {
    3: 56,
    4: 46,
    5: 38,
    6: 32,
    7: 27,
  };
  const fontSize = fontSizeMap[size] ?? 40;

  return (
    <button
      onClick={
        disabled || !isEmpty || !onClick
          ? undefined
          : () => {
              hapticTap("light");
              onClick(index);
            }
      }
      disabled={disabled || !isEmpty}
      className={[
        "ttt-cell",
        isWinning ? "ttt-cell-win" : "",
        isLastMove ? "ttt-cell-flash" : "",
        isEmpty ? "" : "ttt-cell-filled",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        aspectRatio: "1 / 1",
        borderRadius: 14,
        background: isWinning
          ? "linear-gradient(135deg, rgba(232,165,192,0.22), rgba(180,155,216,0.14))"
          : "var(--surface-elevated)",
        border: `1.5px solid ${
          isWinning
            ? "var(--border-accent)"
            : "var(--border)"
        }`,
        color,
        fontSize,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor:
          disabled || !isEmpty ? "default" : "pointer",
        padding: 0,
        position: "relative",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
        transition:
          "background 200ms ease-out, border-color 200ms ease-out, transform 200ms ease-out",
        willChange: isLastMove || isWinning ? "transform, box-shadow" : "auto",
      }}
      aria-label={`Cell ${index + 1}${value ? ` (${value})` : ""}`}
    >
      {!isEmpty && (
        <span
          className={
            isX ? "ttt-mark-x" : "ttt-mark-o"
          }
          style={{
            display: "inline-block",
            lineHeight: 1,
          }}
        >
          {icon}
        </span>
      )}
    </button>
  );
});

/* ============================================================
   Grid
   ============================================================ */
export function TttGrid({
  size,
  board,
  onCellClick,
  interactive,
  winningLine,
  lastMove,
  iconX,
  iconO,
}: {
  size: TttBoardSize;
  board: TttCell[];
  onCellClick?: (index: number) => void;
  interactive: boolean;
  winningLine: number[] | null;
  lastMove: number | null;
  iconX: string;
  iconO: string;
}) {
  const winningSet = new Set(winningLine ?? []);

  return (
    <>
      <div
        className="ttt-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gap: size <= 4 ? 8 : size <= 5 ? 6 : 5,
          padding: size <= 4 ? 10 : 8,
          borderRadius: 22,
          background:
            "radial-gradient(circle at 50% 0%, rgba(232,165,192,0.06), transparent 60%), var(--surface)",
          border: "1px solid var(--border)",
          width: "100%",
          maxWidth: 440,
          margin: "0 auto",
          boxShadow: "var(--shadow-lg)",
          /* Prevent layout shift on cell fill */
          contain: "layout style",
        }}
      >
        {board.map((cell, i) => (
          <Cell
            key={i}
            index={i}
            value={cell}
            iconX={iconX}
            iconO={iconO}
            onClick={onCellClick}
            disabled={!interactive}
            isWinning={winningSet.has(i)}
            isLastMove={lastMove === i}
            size={size}
          />
        ))}
      </div>

      <style>
        {`
          /* ---------- Mark appearance ---------- */
          @keyframes tttMarkX {
            0% {
              transform: scale(0) rotate(-135deg);
              opacity: 0;
            }
            60% {
              transform: scale(1.15) rotate(10deg);
              opacity: 1;
            }
            100% {
              transform: scale(1) rotate(0);
              opacity: 1;
            }
          }
          @keyframes tttMarkO {
            0% {
              transform: scale(0.2);
              opacity: 0;
            }
            60% {
              transform: scale(1.12);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          .ttt-mark-x {
            animation: tttMarkX 380ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            color: var(--accent);
            filter: drop-shadow(0 0 12px var(--accent-glow));
          }
          .ttt-mark-o {
            animation: tttMarkO 380ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            color: var(--violet);
            filter: drop-shadow(0 0 12px rgba(180,155,216,0.45));
          }

          /* ---------- Last move flash ---------- */
          @keyframes tttCellFlash {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 var(--accent-glow);
            }
            40% {
              transform: scale(1.06);
              box-shadow: 0 0 0 4px var(--accent-glow);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 transparent;
            }
          }
          .ttt-cell-flash {
            animation: tttCellFlash 500ms cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 4;
          }

          /* ---------- Winning cells ---------- */
          @keyframes tttWinPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow:
                inset 0 0 0 1.5px var(--border-accent),
                0 0 0 0 var(--accent-glow);
            }
            50% {
              transform: scale(1.06);
              box-shadow:
                inset 0 0 0 1.5px var(--border-accent),
                0 0 0 12px transparent;
            }
          }
          .ttt-cell-win {
            animation: tttWinPulse 1.6s ease-in-out infinite;
            z-index: 5;
          }
          .ttt-cell-win .ttt-mark-x {
            animation: tttMarkX 380ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
              tttWinGlow 1.6s ease-in-out infinite;
          }
          .ttt-cell-win .ttt-mark-o {
            animation: tttMarkO 380ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
              tttWinGlow 1.6s ease-in-out infinite;
          }
          @keyframes tttWinGlow {
            0%, 100% {
              filter: drop-shadow(0 0 12px var(--accent-glow));
            }
            50% {
              filter: drop-shadow(0 0 22px var(--accent-glow));
            }
          }

          /* ---------- Grid mount ---------- */
          @keyframes tttGridIn {
            0% {
              opacity: 0;
              transform: scale(0.95);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          .ttt-grid {
            animation: tttGridIn 400ms cubic-bezier(0.16, 1, 0.3, 1);
          }

          /* ---------- Reduced motion ---------- */
          @media (prefers-reduced-motion: reduce) {
            .ttt-mark-x,
            .ttt-mark-o,
            .ttt-cell-flash,
            .ttt-cell-win,
            .ttt-cell-win .ttt-mark-x,
            .ttt-cell-win .ttt-mark-o,
            .ttt-grid {
              animation: none !important;
            }
          }
        `}
      </style>
    </>
  );
}