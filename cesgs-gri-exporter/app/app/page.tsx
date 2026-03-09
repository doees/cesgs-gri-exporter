"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import JsonInputCard, { JsonCardState } from "@/components/JsonInputCard";
import PreviewTable from "@/components/PreviewTable";
import { normalizeAllInputs } from "@/lib/normalize";
import { runQaChecks } from "@/lib/qa";
import { exportWorkbook } from "@/lib/exportToXlsx";

export default function ConverterPage() {
  const [cards, setCards] = useState<JsonCardState[]>([
    { id: crypto.randomUUID(), text: "", isValid: false, error: null, parsedRows: null },
  ]);

  const [companyOverride, setCompanyOverride] = useState("");
  const [fyOverride, setFyOverride] = useState("");

  const allValid = cards.length > 0 && cards.every((c) => c.isValid);

  const merged = useMemo(() => {
    if (!allValid) return { rows: [], qa: [], summary: null };

    const { rows, detectedCompany, detectedFy } = normalizeAllInputs(cards);
    const company = (companyOverride || detectedCompany || "").trim();
    const fy = (fyOverride || detectedFy || "").trim();

    const qa = runQaChecks(rows);
    const summary = {
      company: company || detectedCompany || "",
      fy: fy || detectedFy || "",
      inputs_count: cards.length,
      total_rows: rows.length,
      unique_gri_code: new Set(rows.map((r) => String(r.gri_code ?? "").trim()).filter(Boolean)).size,
      rows_missing_evidence_page: rows.filter((r) => !String(r.evidence_page ?? "").trim()).length,
      rows_missing_disclosure_type: rows.filter((r) => !String(r.disclosure_type ?? "").trim()).length,
      generated_at: new Date().toISOString(),
    };

    return { rows, qa, summary, detectedCompany, detectedFy };
  }, [allValid, cards, companyOverride, fyOverride]);

  function addCard() {
    setCards((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "", isValid: false, error: null, parsedRows: null },
    ]);
  }

  function updateCard(id: string, patch: Partial<JsonCardState>) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  function convertAndDownload() {
    if (!allValid || !merged.summary) return;

    const filenameCompany = (merged.summary.company || "Company").replace(/\s+/g, "");
    const filenameFy = (merged.summary.fy || "FY").replace(/\s+/g, "");
    const filename = `CESGS_GRI_Exporter_${filenameCompany}_${filenameFy}.xlsx`;

    exportWorkbook({
      rows: merged.rows,
      qaLog: merged.qa,
      summary: merged.summary,
      filename,
    });
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Converter</h1>
            <p className="text-gray-600">
              Paste JSON blocks, then export to Excel (processed locally).
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="text-sm underline text-gray-700">Home</Link>
            <Link href="/help" className="text-sm underline text-gray-700">Help</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Inputs */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">JSON Inputs</h2>
              <button
                onClick={addCard}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                + Add JSON
              </button>
            </div>

            <div className="space-y-4">
              {cards.map((card, idx) => (
                <JsonInputCard
                  key={card.id}
                  index={idx + 1}
                  state={card}
                  onChange={(patch) => updateCard(card.id, patch)}
                  onRemove={cards.length > 1 ? () => removeCard(card.id) : undefined}
                />
              ))}
            </div>
          </section>

          {/* RIGHT: Output */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Output</h2>

            <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-700">Company (auto-detected, editable)</label>
                  <input
                    value={companyOverride}
                    onChange={(e) => setCompanyOverride(e.target.value)}
                    placeholder={merged.detectedCompany || "Detected company"}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">FY (auto-detected, editable)</label>
                  <input
                    value={fyOverride}
                    onChange={(e) => setFyOverride(e.target.value)}
                    placeholder={merged.detectedFy || "Detected FY"}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <button
                onClick={convertAndDownload}
                disabled={!allValid}
                className={`w-full rounded-xl px-4 py-3 text-white ${
                  allValid ? "bg-black hover:bg-gray-800" : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Convert to Excel
              </button>

              <div className="text-sm text-gray-600">
                {allValid ? (
                  <span>✅ All inputs valid. Ready to export.</span>
                ) : (
                  <span>⛔ Fix invalid JSON inputs to enable export.</span>
                )}
              </div>
            </div>

            {allValid && merged.summary && (
              <div className="rounded-2xl border border-gray-200 p-4 space-y-2">
                <h3 className="font-medium">Summary</h3>
                <div className="text-sm text-gray-700 grid grid-cols-2 gap-2">
                  <div>Total rows: <b>{merged.summary.total_rows}</b></div>
                  <div>Inputs: <b>{merged.summary.inputs_count}</b></div>
                  <div>Unique gri_code: <b>{merged.summary.unique_gri_code}</b></div>
                  <div>Warnings: <b>{merged.qa.filter((q) => q.severity === "WARN").length}</b></div>
                </div>
              </div>
            )}

            {allValid && merged.rows.length > 0 && (
              <PreviewTable rows={merged.rows} maxRows={20} />
            )}
          </section>
        </div>

        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
          Privacy note: This app does not upload your JSON. All processing happens in your browser.
        </div>
      </div>
    </main>
  );
}