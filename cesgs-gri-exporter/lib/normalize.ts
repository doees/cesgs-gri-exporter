import type { JsonCardState } from "@/components/JsonInputCard";
import { compareGriCode } from "@/lib/griSort";

export type GriRow = {
  company?: string | null;
  Indicators?: string | null;
  pillar?: string | null;
  topic?: string | null;
  gri_code?: string | null;
  disclosure_title?: string | null;
  fy?: string | null;
  disclosure_type?: string | null;
  value_quantitative?: string | null;
  unit?: string | null;
  value_qualitative?: string | null;
  evidence_page?: string | null;
  source_input?: string; // added
  [k: string]: any;
};

function cleanStr(v: any): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\r\n/g, "\n").trim();
  return s.length ? s : null;
}

export function normalizeAllInputs(cards: JsonCardState[]) {
  const rows: GriRow[] = [];
  let detectedCompany = "";
  let detectedFy = "";

  cards.forEach((card, idx) => {
    const inputLabel = `Input #${idx + 1}`;
    const parsed = card.parsedRows ?? [];

    parsed.forEach((r: any) => {
      const row: GriRow = {
        company: cleanStr(r.company),
        Indicators: cleanStr(r.Indicators),
        pillar: cleanStr(r.pillar),
        topic: cleanStr(r.topic),
        gri_code: cleanStr(r.gri_code),
        disclosure_title: cleanStr(r.disclosure_title),
        fy: cleanStr(r.fy),
        disclosure_type: cleanStr(r.disclosure_type),
        value_quantitative: r.value_quantitative === null ? null : cleanStr(r.value_quantitative),
        unit: cleanStr(r.unit),
        value_qualitative: cleanStr(r.value_qualitative),
        evidence_page: cleanStr(r.evidence_page),
        source_input: inputLabel,
      };

      if (!detectedCompany && row.company) detectedCompany = row.company;
      if (!detectedFy && row.fy) detectedFy = row.fy;

      rows.push(row);
    });
  });

  rows.sort((a, b) => compareGriCode(String(a.gri_code ?? ""), String(b.gri_code ?? "")));

  return { rows, detectedCompany, detectedFy };
}