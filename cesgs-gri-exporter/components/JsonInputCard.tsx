"use client";

import { useEffect, useMemo } from "react";

export type JsonCardState = {
  id: string;
  text: string;
  isValid: boolean;
  error: string | null;
  parsedRows: any[] | null;
};

function tryParseJson(text: string): { rows: any[] | null; error: string | null } {
  const t = text.trim();
  if (!t) return { rows: null, error: null };

  try {
    const parsed = JSON.parse(t);

    // allow object -> wrap to array
    const rows = Array.isArray(parsed) ? parsed : [parsed];

    if (!Array.isArray(rows)) return { rows: null, error: "JSON must be an array of objects." };
    return { rows, error: null };
  } catch (e: any) {
    // JSON.parse error message often includes position; keep it simple for users
    return { rows: null, error: e?.message ?? "Invalid JSON." };
  }
}

export default function JsonInputCard({
  index,
  state,
  onChange,
  onRemove,
}: {
  index: number;
  state: JsonCardState;
  onChange: (patch: Partial<JsonCardState>) => void;
  onRemove?: () => void;
}) {
  const parsed = useMemo(() => tryParseJson(state.text), [state.text]);

  useEffect(() => {
    onChange({
      isValid: !!state.text.trim() ? parsed.error === null && !!parsed.rows : false,
      error: parsed.error,
      parsedRows: parsed.rows,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.error, parsed.rows]);

  function formatJson() {
    const t = state.text.trim();
    if (!t) return;
    const { rows, error } = tryParseJson(t);
    if (error || !rows) return;
    // If original was an object, we wrapped it; export formatted array
    onChange({ text: JSON.stringify(rows, null, 2) });
  }

  function clear() {
    onChange({ text: "", isValid: false, error: null, parsedRows: null });
  }

  const status = !state.text.trim()
    ? "Empty"
    : state.isValid
      ? "Valid"
      : "Invalid";

  return (
    <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">JSON Input #{index}</div>
          <div className="text-sm text-gray-600">
            Status:{" "}
            {status === "Valid" ? (
              <span className="text-green-700">✅ Valid</span>
            ) : status === "Invalid" ? (
              <span className="text-red-700">❌ Invalid</span>
            ) : (
              <span className="text-gray-500">— Empty</span>
            )}
          </div>
          {state.error && (
            <div className="text-sm text-red-700 mt-1 break-words">
              {state.error}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={formatJson}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Format
          </button>
          <button
            onClick={clear}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Clear
          </button>
          {onRemove && (
            <button
              onClick={onRemove}
              className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <textarea
        value={state.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder='Paste JSON here (array of objects)...'
        className="h-56 w-full rounded-xl border border-gray-300 p-3 font-mono text-xs"
      />
    </div>
  );
}