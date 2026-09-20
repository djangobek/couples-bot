import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../components/Button";
import { Avatar } from "../../../components/Avatar";
import { LoadingScreen } from "../../../components/LoadingScreen";
import { TttGrid } from "./TttGrid";
import { TttSocket } from "../../../services/ttt-socket";
import { useToast } from "../../../hooks/useToast";
import { api, humanizeError } from "../../../services/api";
import {
  hapticNotify,
  hapticTap,
  shareInviteLink,
} from "../../../services/telegram";
import type { TttPublicState } from "./tictactoe-types";
import {
  X_ICONS,
  O_ICONS,
  iconsFor,
  defaultIconFor,
} from "./tictactoe-icons";

type JoinPhase = "connecting" | "joining" | "ready" | "error";

export function TttGame({
  roomCode,
  onExit,
}: {
  roomCode: string;
  onExit: () => void;
}) {
  const toast = useToast();
  const socketRef = useRef<TttSocket | null>(null);
  const joinAttemptRef = useRef(0);

  const [joinPhase, setJoinPhase] = useState<JoinPhase>("connecting");
  const [joinError, setJoinError] = useState<string | null>(null);

  const [state, setState] = useState<TttPublicState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<number | null>(null);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const [, setTick] = useState(0);

  const stateRef = useRef<TttPublicState | null>(null);
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
          await api.joinTttRoom(code);
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

    const socket = new TttSocket(roomCode);
    socketRef.current = socket;

    socket
      .on("onState", (s) => {
        setState(s);
        if (s.winningLine && s.winningLine.length > 0) {
          setShowWinOverlay(true);
          window.setTimeout(() => setShowWinOverlay(false), 1800);
        }
      })
      .on("onMoveMade", (payload) => {
        const myId = stateRef.current?.myUserId;
        const isMyMove = payload.actorId === myId;
        const currentSize = stateRef.current?.size ?? 3;
        const index = payload.row * currentSize + payload.col;

        if (isMyMove) {
          hapticNotify("success");
        } else {
          hapticTap("medium");
        }

        setLastMove(index);
        window.setTimeout(() => setLastMove(null), 600);
      })
      .on("onGameOver", ({ winnerId, isDraw }) => {
        const meId = stateRef.current?.myUserId;
        if (isDraw) {
          hapticNotify("warning");
        } else if (winnerId === meId) {
          hapticNotify("success");
        } else {
          hapticNotify("error");
        }
        setShowWinOverlay(true);
        window.setTimeout(() => setShowWinOverlay(false), 2200);
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
          `⏸ ${opponentName ?? "Juftingiz"} chiqdi.`,
          "info",
          4000,
        );
      })
      .on("onOpponentReconnected", (name) => {
        hapticNotify("success");
        toast.push(`✅ ${name ?? "Juftingiz"} qaytdi!`, "success");
      })
      .on("onOpponentLeft", () => {
        toast.push("Juftingiz o'yindan chiqdi", "error");
      })
      .on("onRematchRequested", () => {
        toast.push("Raqib qayta o'ynashni so'radi", "info");
      })
      .on("onRematchStarted", () => {
        hapticNotify("success");
        toast.push("Yangi o'yin boshlandi!", "success");
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
     Derived values — FIXED (state?.myUserId)
     ============================================================ */
  const me = state?.players.find(
    (p) => p.userId === state?.myUserId,
  );
  const opp = state?.players.find(
    (p) => p.userId !== state?.myUserId,
  );
  const isMyTurn = state?.turn === state?.myUserId;

  const myIcon = me?.icon ?? defaultIconFor("X");
  const oppIcon = opp?.icon ?? defaultIconFor("O");

  const iconX = useMemo(() => {
    if (!state) return X_ICONS[0];
    const xPlayer = state.players.find((p) => p.symbol === "X");
    return xPlayer?.icon ?? X_ICONS[0];
  }, [state?.players]);

  const iconO = useMemo(() => {
    if (!state) return O_ICONS[0];
    const oPlayer = state.players.find((p) => p.symbol === "O");
    return oPlayer?.icon ?? O_ICONS[0];
  }, [state?.players]);

  /* ============================================================
     Handlers
     ============================================================ */
  function handleCellClick(index: number) {
    if (!state || state.status !== "ACTIVE") return;
    if (!isMyTurn) {
      toast.push("Hozir raqibingizning navbati", "info", 1500);
      return;
    }
    const row = Math.floor(index / state.size);
    const col = index % state.size;
    socketRef.current?.move(row, col);
  }

  function handleRematch() {
    socketRef.current?.requestRematch();
    toast.push("Raqibga so'rov yuborildi…", "info");
  }

  function handleIconSelect(icon: string) {
    if (!me) return;
    socketRef.current?.setIcon(icon);
    setIconPickerOpen(false);
    toast.push("Belgi yangilandi", "success", 1500);
  }

  /* ============================================================
     Render phases
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
          ⭕
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
            borderTopColor: "var(--violet)",
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

  /* ============ WAITING ============ */
  if (state.status === "WAITING") {
    const botUsername =
      (import.meta.env.VITE_BOT_USERNAME as string | undefined) ?? "";
    const shareUrl = `https://t.me/${botUsername}?start=ttt_${state.code}`;

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
        `⭕❌ Sizni X-O o'yiniga taklif qilaman! Kod: ${state!.code}`,
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
            background: "var(--violet)",
            opacity: 0.14,
            filter: "blur(80px)",
          }}
        />

        <div
          style={{
            fontSize: 72,
            animation: "breathe 2s ease-in-out infinite",
          }}
        >
          ⭕❌
        </div>

        <div>
          <p
            className="eyebrow"
            style={{ marginBottom: 8, color: "var(--violet)" }}
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
              "linear-gradient(135deg, rgba(180,155,216,0.16), rgba(232,165,192,0.08))",
            border: "1px solid rgba(180,155,216,0.28)",
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
              color: "var(--violet)",
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
          {state.size}×{state.size} · {state.winLength} ketma-ket
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

  /* ============ ACTIVE / FINISHED / DRAW ============ */
  const isFinished =
    state.status === "FINISHED" ||
    state.status === "DRAW" ||
    state.status === "ABANDONED";

  const iWon = state.winnerId === state.myUserId;
  const isDraw = state.status === "DRAW";

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
      {showWinOverlay && isFinished && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 300ms ease-out",
          }}
        >
          <div
            style={{
              fontSize: 120,
              animation:
                "tttBigPop 1800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              filter: "drop-shadow(0 0 40px var(--accent-glow))",
            }}
          >
            {isDraw ? "🤝" : iWon ? "🏆" : "💫"}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p className="eyebrow">X-O o'yini</p>
          <p
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--text-tertiary)",
              marginTop: 4,
            }}
          >
            {state.size}×{state.size} · {state.winLength} ketma-ket
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderRadius: "var(--radius-xl)",
          background:
            isMyTurn && !isFinished
              ? "linear-gradient(135deg, rgba(232,165,192,0.12), rgba(180,155,216,0.06))"
              : "var(--surface)",
          border: `1.5px solid ${
            isMyTurn && !isFinished
              ? "var(--border-accent)"
              : "var(--border)"
          }`,
          transition: "all 300ms ease-out",
        }}
      >
        <button
          onClick={() => !isFinished && setIconPickerOpen(true)}
          disabled={isFinished}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "none",
            border: "none",
            padding: 0,
            cursor: isFinished ? "default" : "pointer",
            textAlign: "left",
            minWidth: 0,
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              src={me?.photoUrl ?? null}
              name={me?.firstName ?? null}
              size={40}
              ring={isMyTurn && !isFinished}
            />
            <span
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                fontSize: 20,
                background: "var(--bg)",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid var(--border-strong)",
                color:
                  me?.symbol === "X"
                    ? "var(--accent)"
                    : "var(--violet)",
              }}
              aria-hidden
            >
              {myIcon}
            </span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "var(--fs-sm)",
                fontWeight: 700,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {me?.firstName ?? "Siz"}
            </div>
            <div
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-tertiary)",
              }}
            >
              {me?.symbol ?? "?"}
            </div>
          </div>
        </button>

        <div
          style={{
            fontSize: "var(--fs-xs)",
            color: "var(--text-tertiary)",
            fontWeight: 600,
            letterSpacing: "0.08em",
          }}
        >
          VS
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "flex-end",
            minWidth: 0,
          }}
        >
          <div style={{ minWidth: 0, flex: 1, textAlign: "right" }}>
            <div
              style={{
                fontSize: "var(--fs-sm)",
                fontWeight: 700,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {opp?.firstName ?? "Juft"}
            </div>
            <div
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-tertiary)",
              }}
            >
              {opp?.symbol ?? "?"}
            </div>
          </div>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              src={opp?.photoUrl ?? null}
              name={opp?.firstName ?? null}
              size={40}
              ring={!isMyTurn && !isFinished}
            />
            <span
              style={{
                position: "absolute",
                bottom: -4,
                left: -4,
                fontSize: 20,
                background: "var(--bg)",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid var(--border-strong)",
                color:
                  opp?.symbol === "X"
                    ? "var(--accent)"
                    : "var(--violet)",
              }}
              aria-hidden
            >
              {oppIcon}
            </span>
          </div>
        </div>
      </div>

      {!isFinished && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-lg)",
            background: isMyTurn
              ? "linear-gradient(135deg, rgba(232,165,192,0.14), rgba(232,165,192,0.05))"
              : "var(--surface)",
            border: `1px solid ${
              isMyTurn ? "var(--border-accent)" : "var(--border)"
            }`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            transition: "all 300ms ease-out",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: isMyTurn
                ? "linear-gradient(135deg, var(--accent), var(--accent-strong))"
                : "var(--surface-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              boxShadow: isMyTurn
                ? "0 0 20px var(--accent-glow)"
                : "inset 0 0 0 1px var(--border)",
              animation: isMyTurn
                ? "tttPulseDot 1.6s ease-in-out infinite"
                : "none",
            }}
          >
            {isMyTurn ? "⚡" : "⏳"}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "var(--fs-md)",
                fontWeight: 700,
                color: isMyTurn ? "var(--accent)" : "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {isMyTurn
                ? "Sizning navbatingiz"
                : "Raqibingizning navbati"}
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
      )}

      <TttGrid
        size={state.size}
        board={state.board}
        onCellClick={handleCellClick}
        interactive={isMyTurn && !isFinished}
        winningLine={state.winningLine}
        lastMove={lastMove}
        iconX={iconX}
        iconO={iconO}
      />

      {isFinished && (
        <div
          style={{
            padding: "24px 20px",
            borderRadius: "var(--radius-xl)",
            background: iWon
              ? "linear-gradient(135deg, rgba(232,165,192,0.18), rgba(180,155,216,0.1))"
              : isDraw
                ? "linear-gradient(135deg, rgba(139,111,212,0.14), rgba(180,155,216,0.08))"
                : "linear-gradient(135deg, rgba(180,155,216,0.1), rgba(240,138,149,0.06))",
            border: `1.5px solid ${
              iWon ? "var(--border-accent)" : "var(--border-strong)"
            }`,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontSize: 56,
              marginBottom: 8,
              animation: "breathe 2.2s ease-in-out infinite",
            }}
          >
            {isDraw ? "🤝" : iWon ? "🏆" : "💫"}
          </div>
          <h1
            className="display-italic"
            style={{
              fontSize: "clamp(1.5rem, 7vw, 2rem)",
              color: "var(--text-primary)",
              lineHeight: 1.1,
              marginBottom: 6,
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
              maxWidth: 320,
              margin: "0 auto",
              lineHeight: 1.55,
            }}
          >
            {isDraw
              ? "Maydon to'ldi, hech kim yutmadi."
              : iWon
                ? `Siz ${state.winLength} ta ketma-ket ${me?.symbol} joylashtirdingiz!`
                : `${opp?.firstName ?? "Juftingiz"} ketma-ket ${state.winLength} ta ${opp?.symbol} joylashtirdi.`}
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 18,
              maxWidth: 340,
              margin: "18px auto 0",
            }}
          >
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={handleRematch}
            >
              🔄 Qayta
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={onExit}
            >
              🏠 Menyu
            </Button>
          </div>
        </div>
      )}

      {iconPickerOpen && me && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIconPickerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            background: "rgba(6,3,10,0.72)",
            backdropFilter: "blur(8px)",
            padding: 16,
            paddingBottom: "calc(16px + var(--safe-bottom))",
            animation: "fadeIn 200ms ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              background:
                "linear-gradient(180deg, var(--surface-elevated), var(--surface))",
              borderRadius: 24,
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--border-strong)",
              padding: 24,
              animation: "slideUp 250ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <h3
              style={{
                fontSize: "var(--fs-lg)",
                fontWeight: 600,
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              Belgi tanlang
            </h3>
            <p
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-tertiary)",
                textAlign: "center",
                marginBottom: 18,
              }}
            >
              Sizning belgi: <strong>{me.symbol}</strong>
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 8,
              }}
            >
              {iconsFor(me.symbol).map((icon) => {
                const active = me.icon === icon;
                return (
                  <button
                    key={icon}
                    onClick={() => {
                      hapticTap("light");
                      handleIconSelect(icon);
                    }}
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: 14,
                      background: active
                        ? "var(--accent-soft)"
                        : "var(--surface)",
                      border: `1.5px solid ${
                        active ? "var(--border-accent)" : "var(--border)"
                      }`,
                      fontSize: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 150ms ease-out",
                      color:
                        me.symbol === "X"
                          ? "var(--accent)"
                          : "var(--violet)",
                    }}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes tttPulseDot {
            0%, 100% {
              box-shadow: 0 0 20px var(--accent-glow);
              transform: scale(1);
            }
            50% {
              box-shadow: 0 0 32px var(--accent-glow);
              transform: scale(1.06);
            }
          }
          @keyframes tttBigPop {
            0% {
              transform: scale(0.2) rotate(-30deg);
              opacity: 0;
            }
            50% {
              transform: scale(1.15) rotate(5deg);
              opacity: 1;
            }
            100% {
              transform: scale(1) rotate(0);
              opacity: 1;
            }
          }
          @keyframes slideUp {
            0% {
              transform: translateY(40px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}