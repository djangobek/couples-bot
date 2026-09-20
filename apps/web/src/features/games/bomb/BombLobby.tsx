import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { api } from "../../../services/api";

export function BombLobby({
  onCreateClick,
  onJoinGame,
}: {
  onCreateClick: () => void;
  onJoinGame: (code: string) => void;
}) {
  const [myRoom, setMyRoom] = useState<{
    code: string;
    status: string;
    size: number;
    bombCount: number;
    reward: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const failCountRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const data = await api.getMyBombRoom();
      setMyRoom(data);
      failCountRef.current = 0;
    } catch {
      failCountRef.current += 1;
      if (failCountRef.current > 3) {
        setMyRoom(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  if (loading) return null;

  if (
    myRoom &&
    myRoom.status !== "FINISHED" &&
    myRoom.status !== "ABANDONED" &&
    myRoom.status !== "EXPIRED"
  ) {
    const statusLabel =
      myRoom.status === "PAUSED"
        ? "⏸️ To'xtatilgan"
        : myRoom.status === "WAITING"
          ? "👥 Juft kutilmoqda"
          : myRoom.status === "PLACING"
            ? "💣 Joylashtirish"
            : "🎮 O'yin";

    return (
      <div
        style={{
          padding: 22,
          borderRadius: "var(--radius-xl)",
          background:
            "linear-gradient(135deg, rgba(232,165,192,0.1), rgba(180,155,216,0.06))",
          border: "1px solid var(--border-accent)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40 }}>💣</div>
        <div>
          <p
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--accent)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {statusLabel}
          </p>
          <h3
            className="display-italic"
            style={{ fontSize: "var(--fs-xl)", fontWeight: 500 }}
          >
            Faol o'yiningiz bor
          </h3>
        </div>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-secondary)",
            lineHeight: 1.55,
          }}
        >
          {myRoom.size}×{myRoom.size} · {myRoom.bombCount} bomba ·{" "}
          {myRoom.reward}
        </p>
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={() => onJoinGame(myRoom.code)}
        >
          O'yinni davom ettirish
        </Button>
      </div>
    );
  }

  return (
    <EmptyState
      icon={<span style={{ fontSize: 32 }}>💣</span>}
      title="Bomba o'yini"
      description="Raqibingizning yashirin bombalarini birinchi bo'lib toping. Yutgan sovg'ani oladi."
      action={
        <Button variant="primary" size="md" onClick={onCreateClick}>
          O'yin yaratish
        </Button>
      }
    />
  );
}