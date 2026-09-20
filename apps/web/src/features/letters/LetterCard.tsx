import { Avatar } from "../../components/Avatar";
import type { LetterItem } from "../../types/api";
import { hapticTap } from "../../services/telegram";

export function LetterCard({
  letter,
  meId,
  onOpen,
}: {
  letter: LetterItem;
  meId: string | null;
  onOpen: () => void;
}) {
  const isMine = letter.senderId === meId;
  const isUnread = letter.receiverId === meId && letter.status === "SENT";
  const other = isMine ? letter.receiver : letter.sender;

  return (
    <button
      onClick={() => {
        hapticTap("light");
        onOpen();
      }}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 20,
        borderRadius: "var(--radius-xl)",
        background: isUnread
          ? "linear-gradient(135deg, rgba(232,165,192,0.08), rgba(180,155,216,0.06))"
          : "var(--surface)",
        border: `1px solid ${isUnread ? "var(--border-accent)" : "var(--border)"}`,
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        cursor: "pointer",
        animation: "fadeInUp 400ms var(--ease-out)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isUnread && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "var(--accent)",
            opacity: 0.15,
            filter: "blur(30px)",
          }}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar
          src={other.photoUrl}
          name={other.firstName}
          size={34}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            {isMine ? "Siz yubordingiz" : `${other.firstName ?? "Juft"} yubordi`}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-tertiary)",
              marginTop: 1,
            }}
          >
            {new Date(letter.createdAt).toLocaleDateString("uz-UZ", {
              day: "numeric",
              month: "long",
            })}
          </div>
        </div>

        {isUnread && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
            }}
          />
        )}
      </div>

      {letter.title && (
        <h3
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "var(--fs-md)",
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          {letter.title}
        </h3>
      )}

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
        {letter.body}
      </p>
    </button>
  );
}