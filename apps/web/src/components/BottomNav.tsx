import { hapticSelection } from "../services/telegram";
import type { TabKey } from "../types/domain";

type NavItem = {
  key: TabKey;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

const items: NavItem[] = [
  { key: "home", label: "Home", icon: (a) => <IconHome active={a} /> },
  { key: "games", label: "Games", icon: (a) => <IconGames active={a} /> },
  { key: "world", label: "Our World", icon: (a) => <IconWorld active={a} /> },
  { key: "profile", label: "Profile", icon: (a) => <IconProfile active={a} /> },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const activeIndex = items.findIndex((it) => it.key === active);

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        paddingBottom: "var(--safe-bottom)",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 8,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: "var(--content-max)",
          margin: "0 auto",
          pointerEvents: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          height: 64,
          alignItems: "stretch",
          background:
            "linear-gradient(180deg, rgba(30, 24, 32, 0.72), rgba(22, 18, 23, 0.92))",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid var(--border-strong)",
          borderRadius: 22,
          boxShadow:
            "0 12px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Active indicator pill */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 6,
            left: `calc(${(activeIndex * 100) / items.length}% + 8px)`,
            width: `calc(${100 / items.length}% - 16px)`,
            height: 52,
            borderRadius: 16,
            background:
              "linear-gradient(180deg, rgba(232, 165, 192, 0.14), rgba(232, 165, 192, 0.04))",
            boxShadow:
              "inset 0 0 0 1px var(--border-accent), 0 4px 14px rgba(232, 165, 192, 0.16)",
            transition:
              "left var(--dur-slow) var(--ease-spring)",
            pointerEvents: "none",
          }}
        />

        {items.map((it) => {
          const isActive = it.key === active;
          return (
            <button
              key={it.key}
              onClick={() => {
                if (isActive) return;
                hapticSelection();
                onChange(it.key);
              }}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                background: "none",
                border: "none",
                color: isActive ? "var(--accent)" : "var(--text-tertiary)",
                transition: "color var(--dur-base) var(--ease-out)",
                padding: 0,
                zIndex: 1,
              }}
              aria-label={it.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 26,
                  height: 26,
                  transform: isActive ? "scale(1.05)" : "scale(1)",
                  transition: "transform var(--dur-base) var(--ease-spring)",
                }}
              >
                {it.icon(isActive)}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: "0.01em",
                  transition: "font-weight var(--dur-fast) var(--ease-out)",
                }}
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------- Icons ---------- */
type IconProps = { active: boolean; size?: number };

function IconBase({
  active,
  size = 22,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transition: "stroke-width var(--dur-fast) var(--ease-out)",
      }}
    >
      {children}
    </svg>
  );
}

function IconHome({ active, size }: IconProps) {
  return (
    <IconBase active={active} size={size}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </IconBase>
  );
}

function IconGames({ active, size }: IconProps) {
  return (
    <IconBase active={active} size={size}>
      <rect x="3" y="8" width="18" height="11" rx="3" />
      <path d="M8 12v3M6.5 13.5h3" />
      <circle cx="16" cy="13" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18" cy="15" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function IconWorld({ active, size }: IconProps) {
  return (
    <IconBase active={active} size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z" />
    </IconBase>
  );
}

function IconProfile({ active, size }: IconProps) {
  return (
    <IconBase active={active} size={size}>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" />
    </IconBase>
  );
}