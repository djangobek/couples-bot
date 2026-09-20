import { useCallback, useEffect, useState } from "react";
import { BookCard } from "./BookCard";
import { EmptyState } from "../../components/EmptyState";
import { Button } from "../../components/Button";
import { SkeletonCard } from "../../components/Skeleton";
import { api, humanizeError } from "../../services/api";
import { useApp } from "../../context/AppContext";
import type { BookItem } from "../../types/api";

export function BookList({
  onCreateClick,
  onProgressClick,
}: {
  onCreateClick: () => void;
  onProgressClick: (book: BookItem) => void;
}) {
  const { me } = useApp();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBooks(await api.listBooks());
    } catch (err) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            marginBottom: 16,
          }}
        >
          {error}
        </p>
        <Button variant="secondary" size="md" onClick={load}>
          Qayta urinish
        </Button>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <EmptyState
        icon={<BookIcon />}
        title="Hali kitoblar yo'q."
        description="Birgalikda kitob o'qing. Sahifalarni, progressni va streakingizni kuzatib boring."
        action={
          <Button variant="primary" size="md" onClick={onCreateClick}>
            + Kitob qo'shish
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Button variant="outline" size="md" fullWidth onClick={onCreateClick}>
        + Yangi kitob
      </Button>
      {books.map((b) => (
        <BookCard
          key={b.id}
          book={b}
          meId={me?.id ?? null}
          onProgress={() => onProgressClick(b)}
        />
      ))}
    </div>
  );
}

function BookIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z" />
      <path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />
    </svg>
  );
}