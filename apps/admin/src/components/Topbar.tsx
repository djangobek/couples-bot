/* ============================================================
   TOPBAR — Theme toggle + user
   ============================================================ */

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./Avatar";

export function Topbar({ title }: { title: string }) {
  const { theme, toggle } = useTheme();
  const { me } = useAuth();

  return (
    <header
      style={{
        height: "var(--topbar-height)",
        padding: "0 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <h1
        style={{
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={toggle}
          aria-label="Theme toggle"
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--radius-md)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            cursor: "pointer",
            transition: "background 140ms var(--ease-out)",
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {me && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "4px 12px 4px 4px",
              borderRadius: "var(--radius-full)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <Avatar
              src={me.photoUrl}
              name={me.firstName}
              size={26}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
              }}
            >
              {me.firstName ?? me.username ?? "Admin"}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}