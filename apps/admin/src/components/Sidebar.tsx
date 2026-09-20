/* ============================================================
   SIDEBAR — Navigation
   ============================================================ */

export type NavKey =
  | "dashboard"
  | "users"
  | "games"
  | "statistics"
  | "logs"
  | "system";

type NavItem = {
  key: NavKey;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "users", label: "Foydalanuvchilar", icon: "👥" },
  { key: "games", label: "O'yinlar", icon: "🎮" },
  { key: "statistics", label: "Statistika", icon: "📈" },
  { key: "logs", label: "Audit Loglar", icon: "📋" },
  { key: "system", label: "Tizim", icon: "⚙️" },
];

export function Sidebar({
  active,
  onChange,
  collapsed,
}: {
  active: NavKey;
  onChange: (k: NavKey) => void;
  collapsed?: boolean;
}) {
  return (
    <aside
      style={{
        width: collapsed ? 64 : "var(--sidebar-width)",
        flexShrink: 0,
        height: "100vh",
        background: "var(--bg-subtle)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 220ms var(--ease-out)",
        position: "sticky",
        top: 0,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: "var(--topbar-height)",
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "0 20px" : "0 20px",
          borderBottom: "1px solid var(--border)",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--radius-sm)",
            background: "linear-gradient(135deg, var(--accent), var(--accent-strong))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: "#fff",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          C
        </div>
        {!collapsed && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            Couples Admin
          </span>
        )}
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "10px 12px" : "10px 12px",
                borderRadius: "var(--radius-md)",
                background: isActive ? "var(--accent-soft)" : "transparent",
                color: isActive ? "var(--accent-strong)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 140ms var(--ease-out), color 140ms var(--ease-out)",
                width: "100%",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div
          style={{
            padding: 16,
            borderTop: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--text-tertiary)",
          }}
        >
          v0.1.0 · Couples Platform
        </div>
      )}
    </aside>
  );
}