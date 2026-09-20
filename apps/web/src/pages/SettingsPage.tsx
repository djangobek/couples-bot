/* ============================================================
   SettingsPage — til, mavzu, haqida
   ============================================================ */

import { ThemeSwitcher } from "../features/settings/ThemeSwitcher";
import { LanguageSwitcher } from "../features/settings/LanguageSwitcher";
import { useLanguage } from "../i18n/useLanguage";

export function SettingsPage() {
  const { t } = useLanguage();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        paddingTop: 8,
      }}
    >
      <header style={{ animation: "fadeInUp 500ms var(--ease-out)" }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          {t("settings.title")}
        </p>
        <h1
          className="display-italic"
          style={{
            fontSize: "clamp(2.5rem, 9vw, 3.25rem)",
            color: "var(--text-primary)",
            marginBottom: 12,
          }}
        >
          {t("settings.title")}
        </h1>
      </header>

      {/* Theme */}
      <section
        style={{
          animation: "fadeInUp 500ms var(--ease-out) 60ms backwards",
        }}
      >
        <p
          style={{
            fontSize: "var(--fs-xs)",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            marginBottom: 10,
          }}
        >
          {t("settings.theme")}
        </p>
        <ThemeSwitcher />
      </section>

      {/* Language */}
      <section
        style={{
          animation: "fadeInUp 500ms var(--ease-out) 120ms backwards",
        }}
      >
        <p
          style={{
            fontSize: "var(--fs-xs)",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            marginBottom: 10,
          }}
        >
          {t("settings.language")}
        </p>
        <LanguageSwitcher />
      </section>

      {/* About */}
      <section
        style={{
          animation: "fadeInUp 500ms var(--ease-out) 180ms backwards",
        }}
      >
        <p
          style={{
            fontSize: "var(--fs-xs)",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            marginBottom: 10,
          }}
        >
          {t("settings.about")}
        </p>
        <div
          style={{
            borderRadius: "var(--radius-lg)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <Row label="Couples" value="Two people. One world." />
          <Row label={t("settings.version")} value="0.1.0" last />
        </div>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: "14px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: last ? "none" : "1px solid var(--border)",
        fontSize: "var(--fs-sm)",
      }}
    >
      <span style={{ color: "var(--text-primary)" }}>{label}</span>
      <span style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-xs)" }}>
        {value}
      </span>
    </div>
  );
}