import { Avatar } from "../../components/Avatar";
import type { MemoryItem, MemoryReaction } from "../../types/api";
import { hapticTap } from "../../services/telegram";

const EMOJI_OPTIONS = ["❤️", "😍", "😂", "🥹", "🔥", "✨"];

export function MemoryCard({
  memory,
  meId,
  onOpen,
  onReact,
}: {
  memory: MemoryItem;
  meId: string | null;
  onOpen: () => void;
  onReact: (emoji: string) => void;
}) {
  const isMine = memory.author.id === meId;
  const isPrivate = memory.visibility === "PRIVATE";

  const myReactions = new Set(
    memory.reactions.filter((r) => r.userId === meId).map((r) => r.emoji),
  );

  return (
    <article
      onClick={() => {
        hapticTap("light");
        onOpen();
      }}
      style={{
        padding: 20,
        borderRadius: "var(--radius-xl)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        cursor: "pointer",
        transition: "transform var(--dur-fast) var(--ease-out)",
        animation: "fadeInUp 400ms var(--ease-out)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Avatar
          src={memory.author.photoUrl}
          name={memory.author.firstName}
          size={34}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--text-secondary)",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {isMine ? "Siz" : memory.author.firstName ?? "Juft"}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-tertiary)",
              marginTop: 1,
            }}
          >
            {new Date(memory.eventAt ?? memory.createdAt).toLocaleDateString(
              "uz-UZ",
              { day: "numeric", month: "long", year: "numeric" },
            )}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {isPrivate && (
            <span
              style={{
                fontSize: 10,
                padding: "3px 8px",
                borderRadius: "var(--radius-full)",
                background: "var(--violet-soft)",
                color: "var(--violet)",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Maxfiy
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: "var(--radius-full)",
              background: "var(--surface-elevated)",
              color: "var(--text-tertiary)",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {memory.type}
          </span>
        </div>
      </div>

      {/* Title & caption */}
      {memory.title && (
        <h3
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "var(--fs-lg)",
            fontWeight: 500,
            letterSpacing: "-0.015em",
            lineHeight: 1.25,
          }}
        >
          {memory.title}
        </h3>
      )}

      {memory.caption && (
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-secondary)",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {memory.caption}
        </p>
      )}

      {memory.locationName && (
        <div
          style={{
            fontSize: "var(--fs-xs)",
            color: "var(--text-tertiary)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>📍</span>
          <span>{memory.locationName}</span>
        </div>
      )}

      {/* Reactions */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          paddingTop: 4,
          borderTop: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {EMOJI_OPTIONS.slice(0, 4).map((emoji) => {
          const count = memory.reactions.filter((r) => r.emoji === emoji).length;
          const mine = myReactions.has(emoji);
          if (count === 0 && !mine) return null;
          return (
            <button
              key={emoji}
              onClick={() => {
                hapticTap("light");
                onReact(emoji);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                background: mine ? "var(--accent-soft)" : "var(--surface-elevated)",
                border: `1px solid ${mine ? "var(--border-accent)" : "var(--border)"}`,
                color: mine ? "var(--accent)" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <span>{emoji}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
      </div>
    </article>
  );
}