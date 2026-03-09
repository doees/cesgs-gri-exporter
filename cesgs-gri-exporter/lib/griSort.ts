export function parseGriCode(code: string): Array<number | string> {
  const c = String(code ?? "").trim();
  if (!c) return [];

  // Split by non-alphanumeric except keep letters as tokens
  // "2-10" -> ["2","10"], "418-1" -> ["418","1"]
  const tokens = c.split(/[^A-Za-z0-9]+/).filter(Boolean);

  return tokens.map((t) => {
    const n = Number(t);
    return Number.isFinite(n) && String(n) === t ? n : t.toLowerCase();
  });
}

export function compareGriCode(a: string, b: string): number {
  const pa = parseGriCode(a);
  const pb = parseGriCode(b);

  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i];
    const vb = pb[i];
    if (va === undefined) return -1;
    if (vb === undefined) return 1;

    if (typeof va === "number" && typeof vb === "number") {
      if (va !== vb) return va - vb;
    } else {
      const sa = String(va);
      const sb = String(vb);
      const cmp = sa.localeCompare(sb);
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}