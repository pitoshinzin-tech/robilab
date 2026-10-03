import { NumUnit } from "@/components/ui/num-unit";

/** 図鑑の表示の段の数(/pads と同じ形。PageShell の actions に置く)。例「51 体」と、その下に何の数かの一言 */
export function DexCount({ value, caption }: { value: number; caption: string }) {
  return (
    <p className="grid justify-items-start md:justify-items-end">
      <NumUnit value={value} unit="体" className="text-rl-display-2" />
      <span className="text-sm text-rl-muted">{caption}</span>
    </p>
  );
}
