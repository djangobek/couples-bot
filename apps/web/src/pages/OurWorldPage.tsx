import { useState } from "react";
import { MemoryList } from "../features/memories/MemoryList";
import { CreateMemoryModal } from "../features/memories/CreateMemoryModal";
import { LetterList } from "../features/letters/LetterList";
import { CreateLetterModal } from "../features/letters/CreateLetterModal";
import { DateList } from "../features/dates/DateList";
import { CreateDateModal } from "../features/dates/CreateDateModal";
import { BookList } from "../features/reading/BookList";
import { CreateBookModal } from "../features/reading/CreateBookModal";
import { ProgressModal } from "../features/reading/ProgressModal";
import { hapticSelection } from "../services/telegram";
import type { BookItem } from "../types/api";

type Section = "memories" | "letters" | "dates" | "reading";

const SECTIONS: {
  key: Section;
  label: string;
  emoji: string;
}[] = [
  { key: "memories", label: "Xotiralar", emoji: "📸" },
  { key: "letters", label: "Xatlar", emoji: "💌" },
  { key: "dates", label: "Sanalar", emoji: "🗓️" },
  { key: "reading", label: "Kitoblar", emoji: "📖" },
];

export function OurWorldPage() {
  const [section, setSection] = useState<Section>("memories");

  // Modals
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [letterModalOpen, setLetterModalOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [progressBook, setProgressBook] = useState<BookItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function bump() {
    setRefreshKey((k) => k + 1);
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
          Bizning dunyo
        </p>
        <h1
          className="display-italic"
          style={{
            fontSize: "clamp(2.5rem, 9vw, 3.25rem)",
            color: "var(--text-primary)",
            marginBottom: 12,
          }}
        >
          Bizning dunyo.
        </h1>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            maxWidth: 340,
            lineHeight: 1.6,
          }}
        >
          Faqat ikkimizga tegishli maxfiy joy. Bu yerda vaqt to'xtaydi.
        </p>
      </section>

      {/* ============ SECTION TABS ============ */}
      <div
        role="tablist"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          marginLeft: -20,
          marginRight: -20,
          paddingLeft: 20,
          paddingRight: 20,
          scrollbarWidth: "none",
          animation: "fadeInUp 500ms var(--ease-out) 60ms backwards",
        }}
      >
        {SECTIONS.map((s) => {
          const active = section === s.key;
          return (
            <button
              key={s.key}
              role="tab"
              aria-selected={active}
              onClick={() => {
                hapticSelection();
                setSection(s.key);
              }}
              style={{
                flexShrink: 0,
                padding: "10px 16px",
                borderRadius: "var(--radius-full)",
                background: active
                  ? "linear-gradient(180deg, var(--accent-soft), rgba(232,165,192,0.05))"
                  : "var(--surface)",
                border: `1px solid ${active ? "var(--border-accent)" : "var(--border)"}`,
                color: active ? "var(--accent)" : "var(--text-secondary)",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "all var(--dur-base) var(--ease-out)",
                boxShadow: active
                  ? "0 4px 14px var(--accent-tint), inset 0 1px 0 rgba(255,255,255,0.04)"
                  : "none",
              }}
            >
              <span aria-hidden style={{ fontSize: 15 }}>
                {s.emoji}
              </span>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ============ SECTION CONTENT ============ */}
      <div
        key={`${section}-${refreshKey}`}
        style={{ animation: "fadeInUp 400ms var(--ease-out)" }}
      >
        {section === "memories" && (
          <MemoryList onCreateClick={() => setMemoryModalOpen(true)} />
        )}
        {section === "letters" && (
          <LetterList onCreateClick={() => setLetterModalOpen(true)} />
        )}
        {section === "dates" && (
          <DateList onCreateClick={() => setDateModalOpen(true)} />
        )}
        {section === "reading" && (
          <BookList
            onCreateClick={() => setBookModalOpen(true)}
            onProgressClick={(book) => setProgressBook(book)}
          />
        )}
      </div>

      {/* ============ MODALS ============ */}
      <CreateMemoryModal
        open={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
        onCreated={bump}
      />
      <CreateLetterModal
        open={letterModalOpen}
        onClose={() => setLetterModalOpen(false)}
        onCreated={bump}
      />
      <CreateDateModal
        open={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        onCreated={bump}
      />
      <CreateBookModal
        open={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        onCreated={bump}
      />
      <ProgressModal
        book={progressBook}
        open={progressBook !== null}
        onClose={() => setProgressBook(null)}
        onSaved={bump}
      />
    </div>
  );
}