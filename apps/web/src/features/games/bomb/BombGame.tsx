import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../components/Button";
import { Avatar } from "../../../components/Avatar";
import { LoadingScreen } from "../../../components/LoadingScreen";
import { BombGrid } from "./BombGrid";
import { BombSocket } from "../../../services/bomb-socket";
import { useToast } from "../../../hooks/useToast";
import { api, humanizeError } from "../../../services/api";
import {
  hapticNotify,
  hapticTap,
  shareInviteLink,
} from "../../../services/telegram";
import type { PublicRoomState } from "./bomb-types";
import { randomBombsClient } from "./bomb-utils";

type JoinPhase = "connecting" | "joining" | "ready" | "error";

export function BombGame({
  roomCode,
  onExit,
}: {
  roomCode: string;
  onExit: () => void;
}) {
  const toast = useToast();
  const socketRef = useRef<BombSocket | null>(null);
  const joinAttemptRef = useRef(0);

  const [joinPhase, setJoinPhase] = useState<JoinPhase>("connecting");
  const [joinError, setJoinError] = useState<string | null>(null);

  const [state, setState] = useState<PublicRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [showExplosion, setShowExplosion] = useState(false);

  const [myBombs, setMyBombs] = useState<Set<number>>(new Set());
  const [placingReady, setPlacingReady] = useState(false);

  const [, setTick] = useState(0);

  const stateRef = useRef<PublicRoomState | null>(null);
  stateRef.current = state;

  /* ============================================================
     1. JOIN via REST
     ============================================================ */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setJoinPhase("joining");
      setJoinError(null);
      joinAttemptRef.current = 0;

      const code = roomCode.trim().toUpperCase();

      while (joinAttemptRef.current < 3) {
        if (cancelled) return;

        try {
          await api.joinBombRoom(code);
          if (cancelled) return;
          setJoinPhase("ready");
          return;
        } catch (err) {
          joinAttemptRef.current += 1;
          const msg = humanizeError(err);
          const msgLower = msg.toLowerCase();

          const softErrors = [
            "already",
            "full",
            "started",
            "paused",
            "topilmadi",
            "not found",
            "finished",
          ];
          const isSoft = softErrors.some((s) => msgLower.includes(s));

          if (isSoft) {
            setJoinPhase("ready");
            return;
          }

          if (joinAttemptRef.current >= 3) {
            if (cancelled) return;
            setJoinError(msg);
            setJoinPhase("error");
            return;
          }

          const delay = 500 * Math.pow(2, joinAttemptRef.current - 1);
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      if (cancelled) return;
      setJoinError("O'yinga ulanib bo'lmadi");
      setJoinPhase("error");
    })();

    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  /* ============================================================
     2. WS connect
     ============================================================ */
  useEffect(() => {
    if (joinPhase !== "ready") return;
    if (socketRef.current) return;

    const socket = new BombSocket(roomCode);
    socketRef.current = socket;

    socket
      .on("onState", (s) => {
        setState(s);
        if (s.status === "PLACING" && s.myBombs.length > 0) {
          setMyBombs(new Set(s.myBombs));
        }
      })
      .on("onMoveResult", (payload) => {
        const currentSize = stateRef.current?.size ?? 0;
        const myId = stateRef.current?.myUserId;
        const isMyMove = payload.actorId === myId;

        if (isMyMove) {
          hapticNotify(payload.hit ? "success" : "warning");
          const index = payload.row * currentSize + payload.col;
          setLastMove(index);

          if (payload.hit) {
            setShowExplosion(true);
            window.setTimeout(() => setShowExplosion(false), 800);
          }

          window.setTimeout(() => setLastMove(null), 900);
        } else {
          if (payload.hit) {
            hapticNotify("error");
            toast.push(
              "💥 Raqib sizning bombangizni topdi!",
              "error",
              2500,
            );
          }
        }
      })
      .on("onGameOver", ({ winnerId }) => {
        const meId = stateRef.current?.myUserId;
        hapticNotify(winnerId === meId ? "success" : "warning");
      })
      .on("onOpponentReady", (name) => {
        toast.push(`${name ?? "Juftingiz"} tayyor!`, "info");
      })
      .on("onOpponentJoined", (opponent) => {
        hapticNotify("success");
        toast.push(
          `💞 ${opponent.firstName ?? "Juftingiz"} qo'shildi!`,
          "success",
        );
      })
      .on("onOpponentDisconnected", ({ opponentName }) => {
        hapticNotify("warning");
        toast.push(
          `⏸ ${opponentName ?? "Juftingiz"} chiqdi. 5 daqiqa kutilmoqda…`,
          "info",
          5000,
        );
      })
      .on("onOpponentReconnected", (name) => {
        hapticNotify("success");
        toast.push(`✅ ${name ?? "Juftingiz"} qaytdi!`, "success");
      })
      .on("onOpponentLeft", () => {
        toast.push("Juftingiz o'yindan chiqdi", "error");
      })
      .on("onError", (code, message) => {
        if (code === "RECONNECT_FAILED") {
          setError(message);
        } else {
          toast.push(message, "error");
        }
      });

    void socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinPhase, roomCode]);

  /* ============================================================
     3. Cleanup on unload
     ============================================================ */
  useEffect(() => {
    function handleBeforeUnload() {
      try {
        socketRef.current?.disconnect();
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  /* ============================================================
     Tick (1s)
     ============================================================ */
  useEffect(() => {
    const interval = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  /* ============================================================
     Memoized grids
     ============================================================ */
  const myCells = useMemo(() => {
    if (!state) return [];
    const currentSize = state.size;
    return Array.from(
      { length: currentSize * currentSize },
      (_, i) => ({
        index: i,
        hasBomb: state.myBombs.includes(i),
        revealed: state.myRevealed.includes(i),
        hit: state.myRevealed.includes(i),
        isMyGrid: true,
        disabled: true,
      }),
    );
  }, [state?.size, state?.myBombs, state?.myRevealed]);

  const oppCells = useMemo(() => {
    if (!state) return [];
    const currentSize = state.size;
    const revealedMap = new Map(
      state.opponentRevealed.map((r) => [r.index, r.hit]),
    );
    const opponentBombsSet = new Set(state.opponentBombs);
    return Array.from(
      { length: currentSize * currentSize },
      (_, i) => ({
        index: i,
        revealed: revealedMap.has(i),
        hit: revealedMap.get(i) ?? false,
        hasBomb: opponentBombsSet.has(i),
        isMyGrid: false,
        disabled: false,
      }),
    );
  }, [state?.size, state?.opponentRevealed, state?.opponentBombs]);

  /* ============================================================
     PHASES
     ============================================================ */
  if (joinPhase === "connecting" || joinPhase === "joining") {
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
        <div
          style={{
            fontSize: 64,
            animation: "breathe 1.8s ease-in-out infinite",
          }}
        >
          💣
        </div>
        <h2
          className="display-italic"
          style={{
            fontSize: "var(--fs-2xl)",
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          O'yinga ulanmoqda…
        </h2>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
          }}
        >
          Kod: <strong>{roomCode}</strong>
        </p>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid var(--border-strong)",
            borderTopColor: "var(--accent)",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (joinPhase === "error" || error) {
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
        <h2
          className="display-italic"
          style={{ fontSize: "var(--fs-2xl)", fontWeight: 500 }}
        >
          Ulanishda xatolik
        </h2>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            maxWidth: 320,
          }}
        >
          {joinError ?? error}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="md" onClick={onExit}>
            Orqaga
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => window.location.reload()}
          >
            Qayta urinish
          </Button>
        </div>
      </div>
    );
  }

  if (!state) return <LoadingScreen label="O'yin yuklanmoqda…" />;

  const me = state.players.find((p) => p.userId === state.myUserId);
  const opp = state.players.find((p) => p.userId !== state.myUserId);
  const isMyTurn = state.turn === state.myUserId;

  /* ============ WAITING ============ */
  if (state.status === "WAITING") {
    const botUsername =
      (import.meta.env.VITE_BOT_USERNAME as string | undefined) ?? "";
    const shareUrl = `https://t.me/${botUsername}?start=bomb_${state.code}`;

    async function copyCode() {
      try {
        await navigator.clipboard.writeText(state!.code);
        hapticTap("light");
        toast.push("Kod nusxalandi", "success");
      } catch {
        toast.push("Nusxalab bo'lmadi", "error");
      }
    }

    function shareToTelegram() {
      hapticTap("medium");
      shareInviteLink(
        shareUrl,
        `💣 Sizni Bomba o'yiniga taklif qilaman! Kod: ${state!.code}`,
      );
    }

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 24,
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "var(--accent)",
            opacity: 0.12,
            filter: "blur(80px)",
          }}
        />

        <div
          style={{
            fontSize: 72,
            animation: "breathe 2s ease-in-out infinite",
          }}
        >
          💣
        </div>

        <div>
          <p
            className="eyebrow"
            style={{ marginBottom: 8, color: "var(--accent)" }}
          >
            Juftingiz kutilmoqda
          </p>
          <h2
            className="display-italic"
            style={{
              fontSize: "clamp(1.75rem, 7vw, 2.25rem)",
              fontWeight: 500,
              color: "var(--text-primary)",
              lineHeight: 1.15,
            }}
          >
            Kodni ulashing
          </h2>
        </div>

        <div
          onClick={copyCode}
          style={{
            padding: "20px 28px",
            borderRadius: "var(--radius-xl)",
            background:
              "linear-gradient(135deg, rgba(232,165,192,0.14), rgba(180,155,216,0.08))",
            border: "1px solid var(--border-accent)",
            cursor: "pointer",
            maxWidth: 340,
            width: "100%",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: 6 }}>
            O'yin kodi
          </p>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(1.5rem, 8vw, 2rem)",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "var(--accent)",
              marginBottom: 8,
            }}
          >
            {state.code}
          </div>
        </div>

        <div
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            maxWidth: 320,
            lineHeight: 1.6,
          }}
        >
          {state.size}×{state.size} · {state.bombCount} bomba ·{" "}
          <em>🎁 {state.reward}</em>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            width: "100%",
            maxWidth: 340,
          }}
        >
          <Button variant="secondary" size="md" fullWidth onClick={copyCode}>
            Kodni nusxalash
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={shareToTelegram}
          >
            Telegram'da ulashish
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={onExit}>
          Chiqish
        </Button>
      </div>
    );
  }

  /* ============ PAUSED ============ */
  if (state.status === "PAUSED") {
    const iAmOffline = state.pausedByUserId === state.myUserId;
    const remainingMs = state.reconnectDeadline
      ? Math.max(0, state.reconnectDeadline - Date.now())
      : 0;
    const remainingSec = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(remainingSec / 60);
    const seconds = remainingSec % 60;

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 72,
            animation: "breathe 2.4s ease-in-out infinite",
          }}
        >
          ⏸️
        </div>

        <h2
          className="display-italic"
          style={{
            fontSize: "clamp(1.5rem, 7vw, 2rem)",
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          {iAmOffline ? "Siz chiqdingiz" : "Juftingiz uzildi"}
        </h2>

        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            maxWidth: 340,
            lineHeight: 1.65,
          }}
        >
          {iAmOffline
            ? "Ilovaga qaytganingizda o'yin avtomatik davom etadi."
            : `5 daqiqa ichida qaytishi kerak.`}
        </p>

        <div
          style={{
            padding: "20px 32px",
            borderRadius: "var(--radius-xl)",
            background:
              "linear-gradient(135deg, rgba(240,196,138,0.1), rgba(232,165,192,0.06))",
            border: "1px solid rgba(240,196,138,0.3)",
          }}
        >
          <p
            className="eyebrow"
            style={{
              marginBottom: 8,
              color: "var(--warning)",
              textAlign: "center",
            }}
          >
            Qolgan vaqt
          </p>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "2.75rem",
              fontWeight: 700,
              color: "var(--warning)",
              letterSpacing: "0.08em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onExit}>
          Chiqish
        </Button>
      </div>
    );
  }

  /* ============ PLACING ============ */
  if (state.status === "PLACING") {
    const bombsNeeded = state.bombCount;
    const bombsPlaced = myBombs.size;
    const currentSize = state.size;

    function toggleBomb(index: number) {
      if (placingReady) return;
      setMyBombs((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else if (next.size < bombsNeeded) next.add(index);
        return next;
      });
    }

    function randomFill() {
      if (placingReady) return;
      setMyBombs(randomBombsClient(currentSize, bombsNeeded));
    }

    function ready() {
      if (placingReady) return;
      if (myBombs.size !== bombsNeeded) {
        toast.push(`Aynan ${bombsNeeded} ta bomba qo'ying`, "error");
        return;
      }
      setPlacingReady(true);
      socketRef.current?.ready([...myBombs]);
      toast.push("Bombalar joylashtirildi.", "success");
    }

    const cells = Array.from(
      { length: currentSize * currentSize },
      (_, i) => ({
        index: i,
        hasBomb: myBombs.has(i),
        isMyGrid: true,
        disabled: placingReady,
      }),
    );

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          padding: 20,
          paddingTop: "calc(20px + var(--safe-top))",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p className="eyebrow">Bombalar joylashtirish</p>
            <h2
              className="display-italic"
              style={{
                fontSize: "var(--fs-xl)",
                fontWeight: 500,
                marginTop: 4,
              }}
            >
              {bombsPlaced} / {bombsNeeded}
            </h2>
          </div>
          <button
            onClick={onExit}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-secondary)",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: "var(--surface-elevated)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(bombsPlaced / bombsNeeded) * 100}%`,
              background:
                "linear-gradient(90deg, var(--accent), var(--accent-strong))",
              transition: "width 250ms ease-out",
            }}
          />
        </div>

        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            textAlign: "center",
          }}
        >
          Kataklarni bosib, {bombsNeeded} ta bombani yashiring.
        </p>

        <BombGrid
          size={currentSize}
          cells={cells}
          interactive={!placingReady}
          onCellClick={toggleBomb}
        />

        {!placingReady && (
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={randomFill}
            >
              Tasodifiy
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={ready}
              disabled={bombsPlaced !== bombsNeeded}
            >
              Tayyor
            </Button>
          </div>
        )}

        {placingReady && (
          <div
            style={{
              textAlign: "center",
              padding: 20,
              color: "var(--accent)",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
            }}
          >
            Juftingiz kutilmoqda…
          </div>
        )}
      </div>
    );
  }

  /* ============ PLAYING ============ */
  if (state.status === "PLAYING") {
    const currentSize = state.size;

    function handleOppClick(index: number) {
      if (!isMyTurn) return;
      const row = Math.floor(index / currentSize);
      const col = index % currentSize;
      socketRef.current?.click(row, col);
    }

    const turnRemainingMs = state.turnDeadline
      ? Math.max(0, state.turnDeadline - Date.now())
      : 0;
    const turnRemainingSec = Math.ceil(turnRemainingMs / 1000);

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          padding: 16,
          paddingTop: "calc(16px + var(--safe-top))",
          gap: 16,
        }}
      >
        {/* Explosion overlay — my successful hit */}
        {showExplosion && (
          <div
            aria-hidden
            style={{
              position: "fixed",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,220,180,0.45), rgba(240,138,149,0.25) 40%, transparent 70%)",
              pointerEvents: "none",
              zIndex: 50,
              animation:
                "explosionFlash 700ms cubic-bezier(0.16,1,0.3,1) forwards",
            }}
          />
        )}

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p className="eyebrow">Bomba o'yini</p>
            <p
              style={{
                fontSize: "var(--fs-sm)",
                color: "var(--text-tertiary)",
                marginTop: 4,
              }}
            >
              {currentSize}×{currentSize} · {state.bombCount} bomba
            </p>
          </div>
          <button
            onClick={onExit}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-secondary)",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        {/* TURN INDICATOR — big and clear */}
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "var(--radius-xl)",
            background: isMyTurn
              ? "linear-gradient(135deg, rgba(232,165,192,0.16), rgba(232,165,192,0.06))"
              : "var(--surface)",
            border: `1.5px solid ${isMyTurn ? "var(--border-accent)" : "var(--border)"}`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            transition: "all 300ms ease-out",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: isMyTurn
                ? "linear-gradient(135deg, var(--accent), var(--accent-strong))"
                : "var(--surface-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              boxShadow: isMyTurn
                ? "0 0 20px var(--accent-glow)"
                : "inset 0 0 0 1px var(--border)",
              animation: isMyTurn ? "pulseDot 1.6s ease-in-out infinite" : "none",
            }}
          >
            {isMyTurn ? "⚡" : "⏳"}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "var(--fs-lg)",
                fontWeight: 700,
                color: isMyTurn ? "var(--accent)" : "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {isMyTurn ? "Sizning navbatingiz" : "Raqibingizning navbati"}
            </div>
            <div
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-tertiary)",
                marginTop: 2,
              }}
            >
              {isMyTurn
                ? `${turnRemainingSec}s ichida katak tanlang`
                : `${opp?.firstName ?? "Juftingiz"} o'ynamoqda…`}
            </div>
          </div>
        </div>

        {/* Score */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 14,
            borderRadius: "var(--radius-lg)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <Avatar
            src={me?.photoUrl ?? null}
            name={me?.firstName ?? null}
            size={36}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}
            >
              {me?.firstName ?? "Siz"}
            </div>
            <div
              style={{
                fontSize: "var(--fs-lg)",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: "var(--accent)",
              }}
            >
              {state.myHits} / {state.bombCount}
            </div>
          </div>
          <span style={{ fontSize: 20, color: "var(--text-tertiary)" }}>vs</span>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div
              style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}
            >
              {opp?.firstName ?? "Juft"}
            </div>
            <div
              style={{
                fontSize: "var(--fs-lg)",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {state.opponentHits} / {state.bombCount}
            </div>
          </div>
          <Avatar
            src={opp?.photoUrl ?? null}
            name={opp?.firstName ?? null}
            size={36}
          />
        </div>

        {/* My grid */}
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Sizning maydoningiz
          </p>
          <BombGrid
            size={currentSize}
            cells={myCells}
            interactive={false}
            highlightLast={lastMove}
          />
        </div>

        {/* Opponent grid */}
        <div style={{ marginTop: 4 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            {opp?.firstName ?? "Juft"}ning maydoni
          </p>
          <BombGrid
            size={currentSize}
            cells={oppCells.map((c) => ({
              ...c,
              disabled: !isMyTurn || c.revealed,
            }))}
            interactive={isMyTurn}
            onCellClick={handleOppClick}
            highlightLast={lastMove}
          />
        </div>

        <style>
          {`
            @keyframes explosionFlash {
              0% {
                opacity: 1;
                transform: scale(0.85);
              }
              40% {
                opacity: 1;
                transform: scale(1.05);
              }
              100% {
                opacity: 0;
                transform: scale(1.15);
              }
            }
            @keyframes pulseDot {
              0%, 100% {
                box-shadow: 0 0 20px var(--accent-glow);
                transform: scale(1);
              }
              50% {
                box-shadow: 0 0 32px var(--accent-glow);
                transform: scale(1.06);
              }
            }
          `}
        </style>
      </div>
    );
  }

  /* ============ FINISHED / EXPIRED / ABANDONED ============ */
  if (
    state.status === "FINISHED" ||
    state.status === "EXPIRED" ||
    state.status === "ABANDONED"
  ) {
    const iWon = state.winnerId === state.myUserId;
    const isDraw = state.status === "EXPIRED" && !state.winnerId;
    const currentSize = state.size;

    /* Recalculate cells for the final view */
    const finalMyCells = Array.from(
      { length: currentSize * currentSize },
      (_, i) => ({
        index: i,
        hasBomb: state.myBombs.includes(i),
        revealed: state.myRevealed.includes(i),
        hit: state.myRevealed.includes(i),
        isMyGrid: true,
        disabled: true,
      }),
    );

    const revealedMap = new Map(
      state.opponentRevealed.map((r) => [r.index, r.hit]),
    );
    const opponentBombsSet = new Set(state.opponentBombs);
    const finalOppCells = Array.from(
      { length: currentSize * currentSize },
      (_, i) => ({
        index: i,
        revealed: revealedMap.has(i),
        hit: revealedMap.get(i) ?? false,
        hasBomb: opponentBombsSet.has(i),
        isMyGrid: false,
        disabled: true,
      }),
    );

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          padding: 16,
          paddingTop: "calc(16px + var(--safe-top))",
          gap: 20,
          position: "relative",
        }}
      >
        {/* Result banner */}
        <div
          style={{
            padding: "28px 24px",
            borderRadius: "var(--radius-2xl)",
            background: iWon
              ? "linear-gradient(135deg, rgba(232,165,192,0.18), rgba(180,155,216,0.1))"
              : isDraw
                ? "linear-gradient(135deg, rgba(139,111,212,0.14), rgba(180,155,216,0.08))"
                : "linear-gradient(135deg, rgba(180,155,216,0.1), rgba(240,138,149,0.06))",
            border: `1px solid ${
              iWon
                ? "var(--border-accent)"
                : isDraw
                  ? "rgba(139,111,212,0.3)"
                  : "var(--border-strong)"
            }`,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "-50%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: iWon ? "var(--accent)" : "var(--violet)",
              opacity: 0.15,
              filter: "blur(60px)",
            }}
          />

          <div
            style={{
              fontSize: 56,
              marginBottom: 12,
              animation: "breathe 2.4s ease-in-out infinite",
            }}
          >
            {isDraw ? "🤝" : iWon ? "🏆" : "💫"}
          </div>

          <h1
            className="display-italic"
            style={{
              fontSize: "clamp(1.75rem, 8vw, 2.5rem)",
              color: "var(--text-primary)",
              lineHeight: 1.1,
              marginBottom: 12,
            }}
          >
            {isDraw
              ? "Durang!"
              : iWon
                ? "Siz yutdingiz!"
                : "Keyingi safar!"}
          </h1>

          <p
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--text-secondary)",
              maxWidth: 340,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            {isDraw
              ? "Ikkalangiz ham bir xil natija ko'rsatdingiz."
              : iWon
                ? `Raqibingizning barcha ${state.bombCount} bombasini topdingiz!`
                : `${opp?.firstName ?? "Juftingiz"} barcha ${state.bombCount} bombangizni topdi.`}
          </p>

          {/* Score row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "var(--fs-2xl)",
                  fontWeight: 700,
                  color: "var(--accent)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {state.myHits}
              </div>
              <div
                style={{
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-tertiary)",
                  marginTop: 2,
                }}
              >
                {me?.firstName ?? "Siz"}
              </div>
            </div>
            <span style={{ color: "var(--text-tertiary)", fontSize: 20 }}>
              ·
            </span>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "var(--fs-2xl)",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {state.opponentHits}
              </div>
              <div
                style={{
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-tertiary)",
                  marginTop: 2,
                }}
              >
                {opp?.firstName ?? "Juft"}
              </div>
            </div>
          </div>
        </div>

        {/* Reward if won */}
        {iWon && state.reward && (
          <div
            style={{
              padding: "20px 24px",
              borderRadius: "var(--radius-xl)",
              background:
                "linear-gradient(135deg, rgba(232,165,192,0.12), rgba(180,155,216,0.08))",
              border: "1px solid var(--border-accent)",
              textAlign: "center",
            }}
          >
            <p
              className="eyebrow"
              style={{ marginBottom: 8, color: "var(--accent)" }}
            >
              🎁 Sovg'angiz
            </p>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "var(--fs-lg)",
                fontStyle: "italic",
                fontWeight: 500,
                color: "var(--text-primary)",
                lineHeight: 1.35,
              }}
            >
              {state.reward}
            </p>
          </div>
        )}

        {/* Final grid view — reveal everything */}
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Sizning maydoningiz
          </p>
          <BombGrid
            size={currentSize}
            cells={finalMyCells}
            interactive={false}
            revealAll
          />
        </div>

        <div style={{ marginTop: 4 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            {opp?.firstName ?? "Juft"}ning maydoni
          </p>
          <BombGrid
            size={currentSize}
            cells={finalOppCells}
            interactive={false}
            revealAll
          />
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 8,
            marginBottom: 16,
          }}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onExit}
          >
            Bosh menyuga
          </Button>
        </div>
      </div>
    );
  }

  return <LoadingScreen />;
}