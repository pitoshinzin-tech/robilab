/** 全角数字・全角ピリオド・カンマ小数点を受け付けて数値にする。読めなければ null。 */
export function parseNumber(input: string): number | null {
  const half = input
    .trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[．。]/g, ".")
    .replace(/[，、]/g, ",")
    .replace(/[−ー－]/g, "-");
  if (half === "") return null;
  const commaCount = (half.match(/,/g) ?? []).length;
  if (commaCount > 1) return null;
  const normalized = commaCount === 1 && !half.includes(".") ? half.replace(",", ".") : half;
  if (!/^-?\d+(\.\d+)?$|^-?\.\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
