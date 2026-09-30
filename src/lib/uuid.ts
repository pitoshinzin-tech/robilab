const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** UUID の形か(URL の ID を DB に渡す前に確かめる) */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
