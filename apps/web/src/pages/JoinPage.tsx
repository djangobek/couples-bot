import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { LoadingScreen } from "../components/LoadingScreen";
import { api, humanizeError } from "../services/api";
import { hapticNotify } from "../services/telegram";
import type { InvitePreviewResponse } from "../types/api";

export function JoinPage({
  code,
  onJoined,
  onBack,
}: {
  code: string;
  onJoined: () => void;
  onBack: () => void;
}) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; preview: InvitePreviewResponse }
    | { status: "error"; message: string }
    | { status: "accepting" }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const preview = await api.previewInvite(code);
        if (!cancelled) setState({ status: "ready", preview });
      } catch (err) {
        if (!cancelled)
          setState({ status: "error", message: humanizeError(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function accept() {
    setState({ status: "accepting" });
    try {
      await api.acceptInvite(code);
      hapticNotify("success");
      onJoined();
    } catch (err) {
      hapticNotify("error");
      setState({ status: "error", message: humanizeError(err) });
    }
  }

  if (state.status === "loading" || state.status === "accepting") {
    return (
      <LoadingScreen
        label={state.status === "accepting" ? "Qo'shilmoqda…" : "Taklif yuklanmoqda…"}
      />
    );
  }

  if (state.status === "error") {
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
        <div style={{ fontSize: 48, opacity: 0.5, marginBottom: 8 }}>💔</div>
        <h2
          className="display-italic"
          style={{
            fontSize: "var(--fs-2xl)",
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          Taklif mavjud emas.
        </h2>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            maxWidth: 300,
            lineHeight: 1.6,
          }}
        >
          {state.message}
        </p>
        <Button variant="secondary" size="md" onClick={onBack}>
          Orqaga
        </Button>
      </div>
    );
  }

  const { preview } = state;
  const sender = preview.sender;

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 28,
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "var(--accent)",
          opacity: 0.12,
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative" }}>
        <Avatar
          src={sender.photoUrl ?? null}
          name={sender.firstName ?? null}
          size={88}
          ring
        />
      </div>

      <div style={{ position: "relative" }}>
        <p
          className="eyebrow"
          style={{ marginBottom: 12, color: "var(--accent)" }}
        >
          Maxfiy taklif
        </p>
        <h1
          className="display-italic"
          style={{
            fontSize: "clamp(2rem, 8vw, 2.75rem)",
            color: "var(--text-primary)",
            lineHeight: 1.05,
            marginBottom: 12,
          }}
        >
          {sender.firstName ?? "Kimdir"} sizni taklif qilmoqda
        </h1>
        <p
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-tertiary)",
            maxWidth: 300,
            margin: "0 auto",
            lineHeight: 1.65,
          }}
        >
          "Couples"dagi maxfiy dunyosiga qo'shiling. Ikki kishi. Bir dunyo.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          width: "100%",
          maxWidth: 320,
        }}
      >
        <Button variant="secondary" size="md" fullWidth onClick={onBack}>
          Hozir emas
        </Button>
        <Button variant="primary" size="md" fullWidth onClick={accept}>
          Qabul qilish
        </Button>
      </div>
    </div>
  );
}