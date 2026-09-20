/* ============================================================
   AVATAR
   ============================================================ */

import { useState } from "react";

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
  size = 32,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        background:
          "linear-gradient(135deg, var(--accent-soft), var(--accent-soft))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(10, Math.floor(size * 0.4)),
        fontWeight: 600,
        color: "var(--accent-strong)",
        boxShadow: "inset 0 0 0 1px var(--border)",
      }}
    >
      {showImage ? (
        <img
          src={src ?? ""}
          alt={name ?? ""}
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
  );
}