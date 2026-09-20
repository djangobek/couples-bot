import { useEffect, useState } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { LoadingScreen } from "../components/LoadingScreen";
import { Button } from "../components/Button";
import { HomePage } from "../pages/HomePage";
import { GamesPage } from "../pages/GamesPage";
import { OurWorldPage } from "../pages/OurWorldPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SettingsPage } from "../pages/SettingsPage";
import { JoinPage } from "../pages/JoinPage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { useApp } from "../context/AppContext";
import { SubscriptionGate } from "../features/subscription/SubscriptionGate";
import {
  getPendingInviteCode,
  clearPendingInviteCode,
  captureInitialBombCode,
  captureInitialTttCode,
  clearPendingBombCode,
  clearPendingTttCode,
  cleanUrl,
} from "../services/deep-link";
import type { TabKey } from "../types/domain";

export function App() {
  const { boot, isMember, reloadAll } = useApp();
  const [tab, setTab] = useState<TabKey>("home");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [bombCode, setBombCode] = useState<string | null>(null);
  const [tttCode, setTttCode] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const invite = getPendingInviteCode();
    if (invite) {
      setInviteCode(invite);
      return;
    }

    const bomb = captureInitialBombCode();
    if (bomb) {
      setBombCode(bomb);
      setTab("games");
      return;
    }

    const ttt = captureInitialTttCode();
    if (ttt) {
      setTttCode(ttt);
      setTab("games");
      return;
    }
  }, []);

  async function handleRetry() {
    setRetrying(true);
    try {
      await reloadAll();
    } finally {
      setRetrying(false);
    }
  }

  if (boot.status === "booting") {
    return <LoadingScreen label="Dunyongiz tayyorlanmoqda…" />;
  }

  if (boot.status === "error") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 20,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, opacity: 0.4 }}>⚠</div>
        <h1
          className="display-italic"
          style={{ fontSize: "var(--fs-2xl)", fontWeight: 500 }}
        >
          Nimadir xato ketdi.
        </h1>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            maxWidth: 320,
            lineHeight: 1.6,
          }}
        >
          {boot.message}
        </p>
        <Button
          variant="primary"
          size="md"
          loading={retrying}
          onClick={handleRetry}
        >
          Qayta urinish
        </Button>
      </div>
    );
  }

  /* ============================================================
     Invite flow — before subscription
     ============================================================ */
  if (inviteCode) {
    return (
      <JoinPage
        code={inviteCode}
        onJoined={() => {
          setInviteCode(null);
          clearPendingInviteCode();
          setTab("home");
        }}
        onBack={() => {
          setInviteCode(null);
          clearPendingInviteCode();
        }}
      />
    );
  }

  /* ============================================================
     Subscription GATE — blocks all app until subscribed
     ============================================================ */
  if (!isMember) {
    return (
      <SubscriptionGate>
        <OnboardingPage />
      </SubscriptionGate>
    );
  }

  /* ============================================================
     Settings page (as full screen)
     ============================================================ */
  if (showSettings) {
    return (
      <AppLayout
        active={tab}
        onTabChange={(t) => {
          setShowSettings(false);
          setTab(t);
        }}
        header={
          <button
            onClick={() => setShowSettings(false)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            ← Orqaga
          </button>
        }
      >
        <SettingsPage />
      </AppLayout>
    );
  }

  /* ============================================================
     Main app
     ============================================================ */
  return (
    <SubscriptionGate>
      <AppLayout
        active={tab}
        onTabChange={(t) => setTab(t)}
        header={<Header onSettings={() => setShowSettings(true)} />}
      >
        {tab === "home" && <HomePage />}
        {tab === "games" && (
          <GamesPage
            initialBombCode={bombCode}
            initialTttCode={tttCode}
            onBombCodeConsumed={() => {
              setBombCode(null);
              clearPendingBombCode();
              cleanUrl();
            }}
            onTttCodeConsumed={() => {
              setTttCode(null);
              clearPendingTttCode();
              cleanUrl();
            }}
          />
        )}
        {tab === "world" && <OurWorldPage />}
        {tab === "profile" && (
          <ProfilePage onOpenSettings={() => setShowSettings(true)} />
        )}
      </AppLayout>
    </SubscriptionGate>
  );
}

/* ============================================================
   Header — settings button
   ============================================================ */
function Header({ onSettings }: { onSettings: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        minHeight: 40,
      }}
    >
      <button
        onClick={onSettings}
        aria-label="Sozlamalar"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          color: "var(--text-secondary)",
          fontSize: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "inherit",
        }}
      >
        ⚙️
      </button>
    </div>
  );
}