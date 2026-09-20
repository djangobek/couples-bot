/* ============================================================
   PROFILE PAGE — with settings button
   ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Skeleton } from "../components/Skeleton";
import { useApp } from "../context/AppContext";
import { useToast } from "../hooks/useToast";
import { api, humanizeError } from "../services/api";
import {
  shareInviteLink,
  hapticNotify,
  hapticTap,
} from "../services/telegram";
import type { HomeData } from "../types/api";

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / 86_400_000);
}

export function ProfilePage({
  onOpenSettings,
}: {
  onOpenSettings?: () => void;
}) {
  const { me, couple, reloadCouple } = useApp();
  const toast = useToast();

  const [home, setHome] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHome(await api.getHome());
    } catch {
      setHome(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const partner = couple?.partner ?? null;
  const anniversary = couple?.couple?.anniversaryDate
    ? new Date(couple.couple.anniversaryDate)
    : null;
  const togetherDays = anniversary
    ? daysBetween(anniversary, new Date())
    : null;

  async function handleCreateInvite() {
    setInviteLoading(true);
    try {
      const res = await api.createInvite();
      const botUsername =
        (import.meta.env.VITE_BOT_USERNAME as string | undefined) ?? "";
      const link =
        res.shareUrl ??
        `https://t.me/${botUsername}?start=invite_${res.code}`;
      setInviteLink(link);
      setInviteOpen(true);
      hapticNotify("success");
    } catch (err) {
      hapticNotify("error");
      toast.push(humanizeError(err), "error");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleLeave() {
    try {
      await api.leaveCouple();
      await reloadCouple();
      setLeaveOpen(false);
      hapticNotify("success");
      toast.push("Juftlikdan chiqdingiz.", "success");
    } catch (err) {
      hapticNotify("error");
      toast.push(humanizeError(err), "error");
    }
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
      {/* ============ HERO ============ */}
      <section style={{ animation: "fadeInUp 500ms var(--ease-out)" }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          Profil
        </p>
        <h1
          className="display-italic"
          style={{
            fontSize: "clamp(2.5rem, 9vw, 3.25rem)",
            color: "var(--text-primary)",
            marginBottom: 12,
          }}
        >
          Biz.
        </h1>
      </section>

      {/* ============ ME CARD ============ */}
      <section
        style={{ animation: "fadeInUp 500ms var(--ease-out) 60ms backwards" }}
      >
        <div
          style={{
            padding: 22,
            borderRadius: "var(--radius-xl)",
            background:
              "linear-gradient(135deg, rgba(232,165,192,0.06), rgba(180,155,216,0.04))",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Avatar
            src={me?.photoUrl ?? null}
            name={me?.firstName ?? null}
            size={64}
            ring
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "var(--fs-md)",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginBottom: 4,
              }}
            >
              {me?.firstName ?? "Siz"}
              {me?.lastName ? ` ${me.lastName}` : ""}
            </div>
            {me?.username && (
              <div
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-tertiary)",
                  marginBottom: 2,
                }}
              >
                @{me.username}
              </div>
            )}
            <div
              style={{
                fontSize: 10,
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
                opacity: 0.7,
              }}
            >
              TG · {me?.telegramId ?? "—"}
            </div>
          </div>
        </div>
      </section>

      {/* ============ COUPLE CARD ============ */}
      <section
        style={{ animation: "fadeInUp 500ms var(--ease-out) 120ms backwards" }}
      >
        <p className="eyebrow" style={{ marginBottom: 12 }}>
          Bizning juftlik
        </p>

        {partner ? (
          <div
            style={{
              padding: 22,
              borderRadius: "var(--radius-xl)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <Avatar
                src={partner.photoUrl ?? null}
                name={partner.firstName ?? null}
                size={52}
                ring
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "var(--fs-md)",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {partner.firstName ?? "Juft"}
                </div>
                <div
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-tertiary)",
                    marginTop: 2,
                  }}
                >
                  {partner.username ? `@${partner.username}` : partner.role}
                </div>
              </div>
            </div>

            {togetherDays !== null && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  paddingTop: 16,
                  paddingBottom: 4,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--fs-sm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Birga
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.5rem",
                    fontStyle: "italic",
                    fontWeight: 500,
                    color: "var(--accent)",
                    letterSpacing: "-0.02em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {togetherDays.toLocaleString()} kun
                </span>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <Button
                variant="danger"
                size="sm"
                fullWidth
                onClick={() => setLeaveOpen(true)}
              >
                Juftlikdan chiqish
              </Button>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 22,
              borderRadius: "var(--radius-xl)",
              background: "var(--surface)",
              border: "1px dashed var(--border-strong)",
              boxShadow: "var(--shadow-sm)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "var(--fs-sm)",
                color: "var(--text-secondary)",
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              Siz yolg'izsiz. Juftingizni taklif qiling va maxfiy
              dunyongizni to'ldiring.
            </p>
            <Button
              variant="primary"
              size="md"
              fullWidth
              loading={inviteLoading}
              onClick={handleCreateInvite}
            >
              Juftni taklif qilish
            </Button>
          </div>
        )}
      </section>

      {/* ============ STATS ============ */}
      <section
        style={{ animation: "fadeInUp 500ms var(--ease-out) 180ms backwards" }}
      >
        <p className="eyebrow" style={{ marginBottom: 12 }}>
          Statistika
        </p>

        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 10,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={90} radius="var(--radius-lg)" />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 10,
            }}
          >
            {[
              {
                label: "Birga",
                value: `${home?.couple.togetherDays ?? togetherDays ?? 0}k`,
              },
              { label: "Xotira", value: String(home?.stats.memories ?? 0) },
              { label: "Xat", value: String(home?.stats.letters ?? 0) },
              { label: "Kitob", value: String(home?.stats.books ?? 0) },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: 18,
                  borderRadius: "var(--radius-lg)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-xs)",
                  animation: `fadeInUp 400ms var(--ease-out) ${240 + i * 50}ms backwards`,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.75rem",
                    fontWeight: 500,
                    fontStyle: "italic",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============ SETTINGS ============ */}
      {onOpenSettings && (
        <section
          style={{
            animation: "fadeInUp 500ms var(--ease-out) 240ms backwards",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            Ilova
          </p>
          <button
            onClick={() => {
              hapticTap("light");
              onOpenSettings();
            }}
            style={{
              width: "100%",
              padding: "14px 18px",
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: "var(--fs-sm)",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 140ms var(--ease-out)",
            }}
          >
            <span>⚙️ Sozlamalar</span>
            <span style={{ color: "var(--text-tertiary)", fontSize: 18 }}>
              ›
            </span>
          </button>
        </section>
      )}

      {/* ============ ABOUT ============ */}
      <section
        style={{ animation: "fadeInUp 500ms var(--ease-out) 300ms backwards" }}
      >
        <p className="eyebrow" style={{ marginBottom: 12 }}>
          Ilova haqida
        </p>

        <div
          style={{
            borderRadius: "var(--radius-lg)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <AboutRow label="Couples" value="Ikki kishi. Bir dunyo." />
          <AboutRow label="Versiya" value="0.1.0" last />
        </div>
      </section>

      {/* ============ INVITE MODAL ============ */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Juftingizni taklif qiling"
      >
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-secondary)",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          Bu havolani juftingizga yuboring. Ular Telegram'da ochganda maxfiy
          dunyongizga qo'shilishlari mumkin.
        </p>
        {inviteLink && (
          <div
            style={{
              padding: 14,
              borderRadius: "var(--radius-md)",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--text-secondary)",
              wordBreak: "break-all",
              marginBottom: 20,
              lineHeight: 1.5,
            }}
          >
            {inviteLink}
          </div>
        )}
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={() => {
            if (!inviteLink) return;
            hapticTap("medium");
            shareInviteLink(
              inviteLink,
              "Mening maxfiy juftlik dunyomga qo'shil 💕",
            );
          }}
        >
          Telegram'da ulashish
        </Button>
      </Modal>

      {/* ============ LEAVE MODAL ============ */}
      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Juftlikdan chiqish?"
      >
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-secondary)",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          Xotiralar, xatlar va sanalar saqlanadi. Lekin siz ularga kirishni
          yo'qotasiz.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => setLeaveOpen(false)}
          >
            Bekor qilish
          </Button>
          <Button variant="danger" size="md" fullWidth onClick={handleLeave}>
            Chiqish
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AboutRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        padding: "14px 18px",
        color: "var(--text-primary)",
        fontSize: "var(--fs-sm)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: last ? "none" : "1px solid var(--border)",
      }}
    >
      <span>{label}</span>
      <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-xs)" }}>
        {value}
      </span>
    </div>
  );
}