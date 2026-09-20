/* ============================================================
   SEARCH INPUT — Debounced
   ============================================================ */

import { useEffect, useRef, useState } from "react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Qidirish…",
  delay = 300,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  delay?: number;
}) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (local !== value) onChange(local);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, delay]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 12,
          fontSize: 14,
          color: "var(--text-tertiary)",
          pointerEvents: "none",
        }}
      >
        🔍
      </span>
      <input
        type="text"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        style={{
          width: "100%",
          height: 36,
          padding: "0 36px 0 36px",
          borderRadius: "var(--radius-md)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          fontSize: 13,
          outline: "none",
          fontFamily: "inherit",
          transition: "border-color 140ms var(--ease-out)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--border-accent)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      />
      {local && (
        <button
          onClick={() => setLocal("")}
          aria-label="Tozalash"
          style={{
            position: "absolute",
            right: 8,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--surface-elevated)",
            color: "var(--text-tertiary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}