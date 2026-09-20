/* ============================================================
   TIC-TAC-TOE — Icon options
   ============================================================ */

export const X_ICONS = ["❌", "✖️", "✕", "✗", "×"] as const;
export const O_ICONS = ["⭕", "⚪", "◯", "○", "◉"] as const;

export type XIcon = (typeof X_ICONS)[number];
export type OIcon = (typeof O_ICONS)[number];

export function iconsFor(symbol: "X" | "O"): readonly string[] {
  return symbol === "X" ? X_ICONS : O_ICONS;
}

export function defaultIconFor(symbol: "X" | "O"): string {
  return symbol === "X" ? X_ICONS[0] : O_ICONS[0];
}

/* ---------- Board config (matches backend) ---------- */
export const BOARD_CONFIG: Record<
  number,
  { winLength: number; label: string; description: string }
> = {
  3: {
    winLength: 3,
    label: "Klassik",
    description: "3 ketma-ket",
  },
  4: {
    winLength: 4,
    label: "Keng",
    description: "4 ketma-ket",
  },
  5: {
    winLength: 4,
    label: "O'rta",
    description: "4 ketma-ket",
  },
  6: {
    winLength: 4,
    label: "Katta",
    description: "4 ketma-ket",
  },
  7: {
    winLength: 5,
    label: "Ulkan",
    description: "5 ketma-ket",
  },
};

export const VALID_SIZES = [3, 4, 5, 6, 7] as const;
export type ValidSize = (typeof VALID_SIZES)[number];