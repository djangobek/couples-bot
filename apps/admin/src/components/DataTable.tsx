/* ============================================================
   DATA TABLE — Generic
   ============================================================ */

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  width?: number | string;
  align?: "left" | "right" | "center";
  render: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading,
  emptyState,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
}) {
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "2px solid var(--border)",
            borderTopColor: "var(--accent)",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto",
          }}
        />
      </div>
    );
  }

  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          minWidth: 600,
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align ?? "left",
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg-subtle)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  width: col.width,
                  whiteSpace: "nowrap",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                cursor: onRowClick ? "pointer" : "default",
                transition: "background 100ms var(--ease-out)",
              }}
              onMouseEnter={(e) => {
                if (onRowClick) {
                  (e.currentTarget as HTMLTableRowElement).style.background =
                    "var(--surface-hover)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background =
                  "transparent";
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    textAlign: col.align ?? "left",
                    verticalAlign: "middle",
                    color: "var(--text-primary)",
                  }}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}