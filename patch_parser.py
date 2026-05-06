from pathlib import Path

file_path = Path("src/app/page.tsx")
text = file_path.read_text(encoding="utf-8")

new_code = r'''function cleanJsonCandidate(candidate: string): string {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < candidate.length; i++) {
    const char = candidate[i];

    if (inString) {
      if (escaped) {
        output += char;
        escaped = false;
      } else if (char === "\\") {
        output += char;
        escaped = true;
      } else if (char === '"') {
        output += char;
        inString = false;
      } else if (char === "\n" || char === "\r" || char === "\t") {
        output += " ";
      } else {
        output += char;
      }
      continue;
    }

    output += char;

    if (char === '"') {
      inString = true;
    }
  }

  return output;
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
      const nextNonSpace = text.slice(i + 1).match(/\S/);
      const nextChar = nextNonSpace?.[0];

      if (depth === 0 && nextChar !== "{" && nextChar !== "]") {
        continue;
      }

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
      const cleanedCandidate = cleanJsonCandidate(candidate);
      const parsed = JSON.parse(cleanedCandidate);

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
'''

def find_function_range(source: str, function_name: str):
    start = source.find(f"function {function_name}")
    if start == -1:
        return None

    brace_start = source.find("{", start)
    if brace_start == -1:
        raise RuntimeError(f"Tidak menemukan pembuka {{ untuk {function_name}")

    depth = 0
    in_string = None
    escaped = False
    i = brace_start

    while i < len(source):
        ch = source[i]

        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == in_string:
                in_string = None
            i += 1
            continue

        if ch in ['"', "'", "`"]:
            in_string = ch
            i += 1
            continue

        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return start, i + 1

        i += 1

    raise RuntimeError(f"Tidak menemukan penutup }} untuk {function_name}")

parse_range = find_function_range(text, "parseMultipleJsonArrays")
if parse_range is None:
    raise RuntimeError("Function parseMultipleJsonArrays tidak ditemukan.")

clean_range = find_function_range(text, "cleanJsonCandidate")

if clean_range is not None and clean_range[0] < parse_range[0]:
    replace_start = clean_range[0]
    replace_end = parse_range[1]
else:
    replace_start = parse_range[0]
    replace_end = parse_range[1]

backup_path = file_path.with_suffix(".tsx.backup")
backup_path.write_text(text, encoding="utf-8")

updated = text[:replace_start] + new_code + text[replace_end:]
file_path.write_text(updated, encoding="utf-8")

print("DONE: Parser berhasil diganti.")
print(f"Backup dibuat di: {backup_path}")