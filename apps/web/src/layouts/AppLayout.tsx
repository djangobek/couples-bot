import { BottomNav } from "../components/BottomNav";
import type { TabKey } from "../types/domain";

type AppLayoutProps = {
  active: TabKey;
  onTabChange: (t: TabKey) => void;
  header?: React.ReactNode;
  children: React.ReactNode;
};

export function AppLayout({
  active,
  onTabChange,
  header,
  children,
}: AppLayoutProps) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        paddingTop: "var(--safe-top)",
      }}
    >
      {header && (
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            padding: "16px 20px 12px",
            background:
              "linear-gradient(to bottom, rgba(10,7,9,0.85) 60%, transparent)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
          }}
        >
          <div
            style={{
              maxWidth: "var(--content-max)",
              margin: "0 auto",
            }}
          >
            {header}
          </div>
        </header>
      )}

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "var(--content-max)",
          margin: "0 auto",
          padding: "8px 20px",
          paddingBottom: "calc(var(--nav-height) + var(--safe-bottom) + 40px)",
          animation: "fadeIn var(--dur-base) var(--ease-out)",
        }}
      >
        {children}
      </main>

      <BottomNav active={active} onChange={onTabChange} />
    </div>
  );
}