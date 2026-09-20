import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { LoadingScreen } from "./components/LoadingScreen";
import { Layout } from "./components/Layout";
import type { NavKey } from "./components/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { UsersPage } from "./pages/UsersPage";
import { UserDetailPage } from "./pages/UserDetailPage";
import { GamesPage } from "./pages/GamesPage";
import { GameDetailPage } from "./pages/GameDetailPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { LogsPage } from "./pages/LogsPage";
import { SystemPage } from "./pages/SystemPage";

const PAGE_TITLES: Record<NavKey, string> = {
  dashboard: "Dashboard",
  users: "Foydalanuvchilar",
  games: "O'yinlar",
  statistics: "Statistika",
  logs: "Audit Loglar",
  system: "Tizim holati",
};

export function App() {
  const { boot } = useAuth();
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  function handleNavChange(next: NavKey) {
    setSelectedUserId(null);
    setSelectedGameId(null);
    setNav(next);
  }

  if (boot.status === "booting") {
    return <LoadingScreen label="Tekshirilmoqda…" />;
  }

  if (boot.status === "unauthorized") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          textAlign: "center",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 56 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Ruxsat yo'q</h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            maxWidth: 360,
            lineHeight: 1.6,
          }}
        >
          {boot.message}
        </p>
      </div>
    );
  }

  if (boot.status === "error") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          textAlign: "center",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 56 }}>⚠</div>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Xatolik yuz berdi</h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            maxWidth: 360,
            lineHeight: 1.6,
          }}
        >
          {boot.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 12,
            padding: "10px 20px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent)",
            color: "#fff",
            fontWeight: 500,
            fontSize: 14,
            cursor: "pointer",
            border: "none",
            fontFamily: "inherit",
          }}
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  const title = (() => {
    if (nav === "users" && selectedUserId) return "Foydalanuvchi profili";
    if (nav === "games" && selectedGameId) return "O'yin tafsiloti";
    return PAGE_TITLES[nav];
  })();

  return (
    <Layout active={nav} onNavChange={handleNavChange} title={title}>
      {nav === "dashboard" && <DashboardPage />}

      {nav === "users" &&
        (selectedUserId ? (
          <UserDetailPage
            userId={selectedUserId}
            onBack={() => setSelectedUserId(null)}
          />
        ) : (
          <UsersPage onUserClick={setSelectedUserId} />
        ))}

      {nav === "games" &&
        (selectedGameId ? (
          <GameDetailPage
            gameId={selectedGameId}
            onBack={() => setSelectedGameId(null)}
          />
        ) : (
          <GamesPage onGameClick={setSelectedGameId} />
        ))}

      {nav === "statistics" && <StatisticsPage />}
      {nav === "logs" && <LogsPage />}
      {nav === "system" && <SystemPage />}
    </Layout>
  );
}