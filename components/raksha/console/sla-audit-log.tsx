"use client";

// ─── SLA AUDIT LOG ──────────────────────────────────────────────────────────
// Inline-expanding audit table with CSV export (pure JS Blob, no libraries).

export interface AuditRow {
  stage: string;
  action: string;
  target: string;
  actual: string;
  pass: boolean;
}

const C = {
  surface: "#111620",
  border: "#1e2535",
  red: "#e53935",
  green: "#10b981",
  text: "#f0f4ff",
  muted: "#8892a4",
};

function csvEscape(value: string): string {
  // Wrap every cell in double quotes; escape inner quotes by doubling them.
  return `"${String(value).replace(/"/g, '""')}"`;
}

function downloadCsv(patientName: string, rows: AuditRow[]) {
  const date = new Date().toISOString().slice(0, 10);
  const header = ["Stage", "Action taken", "SLA target", "Actual time", "Status"];
  const lines = [
    header.map(csvEscape).join(","),
    ...rows.map((r) =>
      [r.stage, r.action, r.target, r.actual, r.pass ? "PASS" : "FAIL"]
        .map(csvEscape)
        .join(","),
    ),
  ];
  const csv = lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const safeName = patientName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  const a = document.createElement("a");
  a.href = url;
  a.download = `sla-audit-${safeName}-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SLAAuditLog({
  patientName,
  rows,
}: {
  patientName: string;
  rows: AuditRow[];
}) {
  return (
    <div
      style={{
        marginTop: 16,
        background: "#0d121b",
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: C.text,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Audit Log — {patientName}
        </div>
        <button
          onClick={() => downloadCsv(patientName, rows)}
          style={{
            background: "transparent",
            color: C.text,
            border: `1px solid ${C.border}`,
            padding: "7px 14px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            borderRadius: 6,
          }}
        >
          Export CSV
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12.5,
          }}
        >
          <thead>
            <tr>
              {["Stage", "Action taken", "SLA target", "Actual time", "Status"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 18px",
                      color: C.muted,
                      fontWeight: 500,
                      letterSpacing: "0.4px",
                      textTransform: "uppercase",
                      fontSize: 10.5,
                      whiteSpace: "nowrap",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: "11px 18px", color: C.text, borderBottom: `1px solid ${C.border}` }}>
                  {r.stage}
                </td>
                <td style={{ padding: "11px 18px", color: C.muted, borderBottom: `1px solid ${C.border}` }}>
                  {r.action}
                </td>
                <td
                  style={{
                    padding: "11px 18px",
                    color: C.muted,
                    fontFamily: "'JetBrains Mono', monospace",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  {r.target}
                </td>
                <td
                  style={{
                    padding: "11px 18px",
                    color: C.text,
                    fontFamily: "'JetBrains Mono', monospace",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  {r.actual}
                </td>
                <td style={{ padding: "11px 18px", borderBottom: `1px solid ${C.border}` }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 999,
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                      color: r.pass ? C.green : C.red,
                      background: r.pass
                        ? "rgba(16,185,129,0.12)"
                        : "rgba(229,57,53,0.12)",
                      border: `1px solid ${r.pass ? "rgba(16,185,129,0.4)" : "rgba(229,57,53,0.4)"}`,
                    }}
                  >
                    {r.pass ? "PASS" : "FAIL"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
