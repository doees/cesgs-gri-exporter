"use client";

export default function PreviewTable({ rows, maxRows = 20 }: { rows: any[]; maxRows?: number }) {
  const preview = rows.slice(0, maxRows);

  const cols = [
    "gri_code",
    "disclosure_title",
    "disclosure_type",
    "evidence_page",
    "pillar",
    "topic",
  ];

  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Preview (first {maxRows} rows)</h3>
        <div className="text-sm text-gray-600">Total: {rows.length}</div>
      </div>

      <div className="mt-3 overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              {cols.map((c) => (
                <th key={c} className="text-left py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((r, i) => (
              <tr key={i} className="border-b">
                {cols.map((c) => (
                  <td key={c} className="py-2 pr-4 align-top">
                    {String(r?.[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}