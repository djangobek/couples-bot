/* ============================================================
   LanguageSwitcher — uz / ru / en
   ============================================================ */

import { useLanguage } from "../../i18n/useLanguage";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  const langs: Array<{ code: "uz" | "ru" | "en"; label: string; emoji: string }> =
    [
      { code: "uz", label: "O'zbekcha", emoji: "🇺🇿" },
      { code: "ru", label: "Русский", emoji: "🇷🇺" },
      { code: "en", label: "English", emoji: "🇬🇧" },
    ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {langs.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: active ? "var(--accent-soft)" : "var(--surface)",
              border: `1px solid ${active ? "var(--border-accent)" : "var(--border)"}`,
              color: active ? "var(--accent)" : "var(--text-primary)",
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 18 }}>{l.emoji}</span>
            <span style={{ flex: 1 }}>{l.label}</span>
            {active && <span>✓</span>}
          </button>
        );
      })}
    </div>
  );
}