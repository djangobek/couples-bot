import { useEffect, useState } from "react";

export function NetworkBanner() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "10px 16px",
        paddingTop: "calc(10px + var(--safe-top))",
        background:
          "linear-gradient(180deg, rgba(240,138,149,0.95), rgba(240,138,149,0.85))",
        color: "#fff",
        fontSize: "var(--fs-xs)",
        fontWeight: 600,
        textAlign: "center",
        letterSpacing: "0.02em",
        boxShadow: "0 4px 16px rgba(240,138,149,0.4)",
        animation: "fadeIn var(--dur-base) var(--ease-out)",
      }}
    >
      ⚠ Internet aloqasi yo'q
    </div>
  );
}