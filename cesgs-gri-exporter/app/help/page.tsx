import Link from "next/link";

const sample = `[
  {
    "company": "Sime Darby Property Berhad",
    "Indicators": "Organizational details",
    "pillar": "Universal",
    "topic": "The organization and its reporting practices",
    "gri_code": "2-1",
    "disclosure_title": "Organizational details",
    "fy": "FY2023",
    "disclosure_type": "Mixed",
    "value_quantitative": "Total assets RM15.9 billion.",
    "unit": "RM",
    "value_qualitative": "Property developer and real estate group.",
    "evidence_page": "2, 7"
  }
]`;

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Help / Schema</h1>
          <Link href="/" className="text-sm underline text-gray-700">Back</Link>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Expected input</h2>
          <p className="text-gray-700">
            Paste one or more JSON blocks. Each block should be an <b>array of objects</b>.
            If you paste a single object, the app will wrap it into an array automatically.
          </p>
          <pre className="rounded-2xl bg-gray-50 p-4 overflow-auto text-xs border border-gray-200">
            {sample}
          </pre>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Recommended fields</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>company, fy, pillar, topic, gri_code, disclosure_title</li>
            <li>Indicators, disclosure_type</li>
            <li>value_qualitative, value_quantitative, unit</li>
            <li>evidence_page (can be null, but will create warnings)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">FAQ</h2>
          <div className="space-y-3 text-gray-700">
            <p><b>Is my data uploaded?</b> No. Processing is done locally in your browser.</p>
            <p><b>Can I paste multiple JSONs?</b> Yes. Use + Add JSON.</p>
            <p><b>How is sorting done?</b> By gri_code ascending (e.g., 2-1, 2-2, 2-10).</p>
          </div>
        </section>

        <div className="pt-2">
          <Link
            href="/app"
            className="inline-flex rounded-xl bg-black px-5 py-3 text-white hover:bg-gray-800"
          >
            Go to Converter
          </Link>
        </div>
      </div>
    </main>
  );
}