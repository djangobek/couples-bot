/* ============================================================
   ThemeSwitcher — dark/light toggle
   ============================================================ */

import { useTheme } from "../../context/ThemeContext";

export function ThemeSwitcher() {
  const { theme, toggle } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: 4,
        borderRadius: "var(--radius-md)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {(["dark", "light"] as const).map((t) => {
        const active = theme === t;
        return (
          <button
            key={t}
            onClick={() => {
              if (!active) toggle();
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              background: active ? "var(--accent-soft)" : "transparent",
              border: `1px solid ${active ? "var(--border-accent)" : "transparent"}`,
              color: active ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 140ms var(--ease-out)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span>{t === "dark" ? "🌙" : "☀️"}</span>
            <span>{t === "dark" ? "Tungi" : "Kunduzgi"}</span>
          </button>
        );
      })}
    </div>
  );
}