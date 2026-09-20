import { useState } from "react";
import { hapticTap } from "../services/telegram";

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: number;
  ring?: boolean;
  onClick?: () => void;
};

function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  name,
  size = 44,
  ring = false,
  onClick,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  const ringWidth = 2;
  const ringGap = 2;

  return (
    <div
      onClick={
        onClick
          ? () => {
              hapticTap("light");
              onClick();
            }
          : undefined
      }
      className="no-select"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        borderRadius: "50%",
      }}
    >
      {/* Gradient ring */}
      {ring && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -ringWidth - ringGap,
            borderRadius: "50%",
            padding: ringWidth,
            background:
              "conic-gradient(from 210deg, var(--accent), var(--violet), var(--accent))",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - " +
              ringWidth +
              "px), #000 calc(100% - " +
              ringWidth +
              "px))",
            mask:
              "radial-gradient(farthest-side, transparent calc(100% - " +
              ringWidth +
              "px), #000 calc(100% - " +
              ringWidth +
              "px))",
            opacity: 0.85,
          }}
        />
      )}

      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, var(--accent-soft), var(--violet-soft))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-primary)",
          fontWeight: 600,
          fontSize: Math.max(11, Math.floor(size * 0.36)),
          letterSpacing: "-0.01em",
          boxShadow: ring ? "none" : "inset 0 0 0 1px var(--border-strong)",
        }}
      >
        {showImage ? (
          <img
            src={src ?? ""}
            alt={name ?? "avatar"}
            onError={() => setFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <span>{initials(name)}</span>
        )}
      </div>
    </div>
  );
}