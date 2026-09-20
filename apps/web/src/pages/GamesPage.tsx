import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import { ChallengeList } from "../features/challenges/ChallengeList";
import { CreateChallengeModal } from "../features/challenges/CreateChallengeModal";
import { ChallengeProgressModal } from "../features/challenges/ProgressModal";
import { BombLobby } from "../features/games/bomb/BombLobby";
import { BombCreateModal } from "../features/games/bomb/BombCreateModal";
import { BombGame } from "../features/games/bomb/BombGame";
import { BombHistory } from "../features/games/bomb/BombHistory";
import { TttLobby } from "../features/games/tictactoe/TttLobby";
import { TttCreateModal } from "../features/games/tictactoe/TttCreateModal";
import { TttGame } from "../features/games/tictactoe/TttGame";
import { TttHistory } from "../features/games/tictactoe/TttHistory";
import { useToast } from "../hooks/useToast";
import {
  hapticTap,
  hapticSelection,
  hapticNotify,
} from "../services/telegram";
import type { ChallengeItem } from "../types/api";

type Tab = "challenges" | "games" | "bomb" | "tictactoe";

export function GamesPage({
  initialBombCode,
  initialTttCode,
  onBombCodeConsumed,
  onTttCodeConsumed,
}: {
  initialBombCode?: string | null;
  initialTttCode?: string | null;
  onBombCodeConsumed?: () => void;
  onTttCodeConsumed?: () => void;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("challenges");
  const [createOpen, setCreateOpen] = useState(false);
  const [progressChallenge, setProgressChallenge] =
    useState<ChallengeItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [bombCreateOpen, setBombCreateOpen] = useState(false);
  const [activeBombRoom, setActiveBombRoom] = useState<string | null>(null);

  const [tttCreateOpen, setTttCreateOpen] = useState(false);
  const [activeTttRoom, setActiveTttRoom] = useState<string | null>(null);

  /* ------------------------------------------------------------
     StrictMode-safe: refs faqat bir marta ishlashini ta'minlaydi
     ------------------------------------------------------------ */
  const bombHandledRef = useRef<string | null>(null);
  const tttHandledRef = useRef<string | null>(null);

  /* ============ Deep-link: bomb ============ */
  useEffect(() => {
    if (!initialBombCode) return;
    const code = initialBombCode.toUpperCase();

    /* Agar bu kod allaqachon ishlangan bo'lsa — qayta ishlamaymiz */
    if (bombHandledRef.current === code) return;
    bombHandledRef.current = code;

    setTab("bomb");
    setActiveBombRoom(code);
    hapticNotify("success");

    /* URL ni tozalash — lekin sessionStorage ni SAQLAB qolamiz */
    onBombCodeConsumed?.();
  }, [initialBombCode, onBombCodeConsumed]);

  /* ============ Deep-link: tictactoe ============ */
  useEffect(() => {
    if (!initialTttCode) return;
    const code = initialTttCode.toUpperCase();

    if (tttHandledRef.current === code) return;
    tttHandledRef.current = code;

    setTab("tictactoe");
    setActiveTttRoom(code);
    hapticNotify("success");

    onTttCodeConsumed?.();
  }, [initialTttCode, onTttCodeConsumed]);

  function bump() {
    setRefreshKey((k) => k + 1);
  }

  /* ============ Full-screen games ============ */
  if (activeBombRoom) {
    return (
      <BombGame
        roomCode={activeBombRoom}
        onExit={() => {
          setActiveBombRoom(null);
          bump();
        }}
      />
    );
  }

  if (activeTttRoom) {
    return (
      <TttGame
        roomCode={activeTttRoom}
        onExit={() => {
          setActiveTttRoom(null);
          bump();
        }}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        paddingTop: 8,
      }}
    >
      <section style={{ animation: "fadeInUp 500ms var(--ease-out)" }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          O'yinlar
        </p>
        <h1
          className="display-italic"
          style={{
            fontSize: "clamp(2.5rem, 9vw, 3.25rem)",
            color: "var(--text-primary)",
            marginBottom: 12,
          }}
        >
          Birga o'ynang.
        </h1>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            maxWidth: 340,
            lineHeight: 1.6,
          }}
        >
          Bellashing, kuling, bir-biringizni yaxshiroq biling.
        </p>
      </section>

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          padding: 4,
          borderRadius: "var(--radius-full)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          alignSelf: "flex-start",
          animation: "fadeInUp 500ms var(--ease-out) 60ms backwards",
          overflowX: "auto",
          maxWidth: "100%",
          gap: 2,
        }}
      >
        {[
          { key: "challenges" as const, label: "Challenge", emoji: "🎯" },
          { key: "games" as const, label: "O'yinlar", emoji: "🎮" },
          { key: "bomb" as const, label: "Bomba", emoji: "💣" },
          { key: "tictactoe" as const, label: "X-O", emoji: "⭕" },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                hapticSelection();
                setTab(t.key);
              }}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-full)",
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#fff" : "var(--text-secondary)",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                transition: "all var(--dur-base) var(--ease-out)",
                boxShadow: active ? "0 4px 14px var(--accent-glow)" : "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content — key faqat tab, refreshKey EMAS */}
      <div key={tab} style={{ animation: "fadeInUp 400ms var(--ease-out)" }}>
        {tab === "challenges" && (
          <ChallengeList
            onCreateClick={() => setCreateOpen(true)}
            onProgressClick={(c) => setProgressChallenge(c)}
          />
        )}

        {tab === "games" && <GamesGrid toast={toast} />}

        {tab === "bomb" && (
          <>
            <BombLobby
              key={`bomb-lobby-${refreshKey}`}
              onCreateClick={() => setBombCreateOpen(true)}
              onJoinGame={(code) => setActiveBombRoom(code)}
            />
            <div style={{ marginTop: 32 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <p className="eyebrow" style={{ margin: 0 }}>
                  Bomba tarixi
                </p>
                <button
                  onClick={bump}
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--accent)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Yangilash
                </button>
              </div>
              <BombHistory refreshKey={refreshKey} />
            </div>
          </>
        )}

        {tab === "tictactoe" && (
          <>
            <TttLobby
              key={`ttt-lobby-${refreshKey}`}
              onCreateClick={() => setTttCreateOpen(true)}
              onJoinGame={(code) => setActiveTttRoom(code)}
            />
            <div style={{ marginTop: 32 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <p className="eyebrow" style={{ margin: 0 }}>
                  X-O tarixi
                </p>
                <button
                  onClick={bump}
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--accent)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Yangilash
                </button>
              </div>
              <TttHistory refreshKey={refreshKey} />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <CreateChallengeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={bump}
      />
      <ChallengeProgressModal
        challenge={progressChallenge}
        open={progressChallenge !== null}
        onClose={() => setProgressChallenge(null)}
        onSaved={bump}
      />
      <BombCreateModal
        open={bombCreateOpen}
        onClose={() => setBombCreateOpen(false)}
        onCreated={(code) => setActiveBombRoom(code)}
      />
      <TttCreateModal
        open={tttCreateOpen}
        onClose={() => setTttCreateOpen(false)}
        onCreated={(code) => setActiveTttRoom(code)}
      />
    </div>
  );
}

/* ============================================================
   Games grid
   ============================================================ */
type Game = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  gradient: string;
};

const GAMES: Game[] = [
  {
    id: "truth-dare",
    emoji: "🎭",
    title: "Haqiqat yoki Jasorat",
    subtitle: "Ochish. Tan olish. O'ynash.",
    gradient: "linear-gradient(135deg, #e8a5c0, #b49bd8)",
  },
  {
    id: "would-rather",
    emoji: "🤔",
    title: "Yaxshiroq qaysi?",
    subtitle: "Ikki tanlov. Bir sen.",
    gradient: "linear-gradient(135deg, #b49bd8, #8b6fd4)",
  },
  {
    id: "who-knows",
    emoji: "🧠",
    title: "Meni kim yaxshi biladi?",
    subtitle: "Jufting seni qanchalik biladi?",
    gradient: "linear-gradient(135deg, #e8a5c0, #f0b8cd)",
  },
  {
    id: "compatibility",
    emoji: "💞",
    title: "Moslik testi",
    subtitle: "Qanchalik chuqur mos kelasan?",
    gradient: "linear-gradient(135deg, #f0b8cd, #e8a5c0)",
  },
  {
    id: "emoji-guess",
    emoji: "😀",
    title: "Emoji topish",
    subtitle: "Emoji orqali so'z toping",
    gradient: "linear-gradient(135deg, #b49bd8, #e8a5c0)",
  },
  {
    id: "fast-questions",
    emoji: "⚡",
    title: "Tezkor savollar",
    subtitle: "30 soniyada javob ber",
    gradient: "linear-gradient(135deg, #8b6fd4, #b49bd8)",
  },
];

function GamesGrid({ toast }: { toast: ReturnType<typeof useToast> }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 12,
      }}
    >
      {GAMES.map((g, i) => (
        <button
          key={g.id}
          onClick={() => {
            hapticTap("light");
            toast.push(`${g.title} — tez orada`, "info");
          }}
          style={{
            textAlign: "left",
            padding: 16,
            borderRadius: "var(--radius-xl)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minHeight: 150,
            position: "relative",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
            animation: `fadeInUp 500ms var(--ease-out) ${i * 60}ms backwards`,
            transition: "transform var(--dur-base) var(--ease-out)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: g.gradient,
              opacity: 0.18,
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: g.gradient,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 6px 16px rgba(0,0,0,0.28)",
              position: "relative",
            }}
            aria-hidden
          >
            {g.emoji}
          </span>
          <div style={{ position: "relative" }}>
            <div
              style={{
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                marginBottom: 4,
                letterSpacing: "-0.01em",
              }}
            >
              {g.title}
            </div>
            <div
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-tertiary)",
                lineHeight: 1.4,
              }}
            >
              {g.subtitle}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}