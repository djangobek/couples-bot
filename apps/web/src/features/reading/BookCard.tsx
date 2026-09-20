import type { BookItem } from "../../types/api";
import { hapticTap } from "../../services/telegram";

export function BookCard({
  book,
  meId,
  onProgress,
}: {
  book: BookItem;
  meId: string | null;
  onProgress: () => void;
}) {
  const avgPercent =
    book.progress.length > 0
      ? book.progress.reduce((s, p) => s + p.percent, 0) / book.progress.length
      : 0;

  return (
    <article
      style={{
        padding: 20,
        borderRadius: "var(--radius-xl)",
        background: "var(--surface)",
        border: `1px solid ${book.status === "COMPLETED" ? "var(--border-accent)" : "var(--border)"}`,
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        animation: "fadeInUp 400ms var(--ease-out)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 10,
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            background:
              book.status === "COMPLETED" ? "var(--success-soft)" : "var(--accent-soft)",
            color: book.status === "COMPLETED" ? "var(--success)" : "var(--accent)",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {book.status === "COMPLETED" ? "Tugatilgan" : "Davom etmoqda"}
        </span>
        {book.pageCount && (
          <span
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--text-tertiary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {book.pageCount} bet
          </span>
        )}
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
        {book.title}
      </h3>

      {book.author && (
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
          }}
        >
          {book.author}
        </p>
      )}

      {/* Progress bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {book.progress.length > 0 ? (
          book.progress.map((p) => {
            const participant = book.participants.find(
              (x) => x.userId === p.userId,
            );
            const name =
              p.userId === meId
                ? "Siz"
                : participant?.user.firstName ?? "Juft";
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
                    {book.pageCount ? ` / ${book.pageCount}` : ""} · {Math.round(p.percent)}%
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
                      boxShadow: "0 0 8px var(--accent-glow)",
                      transition: "width var(--dur-slow) var(--ease-out)",
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--text-tertiary)",
              textAlign: "center",
              padding: 8,
            }}
          >
            Hali progress yo'q
          </div>
        )}
      </div>

      {/* Actions */}
      {book.status === "ACTIVE" && (
        <button
          onClick={() => {
            hapticTap("light");
            onProgress();
          }}
          style={{
            padding: "10px 16px",
            borderRadius: "var(--radius-full)",
            background: "var(--surface-elevated)",
            border: "1px solid var(--border-strong)",
            color: "var(--text-primary)",
            fontSize: "var(--fs-sm)",
            fontWeight: 600,
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          📖 Progress yangilash
        </button>
      )}
    </article>
  );
}