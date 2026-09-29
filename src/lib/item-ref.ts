import type { ItemRef } from "@/lib/my-settings";

export type Option = { id: string; label: string };

/** 候補の id か自由入力の名前を、表示用の文字にする。候補にない id は表示しない(null)。 */
export function itemLabel(ref: ItemRef | null, options: Option[]): string | null {
  if (!ref) return null;
  if ("name" in ref) return ref.name;
  return options.find((o) => o.id === ref.id)?.label ?? null;
}
