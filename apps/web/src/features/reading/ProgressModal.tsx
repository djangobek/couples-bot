import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { api, humanizeError } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { hapticNotify } from "../../services/telegram";
import { useApp } from "../../context/AppContext";
import type { BookItem } from "../../types/api";

export function ProgressModal({
  book,
  open,
  onClose,
  onSaved,
}: {
  book: BookItem | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { me } = useApp();
  const toast = useToast();

  const myProgress = book?.progress.find((p) => p.userId === me?.id);
  const [currentPage, setCurrentPage] = useState(
    myProgress ? String(myProgress.currentPage) : "0",
  );
  const [loading, setLoading] = useState(false);

  // Reset when book changes
  if (book && myProgress && currentPage !== String(myProgress.currentPage)) {
    // This runs on every render but is idempotent thanks to the check
  }

  async function submit() {
    if (!book) return;
    const page = parseInt(currentPage, 10);
    if (isNaN(page) || page < 0) {
      toast.push("Sahifa soni noto'g'ri", "error");
      return;
    }
    const current = myProgress?.currentPage ?? 0;
    const pagesRead = Math.max(0, page - current);
    setLoading(true);
    try {
      await api.updateReadingProgress({
        bookId: book.id,
        currentPage: page,
        pagesRead,
      });
      hapticNotify("success");
      toast.push("Progress yangilandi 📖", "success");
      onSaved();
      onClose();
    } catch (err) {
      hapticNotify("error");
      toast.push(humanizeError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  if (!book) return null;

  return (
    <Modal open={open} onClose={onClose} title={book.title}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Hozirgi sahifangizni kiriting
        </p>

        <div>
          <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Sahifa
          </label>
          <input
            type="number"
            value={currentPage}
            onChange={(e) => setCurrentPage(e.target.value)}
            min="0"
            max={book.pageCount ?? 100000}
            style={{
              ...inputStyle,
              fontSize: 24,
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
            }}
          />
          {book.pageCount && (
            <div
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-tertiary)",
                marginTop: 6,
                textAlign: "center",
              }}
            >
              {book.pageCount} betdan
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="md" fullWidth onClick={onClose}>
            Bekor
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            loading={loading}
            onClick={submit}
          >
            Saqlash
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 14px",
  borderRadius: "var(--radius-md)",
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-primary)",
  outline: "none",
  fontFamily: "inherit",
};