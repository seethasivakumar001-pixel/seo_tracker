import React, { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { monthKeys, monthLabel, getDifficultyInfo, formatPosition } from "../data/keywordData";

export default function Monthly({ rows = [], setRows }) {
  const months = monthKeys(6);
  const [from, setFrom] = useState(months[0]);
  const [to, setTo] = useState(months.at(-1));

  const pos = (r, m) => r.monthly?.[m];
  const diff = (r) => (pos(r, from) && pos(r, to) ? pos(r, from) - pos(r, to) : null); // + = improved

  const setPos = (id, m, v) => {
    if (!setRows) return;
    setRows(
      rows.map((r) => {
        if (r.id !== id) return r;
        const monthly = { ...(r.monthly || {}) };
        const raw = String(v).trim();
        if (raw === ">100" || raw === "100+" || raw === "101" || raw === "> 100" || raw === "<100") {
          monthly[m] = 101;
        } else if (raw === "") {
          delete monthly[m];
        } else {
          const n = Number(raw.replace(/[^0-9]/g, ""));
          if (n >= 100) monthly[m] = 101;
          else if (n >= 1) monthly[m] = n;
          else delete monthly[m];
        }
        return { ...r, monthly };
      })
    );
  };

  const diffs = rows.map(diff).filter((d) => d !== null);
  const summary = [
    ["Improved", diffs.filter((d) => d > 0).length],
    ["Dropped", diffs.filter((d) => d < 0).length],
    ["Unchanged", diffs.filter((d) => d === 0).length],
  ];

  const head = [
    "Keyword",
    "Group",
    "Volume",
    "Difficulty",
    ...months.map(monthLabel),
    `Change (${monthLabel(from)} vs ${monthLabel(to)})`,
  ];

  const body = () =>
    rows.map((r) => {
      const kd = getDifficultyInfo(r.difficulty || 40);
      return [
        r.keyword,
        r.group,
        r.volume ? r.volume.toLocaleString("en-IN") : "–",
        `${kd.score}% (${kd.level})`,
        ...months.map((m) => (pos(r, m) ? formatPosition(pos(r, m)) : "")),
        diff(r) ?? "",
      ];
    });

  const toExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([head, ...body()]);
    ws["!cols"] = [
      { wch: 28 },
      { wch: 14 },
      { wch: 12 },
      { wch: 16 },
      ...months.map(() => ({ wch: 9 })),
      { wch: 26 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Keyword Analysis");
    XLSX.writeFile(wb, "keyword-seo-report.xlsx");
  };

  const toPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("SEO Keyword Monthly Ranking & Difficulty Report", 14, 15);
    doc.setFontSize(9);
    doc.text(
      `Comparison: ${monthLabel(from)} vs ${monthLabel(to)} | Total Keywords: ${rows.length} | Improved: ${summary[0][1]}, Dropped: ${summary[1][1]}, Unchanged: ${summary[2][1]}.`,
      14,
      21
    );
    autoTable(doc, {
      head: [head],
      body: body(),
      startY: 26,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [67, 56, 202] },
    });
    doc.save("keyword-seo-report.pdf");
  };

  return (
    <div className="monthly-comparison-view">
      {/* Controls Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
          padding: "12px 16px",
          background: "var(--panel, rgba(15, 23, 42, 0.6))",
          border: "1px solid var(--line, rgba(255, 255, 255, 0.08))",
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink, #f8fafc)" }}>
            Compare Variance:
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--mute, #94a3b8)" }}>From</span>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{
                background: "var(--bg, #0f172a)",
                color: "var(--ink, #f8fafc)",
                border: "1px solid var(--line, rgba(255, 255, 255, 0.12))",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: "0.82rem",
              }}
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--mute, #94a3b8)" }}>To</span>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                background: "var(--bg, #0f172a)",
                color: "var(--ink, #f8fafc)",
                border: "1px solid var(--line, rgba(255, 255, 255, 0.12))",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: "0.82rem",
              }}
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, marginLeft: 8 }}>
            <span
              style={{
                fontSize: "0.78rem",
                padding: "3px 8px",
                borderRadius: 6,
                background: "rgba(16, 185, 129, 0.12)",
                color: "var(--up, #10b981)",
                fontWeight: 600,
              }}
            >
              ▲ {summary[0][1]} Improved
            </span>
            <span
              style={{
                fontSize: "0.78rem",
                padding: "3px 8px",
                borderRadius: 6,
                background: "rgba(244, 63, 94, 0.12)",
                color: "var(--down, #f43f5e)",
                fontWeight: 600,
              }}
            >
              ▼ {summary[1][1]} Dropped
            </span>
            <span
              style={{
                fontSize: "0.78rem",
                padding: "3px 8px",
                borderRadius: 6,
                background: "rgba(148, 163, 184, 0.12)",
                color: "var(--mute, #94a3b8)",
                fontWeight: 600,
              }}
            >
              = {summary[2][1]} Unchanged
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn-header-outline"
            style={{ padding: "6px 12px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={toExcel}
          >
            📊 Export Excel
          </button>
          <button
            type="button"
            className="btn-header-outline"
            style={{ padding: "6px 12px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={toPdf}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="tablewrap" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", minWidth: 200 }}>Keyword</th>
              <th style={{ textAlign: "left", width: 110 }}>Group</th>
              <th style={{ textAlign: "right", width: 90 }}>Volume</th>
              <th style={{ textAlign: "center", width: 90 }}>KD%</th>
              {months.map((m) => (
                <th key={m} style={{ textAlign: "center", width: 75 }}>
                  {monthLabel(m)}
                </th>
              ))}
              <th style={{ textAlign: "center", width: 100 }}>
                Diff ({monthLabel(from)} → {monthLabel(to)})
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = diff(r);
              const kd = getDifficultyInfo(r.difficulty || 40);
              return (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--ink, #f8fafc)" }}>{r.keyword}</div>
                    {r.url && <div className="muted" style={{ fontSize: "0.72rem" }}>{r.url}</div>}
                  </td>
                  <td>
                    <span className="category-chip" style={{ fontSize: "0.75rem" }}>
                      {r.group || "General"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", color: "var(--ink, #f8fafc)", fontSize: "0.85rem" }}>
                    {r.volume ? r.volume.toLocaleString("en-IN") : "–"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: kd.color,
                        background: kd.bg,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {kd.score}%
                    </span>
                  </td>
                  {months.map((m) => {
                    const currentPos = pos(r, m);
                    return (
                      <td key={m} style={{ textAlign: "center", padding: "4px 2px" }}>
                        <input
                          type="text"
                          defaultValue={currentPos ? (currentPos > 100 ? ">100" : currentPos) : ""}
                          onBlur={(e) => setPos(r.id, m, e.target.value)}
                          placeholder="–"
                          style={{
                            width: 50,
                            textAlign: "center",
                            fontSize: "0.82rem",
                            padding: "3px 0",
                            background: currentPos ? "rgba(99, 102, 241, 0.08)" : "transparent",
                            border: "1px solid var(--line, rgba(255, 255, 255, 0.08))",
                            borderRadius: 4,
                            color: "var(--ink, #f8fafc)",
                          }}
                        />
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "center" }}>
                    {d === null ? (
                      <span className="muted">–</span>
                    ) : d > 0 ? (
                      <span style={{ color: "var(--up, #10b981)", fontWeight: 700, fontSize: "0.85rem" }}>
                        ▲ +{d}
                      </span>
                    ) : d < 0 ? (
                      <span style={{ color: "var(--down, #f43f5e)", fontWeight: 700, fontSize: "0.85rem" }}>
                        ▼ {d}
                      </span>
                    ) : (
                      <span className="muted" style={{ fontWeight: 600 }}>0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
