"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

type RowData = Record<string, unknown>;

function parseGriCode(code: string): Array<number | string> {
  return String(code ?? "")
    .trim()
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => {
      const n = Number(part);
      return Number.isFinite(n) && String(n) === part ? n : part.toLowerCase();
    });
}

function compareGriCode(a: string, b: string): number {
  const pa = parseGriCode(a);
  const pb = parseGriCode(b);
  const maxLen = Math.max(pa.length, pb.length);

  for (let i = 0; i < maxLen; i++) {
    const va = pa[i];
    const vb = pb[i];

    if (va === undefined) return -1;
    if (vb === undefined) return 1;

    if (typeof va === "number" && typeof vb === "number") {
      if (va !== vb) return va - vb;
    } else {
      const cmp = String(va).localeCompare(String(vb));
      if (cmp !== 0) return cmp;
    }
  }

  return 0;
}

function parseMultipleJsonArrays(input: string): RowData[] {
  const text = input.trim();

  if (!text) {
    throw new Error("Input kosong.");
  }

  const candidates: string[] = [];

  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "[") {
      if (depth === 0) {
        start = i;
      }
      depth++;
      continue;
    }

    if (char === "]") {
      if (depth > 0) {
        depth--;

        if (depth === 0 && start !== -1) {
          candidates.push(text.slice(start, i + 1));
          start = -1;
        }
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error("Tidak ditemukan JSON array valid. Pastikan output mengandung blok [ ... ].");
  }

  const validRows: RowData[] = [];
  const errors: string[] = [];

  candidates.forEach((candidate, index) => {
    try {
      const parsed = JSON.parse(candidate);

      if (!Array.isArray(parsed)) {
        return;
      }

      const objectRows = parsed.filter(
        (item) => item && typeof item === "object" && !Array.isArray(item)
      ) as RowData[];

      if (objectRows.length > 0) {
        validRows.push(...objectRows);
      }
    } catch (error) {
      errors.push(`Blok ke-${index + 1}: ${(error as Error).message}`);
    }
  });

  if (validRows.length === 0) {
    throw new Error(
      `Tidak ada JSON array yang berhasil diproses. Detail error: ${errors.join(" | ")}`
    );
  }

  return validRows;
}

function buildSummary(rows: RowData[], qaLog: ReturnType<typeof buildQaLog>) {
  const company = String(rows[0]?.company ?? "");
  const fy = String(rows[0]?.fy ?? "");

  return [
    {
      company,
      fy,
      total_rows: rows.length,
      unique_gri_code: new Set(
        rows.map((row) => String(row.gri_code ?? "").trim()).filter(Boolean)
      ).size,
      rows_missing_evidence_page: rows.filter(
        (row) => !String(row.evidence_page ?? "").trim()
      ).length,
      rows_missing_disclosure_type: rows.filter(
        (row) => !String(row.disclosure_type ?? "").trim()
      ).length,
      warning_count: qaLog.filter((q) => q.severity === "WARN").length,
      error_count: qaLog.filter((q) => q.severity === "ERROR").length,
      generated_at: new Date().toISOString(),
    },
  ];
}

