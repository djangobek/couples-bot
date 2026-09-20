/* ============================================================
   SubscriptionGate — blocks app until subscription is verified
   ============================================================ */

import { useState, type ReactNode } from "react";
import { Button } from "../../components/Button";
import { useSubscription } from "./useSubscription";
import { openExternal } from "../../services/telegram";

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const { status, loading, checking, error, check } = useSubscription();
  const [justChecked, setJustChecked] = useState(false);

  async function handleCheck() {
    const ok = await check();
    setJustChecked(true);
    /* If successful, the status update will re-render children */
    if (!ok) {
      /* Re-show error state via justChecked flag */
    }
  }

  /* Loading initial */
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 20,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid var(--border-strong)",
            borderTopColor: "var(--accent)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
          }}
        >
          Obuna tekshirilmoqda…
        </p>
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 20,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, opacity: 0.4 }}>⚠</div>
        <h2
          className="display-italic"
          style={{ fontSize: "var(--fs-xl)", fontWeight: 500 }}
        >
          Xatolik
        </h2>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            maxWidth: 320,
            lineHeight: 1.6,
          }}
        >
          {error}
        </p>
        <Button variant="primary" size="md" onClick={handleCheck}>
          Qayta urinish
        </Button>
      </div>
    );
  }

  /* If no channels required OR user is subscribed — pass through */
  if (!status || status.isSubscribed || status.channels.length === 0) {
    return <>{children}</>;
  }

  /* Not subscribed — show block screen */
  const missing = status.channels.filter((c) => !c.isMember);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 24,
        textAlign: "center",
        position: "relative",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "var(--accent)",
          opacity: 0.12,
          filter: "blur(80px)",
        }}
      />

      <div
        style={{
          fontSize: 64,
          animation: "breathe 2.4s ease-in-out infinite",
        }}
      >
        📢
      </div>

      <div>
        <p
          className="eyebrow"
          style={{ marginBottom: 10, color: "var(--accent)" }}
        >
          Majburiy obuna
        </p>
        <h1
          className="display-italic"
          style={{
            fontSize: "clamp(1.75rem, 8vw, 2.5rem)",
            color: "var(--text-primary)",
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          Kanallarga obuna bo'ling
        </h1>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            maxWidth: 340,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Couples'dan foydalanish uchun quyidagi kanallarga obuna bo'ling.
        </p>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {missing.map((ch) => (
          <button
            key={ch.id}
            onClick={() => ch.link && openExternal(ch.link)}
            style={{
              padding: "14px 18px",
              borderRadius: "var(--radius-lg)",
              background:
                "linear-gradient(135deg, rgba(232,165,192,0.08), rgba(180,155,216,0.05))",
              border: "1px solid var(--border-accent)",
              color: "var(--text-primary)",
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
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--accent-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              ➕
            </span>
            <span style={{ flex: 1 }}>{ch.label}</span>
            <span style={{ color: "var(--text-tertiary)" }}>→</span>
          </button>
        ))}
      </div>

      {justChecked && !status.isSubscribed && (
        <p
          style={{
            fontSize: "var(--fs-xs)",
            color: "var(--danger)",
            maxWidth: 320,
          }}
        >
          Siz hali barcha kanallarga obuna bo'lmadingiz.
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        loading={checking}
        onClick={handleCheck}
        style={{ minWidth: 220 }}
      >
        ✅ Obunani tekshirish
      </Button>
    </div>
  );
}