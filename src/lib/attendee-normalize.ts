const SMID_PATTERN = /\b[A-Z]{6}\d{3}\b/;

/** Extracts a UCT student number from free text, e.g. "mdknko008 (27084759)" -> "MDKNKO008". */
export function normaliseStudentNumber(raw: string) {
  const value = raw.trim().toUpperCase().replace(/\s+/g, " ");
  return value.match(SMID_PATTERN)?.[0] ?? value;
}

export function isValidStudentNumber(value: string) {
  return /^[A-Z]{6}\d{3}$/.test(value);
}

/** Trims names and fixes ALL-CAPS or all-lowercase entries; mixed-case names are left alone. */
export function tidyName(raw: string) {
  const value = raw.trim().replace(/\s+/g, " ");
  if (value !== value.toLowerCase() && value !== value.toUpperCase()) return value;
  return value.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}
