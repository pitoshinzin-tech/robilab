/** ページの searchParams(Next.js の page の props)を読むための小さな道具。どれも純粋な関数。 */
export type SearchParams = Record<string, string | string[] | undefined>;

/** ?a=1&a=2 のような重なりは最初の値。なければ null */
export function firstParam(sp: SearchParams, key: string): string | null {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" ? s : null;
}

/** 決まった値のどれかならその値。違えば fallback(想定外の値で落ちない) */
export function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** "all" と null は書かず、渡した順で ? に並べる */
export function queryHref(path: string, entries: readonly (readonly [string, string | null])[]): string {
  const q = new URLSearchParams();
  for (const [k, v] of entries) if (v !== null && v !== "all") q.set(k, v);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