export default function Home() {
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState("");
  const [previewCount, setPreviewCount] = useState<number>(0);

  function convertToExcel() {
    try {
      setStatus("Processing...");

      const mergedRows = parseMultipleJsonArrays(jsonInput);

      const sortedRows = [...mergedRows].sort((a, b) =>
        compareGriCode(String(a.gri_code ?? ""), String(b.gri_code ?? ""))
      );

      const qaLog = buildQaLog(sortedRows);
      const summary = buildSummary(sortedRows, qaLog);

      const workbook = XLSX.utils.book_new();

      const griTableSheet = XLSX.utils.json_to_sheet(sortedRows);
      const qaSheet = XLSX.utils.json_to_sheet(qaLog);
      const summarySheet = XLSX.utils.json_to_sheet(summary);

      griTableSheet["!cols"] = [
        { wch: 30 }, // company
        { wch: 30 }, // Indicators
        { wch: 15 }, // pillar
        { wch: 35 }, // topic
        { wch: 12 }, // gri_code
        { wch: 35 }, // disclosure_title
        { wch: 10 }, // fy
        { wch: 16 }, // disclosure_type
        { wch: 45 }, // value_quantitative
        { wch: 18 }, // unit
        { wch: 70 }, // value_qualitative
        { wch: 18 }, // evidence_page
      ];

      qaSheet["!cols"] = [
        { wch: 10 },
        { wch: 30 },
        { wch: 15 },
        { wch: 20 },
      ];

      summarySheet["!cols"] = [
        { wch: 30 },
        { wch: 10 },
        { wch: 12 },
        { wch: 18 },
        { wch: 28 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 28 },
      ];

      XLSX.utils.book_append_sheet(workbook, griTableSheet, "GRI_Table");
      XLSX.utils.book_append_sheet(workbook, qaSheet, "QA_Log");
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      const companyName = String(summary[0].company || "Company")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "");
      const fy = String(summary[0].fy || "FY").replace(/[^\w\s-]/g, "");

      XLSX.writeFile(
        workbook,
        `CESGS_GRI_Exporter_${companyName}_${fy}.xlsx`
      );

      setPreviewCount(sortedRows.length);
      setStatus(
        `Success. ${sortedRows.length} rows berhasil digabung dan di-export ke Excel.`
      );
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${(error as Error).message}`);
      alert(`JSON tidak valid.\n\n${(error as Error).message}`);
    }
  }

  return (
    <main
      style={{
        maxWidth: 1000,
        margin: "40px auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        lineHeight: 1.5,
      }}
    >
      <h1>CESGS GRI Exporter</h1>

      <p>
        Paste multiple GRI mapping JSONs and download one clean Excel file.
      </p>

      <ul>
        <li>Runs locally in your browser</li>
        <li>Supports multiple JSON arrays in one paste</li>
        <li>Exports 3 sheets: GRI_Table, QA_Log, Summary</li>
        <li>Automatically sorts by GRI code ascending</li>
      </ul>

      <div style={{ marginTop: 20 }}>
        <label
          htmlFor="jsonInput"
          style={{ display: "block", marginBottom: 8, fontWeight: 700 }}
        >
          Paste JSON batch di sini
        </label>
        <textarea
          id="jsonInput"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={`Contoh supported input:

[ { "gri_code": "2-1" }, { "gri_code": "2-2" } ]

[ { "gri_code": "2-3" }, { "gri_code": "2-4" } ]`}
          style={{
            width: "100%",
            minHeight: 420,
            padding: 12,
            fontFamily: "Consolas, monospace",
            fontSize: 13,
            border: "1px solid #ccc",
            borderRadius: 8,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={convertToExcel}
          style={{
            padding: "12px 18px",
            fontSize: 16,
            cursor: "pointer",
            borderRadius: 8,
            border: "none",
            background: "#111",
            color: "#fff",
          }}
        >
          Start Converting
        </button>

        <button
          onClick={() => {
            setJsonInput("");
            setStatus("");
            setPreviewCount(0);
          }}
          style={{
            padding: "12px 18px",
            fontSize: 16,
            cursor: "pointer",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#fff",
          }}
        >
          Clear
        </button>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 12,
          borderRadius: 8,
          background: "#f6f6f6",
          border: "1px solid #e2e2e2",
        }}
      >
        <strong>Status:</strong>{" "}
        {status || "Belum ada proses. Paste JSON lalu klik Start Converting."}
      </div>

      {previewCount > 0 && (
        <div style={{ marginTop: 12 }}>
          <strong>Total rows processed:</strong> {previewCount}
        </div>
      )}

      <div
        style={{
          marginTop: 28,
          padding: 16,
          borderRadius: 8,
          background: "#fafafa",
          border: "1px solid #eee",
        }}
      >
        <strong>Catatan penting:</strong>
        <ul style={{ marginTop: 8 }}>
          <li>
            Kamu boleh paste beberapa blok JSON array sekaligus, misalnya:
            <code style={{ marginLeft: 6 }}>[...] [...] [...]</code>
          </li>
          <li>
            Converter akan otomatis merge semua array tanpa perlu ubah
            <code style={{ marginLeft: 6 }}>][</code> menjadi koma.
          </li>
          <li>
            Kalau ada field kosong seperti <code>evidence_page</code> atau{" "}
            <code>disclosure_type</code>, datanya tetap masuk, tapi akan tercatat
            di sheet <code>QA_Log</code>.
          </li>
        </ul>
      </div>
    </main>
  );
}
