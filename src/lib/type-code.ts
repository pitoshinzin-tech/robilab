import { ALL_TYPE_CODES } from "@/data/types";

export function normalizeTypeCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  return ALL_TYPE_CODES.includes(code) ? code : null;
}
