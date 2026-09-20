/* ============================================================
   GAME DETAIL PAGE — full state + moves
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { adminApi, humanizeError } from "../lib/api";
import { Avatar } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { LoadingScreen } from "../components/LoadingScreen";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { TttBoardView } from "../features/games/TttBoardView";
import { formatDateTime, timeAgo, shortId } from "../lib/format";
import type { AdminGameDetail } from "../types/admin";

export function GameDetailPage({
  gameId,
  onBack,
}: {
  gameId: string;
  onBack: () => void;
}) {
  const toast = useToast();
  const [game, setGame] = useState<AdminGameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGame(await adminApi.game(gameId));
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function abandon() {
    if (!game) return;
    setBusy(true);
    try {
      await adminApi.abandonGame(game.id);
      toast.push("O'yin bekor qilindi", "success");
      setConfirmOpen(false);
      await load();
    } catch (err) {
      toast.push(humanizeError(err), "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingScreen label="O'yin yuklanmoqda…" />;
  }

  if (error || !game) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <p style={{ color: "var(--danger)", marginBottom: 16 }}>
          {error ?? "O'yin topilmadi"}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button variant="secondary" size="md" onClick={onBack}>
            ← Orqaga
          </Button>
          <Button variant="primary" size="md" onClick={load}>
            Qayta urinish
          </Button>
        </div>
      </div>
    );
  }

  const isActive =
    game.status === "WAITING" ||
    game.status === "PLACING" ||
    game.status === "PLAYING" ||
    game.status === "PAUSED";

  /* Tic-tac-toe board from boardState */
  const tttBoard = (() => {
    if (game.type !== "TIC_TAC_TOE") return null;
    const bs = game.boardState as
      | { board?: (string | null)[]; size?: number }
      | null;
    if (!bs?.board || !bs.size) return null;
    return { board: bs.board, size: bs.size };
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          alignSelf: "flex-start",
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
          fontFamily: "inherit",
        }}
      >
        ← O'yinlarga qaytish
      </button>

      {/* Header */}
      <div
        style={{
          padding: 24,
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 48 }}>
          {game.type === "BOMB" ? "💣" : "⭕"}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>
              {game.type === "BOMB" ? "Bomba o'yini" : "X-O o'yini"}
            </h1>
            <Badge
              variant={
                game.status === "FINISHED"
                  ? "success"
                  : game.status === "ABANDONED" || game.status === "EXPIRED"
                    ? "danger"
                    : "info"
              }
              dot
            >
              {game.status}
            </Badge>
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              fontSize: 13,
              color: "var(--text-secondary)",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span className="mono">Kod: {game.code}</span>
            <span className="mono">ID: {shortId(game.id)}</span>
            {game.size && <span>Maydon: {game.size}×{game.size}</span>}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              marginTop: 8,
            }}
          >
            Yaratilgan: {formatDateTime(game.createdAt)}
            {game.finishedAt && ` · Tugagan: ${formatDateTime(game.finishedAt)}`}
          </div>
        </div>

        {isActive && (
          <Button
            variant="danger"
            size="md"
            onClick={() => setConfirmOpen(true)}
          >
            ⚠ Tugatish
          </Button>
        )}
      </div>

      {/* Players */}
      <section>
        <h2 style={sectionTitle}>O'yinchilar</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {game.players.length === 0 ? (
            <EmptyState icon="👤" title="O'yinchilar yo'q" />
          ) : (
            game.players.map((p) => (
              <div
                key={p.userId}
                style={{
                  padding: 16,
                  borderRadius: "var(--radius-lg)",
                  background: "var(--surface)",
                  border: `1px solid ${
                    game.winnerId === p.userId
                      ? "var(--success)"
                      : "var(--border)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Avatar src={p.photoUrl} name={p.firstName} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.firstName ?? "—"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-tertiary)",
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    {p.symbol && <span>Belgi: {p.symbol}</span>}
                    <span>Joy: #{p.seat}</span>
                  </div>
                </div>
                {game.winnerId === p.userId && (
                  <span style={{ fontSize: 20 }}>🏆</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Board state (Tic-tac-toe) */}
      {tttBoard && (
        <section>
          <h2 style={sectionTitle}>Maydon holati</h2>
          <div
            style={{
              padding: 20,
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <TttBoardView
              board={tttBoard.board}
              size={tttBoard.size}
            />
          </div>
        </section>
      )}

      {/* Bomb state */}
      {game.type === "BOMB" && (
        <section>
          <h2 style={sectionTitle}>Bomba holati</h2>
          <div
            style={{
              padding: 20,
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <BombStateView boardState={game.boardState} />
          </div>
        </section>
      )}

      {/* Moves history */}
      <section>
        <h2 style={sectionTitle}>Yurishlar tarixi ({game.moves.length})</h2>
        <div
          style={{
            borderRadius: "var(--radius-lg)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            maxHeight: 400,
            overflowY: "auto",
          }}
        >
          {game.moves.length === 0 ? (
            <EmptyState icon="📋" title="Yurishlar yo'q" />
          ) : (
            game.moves.map((m, i) => (
              <div
                key={m.id}
                style={{
                  padding: "10px 16px",
                  borderBottom:
                    i < game.moves.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-tertiary)",
                      fontVariantNumeric: "tabular-nums",
                      minWidth: 32,
                    }}
                  >
                    #{i + 1}
                  </span>
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {m.actorName ?? "—"}
                  </span>
                  <span
                    className="mono"
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: 12,
                    }}
                  >
                    ({m.row}, {m.col})
                  </span>
                  {m.symbol && (
                    <Badge
                      variant={m.symbol === "X" ? "accent" : "success"}
                    >
                      {m.symbol}
                    </Badge>
                  )}
                  {game.type === "BOMB" && (
                    <Badge variant={m.hit ? "success" : "default"}>
                      {m.hit ? "💥 Bomba" : "○ Bo'sh"}
                    </Badge>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    flexShrink: 0,
                  }}
                >
                  {timeAgo(m.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Confirm abandon */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="O'yinni tugatish?"
      >
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          O'yin "ABANDONED" holatiga o'tadi. Bu amalni qaytarib bo'lmaydi.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setConfirmOpen(false)}
          >
            Bekor qilish
          </Button>
          <Button
            variant="danger"
            size="md"
            loading={busy}
            onClick={abandon}
          >
            Tugatish
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Bomb state view ---------- */
function BombStateView({ boardState }: { boardState: unknown }) {
  const bs = boardState as
    | {
        bombs?: Array<{
          userId: string;
          bombs: string | null;
          hits: number;
        }>;
      }
    | null;

  if (!bs?.bombs || bs.bombs.length === 0) {
    return (
      <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
        Ma'lumot mavjud emas
      </span>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {bs.bombs.map((b) => {
        let bombsArr: number[] = [];
        try {
          bombsArr = b.bombs ? JSON.parse(b.bombs) : [];
        } catch {
          bombsArr = [];
        }
        return (
          <div
            key={b.userId}
            style={{
              padding: 12,
              borderRadius: "var(--radius-md)",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span className="mono" style={{ fontSize: 11 }}>
              {shortId(b.userId)}
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {bombsArr.map((idx) => (
                <span
                  key={idx}
                  style={{
                    padding: "2px 6px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--danger-soft)",
                    color: "var(--danger)",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  #{idx}
                </span>
              ))}
            </div>
            <Badge variant="danger">Hits: {b.hits}</Badge>
          </div>
        );
      })}
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
  marginBottom: 10,
};