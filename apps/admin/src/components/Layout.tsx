/* ============================================================
   LAYOUT — Sidebar + Topbar + Content
   ============================================================ */

import { useState, type ReactNode } from "react";
import { Sidebar, type NavKey } from "./Sidebar";
import { Topbar } from "./Topbar";

export function Layout({
  active,
  onNavChange,
  title,
  children,
}: {
  active: NavKey;
  onNavChange: (k: NavKey) => void;
  title: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      <Sidebar
        active={active}
        onChange={onNavChange}
        collapsed={collapsed}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Topbar title={title} />
        <main
          style={{
            flex: 1,
            padding: 24,
            overflowY: "auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}