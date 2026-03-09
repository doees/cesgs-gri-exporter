import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">CESGS GRI Exporter</h1>
          <p className="text-lg text-gray-600">
            Paste multiple GRI mapping JSONs → Download one clean Excel (no data uploaded).
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Runs locally in your browser (no upload)</li>
            <li>Exports 3 sheets: GRI_Table, QA_Log, Summary</li>
            <li>Sorts by GRI code (ascending)</li>
          </ul>

          <div className="flex gap-3 pt-4">
            <Link
              href="/app"
              className="rounded-xl bg-black px-5 py-3 text-white hover:bg-gray-800"
            >
              Start Converting
            </Link>
            <Link
              href="/help"
              className="rounded-xl border border-gray-300 px-5 py-3 text-gray-800 hover:bg-gray-50"
            >
              Help / Schema
            </Link>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-gray-200 p-6 bg-gray-50">
          <p className="text-sm text-gray-600">
            Privacy: This tool processes your JSON locally in the browser. No data is sent to any server.
          </p>
        </div>
      </div>
    </main>
  );
}