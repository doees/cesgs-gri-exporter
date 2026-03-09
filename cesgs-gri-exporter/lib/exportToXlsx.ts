"use client";

import * as XLSX from "xlsx";
import type { GriRow } from "@/lib/normalize";
import type { QaItem } from "@/lib/qa";

type SummaryRow = {
  company: string;
  fy: string;
  inputs_count: number;
  total_rows: number;
  unique_gri_code: number;
  rows_missing_evidence_page: number;
  rows_missing_disclosure_type: number;
  generated_at: string;
};

const GRI_TABLE_COLUMNS = [
  "company",
  "fy",
  "pillar",
  "topic",
  "gri_code",
  "disclosure_title",
  "Indicators",
  "disclosure_type",
  "value_qualitative",
  "value_quantitative",
  "unit",
  "evidence_page",
  "source_input",
] as const;

export function exportWorkbook({
  rows,
  qaLog,
  summary,
  filename,
}: {
  rows: GriRow[];
  qaLog: QaItem[];
  summary: SummaryRow;
  filename: string;
}) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: GRI_Table with fixed column order
  const tableRows = rows.map((r) => {
    const obj: any = {};
    for (const c of GRI_TABLE_COLUMNS) obj[c] = (r as any)[c] ?? null;
    return obj;
  });
  const ws1 = XLSX.utils.json_to_sheet(tableRows, { header: [...GRI_TABLE_COLUMNS] });
  ws1["!cols"] = [
    { wch: 28 }, // company
    { wch: 10 }, // fy
    { wch: 12 }, // pillar
    { wch: 34 }, // topic
    { wch: 10 }, // gri_code
    { wch: 34 }, // disclosure_title
    { wch: 34 }, // Indicators
    { wch: 14 }, // disclosure_type
    { wch: 60 }, // value_qualitative
    { wch: 40 }, // value_quantitative
    { wch: 14 }, // unit
    { wch: 14 }, // evidence_page
    { wch: 10 }, // source_input
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "GRI_Table");

  // Sheet 2: QA_Log
  const qaRows = qaLog.map((q) => ({
    severity: q.severity,
    message: q.message,
    source_input: q.source_input ?? "",
    gri_code: q.gri_code ?? "",
    field: q.field ?? "",
  }));
  const ws2 = XLSX.utils.json_to_sheet(qaRows, {
    header: ["severity", "message", "source_input", "gri_code", "field"],
  });
  ws2["!cols"] = [{ wch: 8 }, { wch: 60 }, { wch: 12 }, { wch: 10 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws2, "QA_Log");

  // Sheet 3: Summary (single row)
  const ws3 = XLSX.utils.json_to_sheet([summary], {
    header: [
      "company",
      "fy",
      "inputs_count",
      "total_rows",
      "unique_gri_code",
      "rows_missing_evidence_page",
      "rows_missing_disclosure_type",
      "generated_at",
    ],
  });
  ws3["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 26 }, { wch: 28 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Summary");

  // Write file (client-side)
  XLSX.writeFile(wb, filename);
}