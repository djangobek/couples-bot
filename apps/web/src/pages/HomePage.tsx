import { useCallback, useEffect, useState } from "react";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { useApp } from "../context/AppContext";
import { api, humanizeError } from "../services/api";
import type { ActivityEvent, HomeData } from "../types/api";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Xayrli tun";
  if (h < 12) return "Xayrli tong";
  if (h < 17) return "Xayrli kun";
  if (h < 22) return "Xayrli kech";
  return "Xayrli tun";
}

function activityLine(
  event: ActivityEvent,
  meId: string | null,
): { emoji: string; text: string } {
  const isMe = event.actor?.id === meId;
  const who = isMe ? "Siz" : event.actor?.firstName ?? "Juftingiz";
  switch (event.type) {
    case "MEMORY_ADDED":
      return { emoji: "❤️", text: `${who} xotira qo'shdi` };
    case "LETTER_SENT":
      return { emoji: "💌", text: `${who} xat yubordi` };
    case "BOOK_ADDED":
      return { emoji: "📚", text: `${who} kitob qo'shdi` };
    case "READING_PROGRESS":
      return { emoji: "📖", text: `${who} o'qishni davom ettirdi` };
    case "CHALLENGE_CREATED":
      return { emoji: "🎯", text: `${who} challenge boshladi` };
    case "CHALLENGE_COMPLETED":
      return { emoji: "🏆", text: `${who} challengeni tugatdi` };
    case "DATE_CREATED":
      return { emoji: "🗓️", text: `${who} uchrashuv qo'shdi` };
    case "PARTNER_JOINED":
      return { emoji: "💞", text: `${who} qo'shildi` };
    default:
      return { emoji: "•", text: `${who} faoliyat` };
  }
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "hozir";
  if (diff < 3600) return `${Math.floor(diff / 60)} daq`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun`;
  return new Date(iso).toLocaleDateString("uz-UZ", {
    month: "short",
    day: "numeric",
  });
}

export function HomePage() {
  const { me } = useApp();
  const [home, setHome] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHome(await api.getHome());
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const meId = me?.id ?? null;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="80%" height={44} />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !home) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            marginBottom: 20,
          }}
        >
          {error ?? "Ma'lumot yuklanmadi"}
        </p>
        <Button variant="secondary" size="md" onClick={load}>
          Qayta urinish
        </Button>
      </div>
    );
  }

  const partnerName = home.partner?.firstName ?? null;
  const displayName = partnerName
    ? `${home.user.firstName ?? "Siz"} & ${partnerName}`
    : home.user.firstName ?? "Siz";

  const nextDate = home.upcomingDates[0] ?? null;
  const daysUntil = nextDate
    ? Math.ceil(
        (new Date(nextDate.startsAt).getTime() - Date.now()) / 86_400_000,
      )
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 32,
        paddingTop: 8,
      }}
    >
      {/* ============ HERO ============ */}
      <section style={{ animation: "fadeInUp 500ms var(--ease-out)" }}>
        {/* Avatars row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Avatar
            src={home.user.photoUrl}
            name={home.user.firstName}
            size={52}
            ring
          />
          {home.partner && (
            <Avatar
              src={home.partner.photoUrl}
              name={home.partner.firstName}
              size={52}
              ring
            />
          )}
        </div>

        {/* Greeting eyebrow */}
        <p
          className="eyebrow"
          style={{ marginBottom: 10, color: "var(--text-tertiary)" }}
        >
          {greeting()}
        </p>

        {/* Editorial hero title */}
        <h1
          className="display-italic"
          style={{
            fontSize: "clamp(2.5rem, 9vw, 3.25rem)",
            color: "var(--text-primary)",
            marginBottom: 16,
          }}
        >
          {displayName}
        </h1>

        {/* Together counter — editorial */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            color: "var(--text-secondary)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "2rem",
              fontStyle: "italic",
              fontWeight: 500,
              color: "var(--accent)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {home.couple.togetherDays.toLocaleString()}
          </span>
          <span style={{ fontSize: "var(--fs-sm)" }}>
            kun birga ·{" "}
            <span style={{ color: "var(--text-tertiary)" }}>
              bizning hikoyamiz
            </span>
          </span>
        </div>
      </section>

      {/* ============ NEXT DATE ============ */}
      {nextDate && (
        <section
          style={{
            position: "relative",
            padding: "24px 22px",
            borderRadius: "var(--radius-xl)",
            background:
              "linear-gradient(135deg, rgba(232, 165, 192, 0.09) 0%, rgba(180, 155, 216, 0.06) 100%)",
            border: "1px solid var(--border-accent)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
            overflow: "hidden",
            animation: "fadeInUp 600ms var(--ease-out) 60ms backwards",
          }}
        >
          {/* Decorative glow */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "var(--accent)",
              opacity: 0.14,
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />

          <p
            className="eyebrow"
            style={{ color: "var(--accent)", marginBottom: 12 }}
          >
            {daysUntil === 0
              ? "Bugun"
              : daysUntil === 1
                ? "Ertaga"
                : `${daysUntil} kundan keyin`}
          </p>

          <h3
            style={{
              fontSize: "var(--fs-xl)",
              fontWeight: 500,
              fontFamily: "var(--font-serif)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: 8,
              color: "var(--text-primary)",
            }}
          >
            {nextDate.title}
          </h3>

          <p
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <span>
              {new Date(nextDate.startsAt).toLocaleDateString("uz-UZ", {
                day: "numeric",
                month: "long",
              })}
            </span>
            <span style={{ color: "var(--text-tertiary)" }}>·</span>
            <span>
              {new Date(nextDate.startsAt).toLocaleTimeString("uz-UZ", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {nextDate.location && (
              <>
                <span style={{ color: "var(--text-tertiary)" }}>·</span>
                <span>{nextDate.location}</span>
              </>
            )}
          </p>
        </section>
      )}

      {/* ============ READING ============ */}
      {home.reading && (
        <section
          style={{
            animation: "fadeInUp 600ms var(--ease-out) 120ms backwards",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            O'qish davom etmoqda
          </p>

          <div
            style={{
              padding: "20px 22px",
              borderRadius: "var(--radius-xl)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3
              style={{
                fontSize: "var(--fs-md)",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                marginBottom: 4,
              }}
            >
              {home.reading.title}
            </h3>
            {home.reading.author && (
              <p
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-tertiary)",
                  marginBottom: 16,
                }}
              >
                {home.reading.author}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {home.reading.progress.map((p) => {
                const name =
                  p.userId === home.user.id
                    ? home.user.firstName ?? "Siz"
                    : home.partner?.firstName ?? "Juft";
                return (
                  <div key={p.userId}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "var(--fs-xs)",
                        marginBottom: 6,
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{name}</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {p.currentPage}
                        {home.reading?.pageCount
                          ? ` / ${home.reading.pageCount}`
                          : ""}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: "var(--surface-elevated)",
                        overflow: "hidden",
                        boxShadow: "inset 0 0 0 1px var(--border)",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, p.percent)}%`,
                          background:
                            "linear-gradient(90deg, var(--accent), var(--accent-strong))",
                          borderRadius: 3,
                          boxShadow: "0 0 12px var(--accent-glow)",
                          transition: "width var(--dur-slow) var(--ease-out)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ STATS ============ */}
      <section
        style={{ animation: "fadeInUp 600ms var(--ease-out) 180ms backwards" }}
      >
        <p className="eyebrow" style={{ marginBottom: 12 }}>
          Bizning dunyo
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {[
            { emoji: "📸", value: home.stats.memories, label: "Xotira" },
            { emoji: "💌", value: home.stats.letters, label: "Xat" },
            { emoji: "🗓️", value: home.stats.dates, label: "Sana" },
            { emoji: "📚", value: home.stats.books, label: "Kitob" },
            { emoji: "🎯", value: home.stats.challenges, label: "Challenge" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: "14px 8px",
                borderRadius: "var(--radius-lg)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                textAlign: "center",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4, opacity: 0.9 }}>
                {s.emoji}
              </div>
              <div
                style={{
                  fontSize: "var(--fs-lg)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginTop: 3,
                  fontWeight: 500,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ACTIVITY ============ */}
      <section
        style={{ animation: "fadeInUp 600ms var(--ease-out) 240ms backwards" }}
      >
        <p className="eyebrow" style={{ marginBottom: 12 }}>
          So'nggi faoliyat
        </p>

        {home.recentActivity.length === 0 ? (
          <div
            style={{
              padding: "40px 24px",
              borderRadius: "var(--radius-xl)",
              background: "var(--surface)",
              border: "1px dashed var(--border-strong)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "1.5rem",
                color: "var(--accent)",
                marginBottom: 10,
                opacity: 0.7,
              }}
            >
              ✦
            </div>
            <h3
              style={{
                fontSize: "var(--fs-md)",
                fontWeight: 500,
                fontFamily: "var(--font-serif)",
                marginBottom: 6,
                letterSpacing: "-0.01em",
              }}
            >
              Sizning hikoyangiz shu yerdan boshlanadi.
            </h3>
            <p
              style={{
                fontSize: "var(--fs-sm)",
                color: "var(--text-tertiary)",
                maxWidth: 260,
                margin: "0 auto",
              }}
            >
              Birgalikda birinchi xotirani saqlang.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {home.recentActivity.slice(0, 6).map((event, i) => {
              const { emoji, text } = activityLine(event, meId);
              return (
                <div
                  key={event.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    animation: `fadeInUp 400ms var(--ease-out) ${300 + i * 40}ms backwards`,
                  }}
                >
                  <span style={{ fontSize: 17, opacity: 0.9 }} aria-hidden>
                    {emoji}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "var(--fs-sm)",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {text}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-tertiary)",
                      flexShrink: 0,
                    }}
                  >
                    {timeAgo(event.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}