import type { GriRow } from "@/lib/normalize";

export type QaItem = {
  severity: "WARN" | "ERROR";
  message: string;
  source_input?: string;
  gri_code?: string | null;
  field?: string;
};

export function runQaChecks(rows: GriRow[]): QaItem[] {
  const qa: QaItem[] = [];

  for (const r of rows) {
    const code = r.gri_code ?? null;

    if (!String(r.gri_code ?? "").trim()) {
      qa.push({
        severity: "ERROR",
        message: "Missing gri_code (row kept but flagged).",
        source_input: r.source_input,
        gri_code: code,
        field: "gri_code",
      });
    }

    if (!String(r.evidence_page ?? "").trim()) {
      qa.push({
        severity: "WARN",
        message: "Missing evidence_page.",
        source_input: r.source_input,
        gri_code: code,
        field: "evidence_page",
      });
    }

    if (!String(r.disclosure_type ?? "").trim()) {
      qa.push({
        severity: "WARN",
        message: "Missing disclosure_type.",
        source_input: r.source_input,
        gri_code: code,
        field: "disclosure_type",
      });
    }
  }

  return qa;
}