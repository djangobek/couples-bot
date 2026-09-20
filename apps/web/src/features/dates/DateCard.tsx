import { Avatar } from "../../components/Avatar";
import type { DateItem } from "../../types/api";
import { hapticTap } from "../../services/telegram";

export function DateCard({
  date,
  onDelete,
}: {
  date: DateItem;
  onDelete: () => void;
}) {
  const startsAt = new Date(date.startsAt);
  const now = new Date();
  const diffMs = startsAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86_400_000);
  const isPast = diffDays < 0;
  const isToday = diffDays === 0;
  const isTomorrow = diffDays === 1;

  const badge = isPast
    ? `${Math.abs(diffDays)} kun oldin`
    : isToday
      ? "Bugun"
      : isTomorrow
        ? "Ertaga"
        : `${diffDays} kun qoldi`;

  return (
    <article
      style={{
        padding: 20,
        borderRadius: "var(--radius-xl)",
        background: isToday || isTomorrow
          ? "linear-gradient(135deg, rgba(232,165,192,0.09), rgba(180,155,216,0.06))"
          : "var(--surface)",
        border: `1px solid ${isToday || isTomorrow ? "var(--border-accent)" : "var(--border)"}`,
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animation: "fadeInUp 400ms var(--ease-out)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {(isToday || isTomorrow) && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "var(--accent)",
            opacity: 0.13,
            filter: "blur(40px)",
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <span
          style={{
            fontSize: 10,
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            background: isPast
              ? "var(--surface-elevated)"
              : (isToday || isTomorrow)
                ? "var(--accent-soft)"
                : "var(--surface-elevated)",
            color: isPast
              ? "var(--text-tertiary)"
              : (isToday || isTomorrow)
                ? "var(--accent)"
                : "var(--text-secondary)",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {badge}
        </span>
        <button
          onClick={() => {
            hapticTap("light");
            onDelete();
          }}
          aria-label="O'chirish"
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--surface-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-tertiary)",
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>

      <h3
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "var(--fs-lg)",
          fontWeight: 500,
          letterSpacing: "-0.015em",
          lineHeight: 1.25,
        }}
      >
        {date.title}
      </h3>

      <div
        style={{
          fontSize: "var(--fs-sm)",
          color: "var(--text-secondary)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>
          {startsAt.toLocaleDateString("uz-UZ", {
            day: "numeric",
            month: "long",
            year: startsAt.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
          })}
        </span>
        <span style={{ color: "var(--text-tertiary)" }}>·</span>
        <span>
          {startsAt.toLocaleTimeString("uz-UZ", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {date.location && (
          <>
            <span style={{ color: "var(--text-tertiary)" }}>·</span>
            <span>📍 {date.location}</span>
          </>
        )}
      </div>

      {date.description && (
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {date.description}
        </p>
      )}
    </article>
  );
}