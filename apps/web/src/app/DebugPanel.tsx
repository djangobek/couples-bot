import { useEffect, useState } from "react";
import { getInitData, getTelegramUser, tg } from "../services/telegram";

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});

  const initData = getInitData();
  const user = getTelegramUser();
  const apiUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ??
    "http://localhost:3001";

  async function runChecks() {
    const out: Record<string, string> = {};

    out["initData uzunligi"] = String(initData.length);
    out["Telegram user"] = user ? JSON.stringify(user) : "(yo'q)";
    out["Platform"] = tg?.platform ?? "unknown";
    out["VITE_API_URL"] = apiUrl;

    try {
      const res = await fetch(`${apiUrl}/health`);
      const text = await res.text();
      out["GET /health"] = `${res.status} → ${text.slice(0, 100)}`;
    } catch (err) {
      out["GET /health"] = `❌ ${(err as Error).message}`;
    }

    try {
      const res = await fetch(`${apiUrl}/v1/home`, {
        headers: { "X-Telegram-Init-Data": initData },
      });
      const text = await res.text();
      out["GET /v1/home"] = `${res.status} → ${text.slice(0, 200)}`;
    } catch (err) {
      out["GET /v1/home"] = `❌ ${(err as Error).message}`;
    }

    setResults(out);
  }

  useEffect(() => {
    if (open) void runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: "calc(var(--nav-height) + var(--safe-bottom) + 12px)",
          right: 12,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: open ? "var(--danger)" : "var(--surface-elevated)",
          border: "1px solid var(--border-strong)",
          color: open ? "#fff" : "var(--text-primary)",
          fontSize: 18,
          zIndex: 80,
          boxShadow: "var(--shadow-lg)",
        }}
        aria-label="Debug"
      >
        {open ? "✕" : "🐞"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 79,
            background: "rgba(0,0,0,0.9)",
            padding: "var(--space-4)",
            paddingTop: "calc(var(--space-4) + var(--safe-top))",
            overflowY: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "#e0e0e0",
          }}
        >
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto",
              background: "#111",
              borderRadius: 12,
              padding: 16,
              border: "1px solid #333",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <strong>🐞 Debug</strong>
              <button
                onClick={runChecks}
                style={{
                  padding: "4px 10px",
                  background: "#222",
                  border: "1px solid #444",
                  borderRadius: 6,
                  color: "#fff",
                }}
              >
                Qayta
              </button>
            </div>

            {Object.entries(results).map(([key, value]) => (
              <div
                key={key}
                style={{
                  marginBottom: 10,
                  padding: 10,
                  background: "#1a1a1a",
                  borderRadius: 6,
                  borderLeft: value.startsWith("❌")
                    ? "3px solid #ef6b7a"
                    : "3px solid #5ec98f",
                }}
              >
                <div style={{ color: "#888", marginBottom: 4 }}>{key}</div>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {value}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}