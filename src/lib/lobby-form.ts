import type { Axes } from "@/data/axes";

/**
 * フォームの `axes` フィールド(JSON 文字列)を安全にパースする。
 * 未入力は null、壊れた JSON や配列・数値などのオブジェクト以外は "invalid" を返す。
 * Server Action 側はこの結果を見て、RPC を呼ぶ前にエラーを返せる。
 */
export function parseAxesField(raw: FormDataEntryValue | null): Axes | null | "invalid" {
  if (raw === null) return null;
  const str = String(raw);
  if (str === "") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(str);
  } catch {
    return "invalid";
  }
  if (parsed === null) return null;
  if (typeof parsed !== "object" || Array.isArray(parsed)) return "invalid";
  return parsed as Axes;
}
