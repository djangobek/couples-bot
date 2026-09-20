import { hapticTap } from "../services/telegram";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
};

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  type = "button",
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const heights: Record<Size, number> = { sm: 36, md: 46, lg: 54 };
  const paddings: Record<Size, string> = {
    sm: "0 16px",
    md: "0 22px",
    lg: "0 28px",
  };
  const fontSizes: Record<Size, string> = {
    sm: "var(--fs-sm)",
    md: "var(--fs-base)",
    lg: "var(--fs-md)",
  };

  const variants: Record<Variant, React.CSSProperties> = {
    primary: {
      background:
        "linear-gradient(180deg, var(--accent-strong) 0%, var(--accent-deep) 100%)",
      color: "#fff",
      boxShadow:
        "0 1px 0 rgba(255,255,255,0.28) inset, 0 -1px 0 rgba(0,0,0,0.18) inset, 0 8px 24px var(--accent-glow)",
      textShadow: "0 1px 1px rgba(0,0,0,0.15)",
    },
    secondary: {
      background: "var(--surface-elevated)",
      color: "var(--text-primary)",
      boxShadow:
        "inset 0 0 0 1px var(--border-strong), 0 1px 0 rgba(255,255,255,0.04) inset",
    },
    outline: {
      background: "transparent",
      color: "var(--text-primary)",
      boxShadow: "inset 0 0 0 1.5px var(--border-strong)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-secondary)",
    },
    danger: {
      background:
        "linear-gradient(180deg, rgba(240,138,149,0.18), rgba(240,138,149,0.08))",
      color: "var(--danger)",
      boxShadow: "inset 0 0 0 1px rgba(240,138,149,0.3)",
    },
  };

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: heights[size],
    padding: paddings[size],
    borderRadius: "var(--radius-full)",
    fontFamily: "inherit",
    fontSize: fontSizes[size],
    fontWeight: 600,
    letterSpacing: "-0.005em",
    transition:
      "transform var(--dur-fast) var(--ease-spring), opacity var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out)",
    width: fullWidth ? "100%" : "auto",
    opacity: isDisabled ? 0.5 : 1,
    cursor: isDisabled ? "not-allowed" : "pointer",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    ...variants[variant],
    ...style,
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={
        isDisabled
          ? undefined
          : () => {
              hapticTap("light");
              onClick?.();
            }
      }
      style={base}
      className="no-select"
      onPointerDown={(e) => {
        if (isDisabled) return;
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)";
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
      onPointerLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
      onPointerCancel={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
    >
      {loading ? <Spinner size={size === "sm" ? 14 : 18} /> : children}
    </button>
  );
}

function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.35)",
        borderTopColor: "#fff",
        animation: "spin 0.7s linear infinite",
        display: "inline-block",
      }}
    />
  );
}