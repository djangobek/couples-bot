import { Avatar } from "../../components/Avatar";
import type { ChallengeItem } from "../../types/api";
import { hapticTap } from "../../services/telegram";

const TYPE_META: Record<
  string,
  { emoji: string; label: string; color: string }
> = {
  READING_RACE: {
    emoji: "📚",
    label: "O'qish poygasi",
    color: "var(--violet)",
  },
  STREAK: { emoji: "🔥", label: "Ketma-ketlik", color: "var(--accent)" },
  PAGES: { emoji: "📄", label: "Sahifalar", color: "var(--warning)" },
  CUSTOM: { emoji: "🎯", label: "Maxsus", color: "var(--success)" },
};

export function ChallengeCard({
  challenge,
  meId,
  onJoin,
  onProgress,
  onComplete,
}: {
  challenge: ChallengeItem;
  meId: string | null;
  onJoin: () => void;
  onProgress: () => void;
  onComplete: () => void;
}) {
  const meta = TYPE_META[challenge.type] ?? TYPE_META.CUSTOM;
  const isParticipant = challenge.participants.some((p) => p.userId === meId);
  const isCreator = challenge.creatorId === meId;
  const isActive = challenge.status === "ACTIVE";
  const isCompleted = challenge.status === "COMPLETED";
  const myProgress = challenge.participants.find((p) => p.userId === meId);

  const winner = challenge.winner;

  return (
    <article
      style={{
        padding: 20,
        borderRadius: "var(--radius-xl)",
        background:
          isCompleted
            ? "linear-gradient(135deg, rgba(134,212,168,0.08), rgba(232,165,192,0.05))"
            : "var(--surface)",
        border: `1px solid ${
          isCompleted ? "rgba(134,212,168,0.3)" : "var(--border)"
        }`,
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        animation: "fadeInUp 400ms var(--ease-out)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: meta.color,
          opacity: 0.1,
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          position: "relative",
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${meta.color}, ${meta.color}88)`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            boxShadow: `0 6px 16px ${meta.color}33`,
          }}
          aria-hidden
        >
          {meta.emoji}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-tertiary)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 2,
            }}
          >
            {meta.label}
          </div>
          <div
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--text-secondary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {isCreator ? "Siz boshladingiz" : `${challenge.creator.firstName ?? "Juft"} boshladi`}
          </div>
        </div>

        {/* Status badge */}
        <span
          style={{
            fontSize: 9.5,
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            background: isCompleted
              ? "var(--success-soft)"
              : isActive
                ? "var(--accent-soft)"
                : "var(--surface-elevated)",
            color: isCompleted
              ? "var(--success)"
              : isActive
                ? "var(--accent)"
                : "var(--text-tertiary)",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          {isCompleted
            ? "Tugatilgan"
            : isActive
              ? "Faol"
              : challenge.status}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "var(--fs-lg)",
          fontWeight: 500,
          letterSpacing: "-0.015em",
          lineHeight: 1.25,
          position: "relative",
        }}
      >
        {challenge.title}
      </h3>

      {/* Description */}
      {challenge.description && (
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-secondary)",
            lineHeight: 1.55,
            position: "relative",
          }}
        >
          {challenge.description}
        </p>
      )}

      {/* Winner display */}
      {isCompleted && winner && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 12,
            borderRadius: "var(--radius-md)",
            background: "rgba(134,212,168,0.08)",
            border: "1px solid rgba(134,212,168,0.2)",
          }}
        >
          <span style={{ fontSize: 20 }}>🏆</span>
          <Avatar
            src={winner.photoUrl}
            name={winner.firstName}
            size={28}
          />
          <span
            style={{
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {winner.id === meId ? "Siz g'olib bo'ldingiz!" : `${winner.firstName ?? "Juft"} g'olib!`}
          </span>
        </div>
      )}

      {/* Participants scores */}
      {!isCompleted && challenge.participants.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {challenge.participants.map((p) => (
            <div
              key={p.userId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Avatar
                src={p.user.photoUrl}
                name={p.user.firstName}
                size={26}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-secondary)",
                }}
              >
                {p.userId === meId ? "Siz" : p.user.firstName ?? "Juft"}
              </span>
              <span
                style={{
                  fontSize: "var(--fs-md)",
                  fontWeight: 700,
                  color:
                    p.userId === meId ? "var(--accent)" : "var(--text-primary)",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                }}
              >
                {p.score}
                {challenge.targetValue && (
                  <span
                    style={{
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-tertiary)",
                      fontWeight: 500,
                    }}
                  >
                    {" / "}
                    {challenge.targetValue}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {isActive && (
        <div
          style={{
            display: "flex",
            gap: 8,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
          }}
        >
          {!isParticipant ? (
            <button
              onClick={() => {
                hapticTap("light");
                onJoin();
              }}
              style={primaryBtnStyle}
            >
              Qo'shilish
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  hapticTap("light");
                  onProgress();
                }}
                style={secondaryBtnStyle}
              >
                + Ball qo'shish
              </button>
              {isCreator && (
                <button
                  onClick={() => {
                    hapticTap("light");
                    onComplete();
                  }}
                  style={{ ...primaryBtnStyle, flex: 1 }}
                >
                  Tugatish
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* My progress indicator */}
      {isActive && myProgress && myProgress.progress > 0 && (
        <div
          style={{
            fontSize: "var(--fs-xs)",
            color: "var(--text-tertiary)",
            textAlign: "center",
          }}
        >
          Sizning progressingiz: {Math.round(myProgress.progress)}%
        </div>
      )}
    </article>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 16px",
  borderRadius: "var(--radius-full)",
  background:
    "linear-gradient(180deg, var(--accent-strong), var(--accent-deep))",
  color: "#fff",
  fontSize: "var(--fs-sm)",
  fontWeight: 600,
  boxShadow: "0 4px 14px var(--accent-glow)",
  border: "none",
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 16px",
  borderRadius: "var(--radius-full)",
  background: "var(--surface-elevated)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-primary)",
  fontSize: "var(--fs-sm)",
  fontWeight: 600,
  cursor: "pointer",
};