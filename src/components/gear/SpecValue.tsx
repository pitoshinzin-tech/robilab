import { NO_DATA } from "@/lib/gear-labels";

/** 寸法の数字 1 つ(本文の書体の太字・マゼンタ・桁をそろえる。小さな Orbitron の 0・8 は箱の記号に見えるため使わない)。単位は本文の色の小さい字(単位はマゼンタにしない) */
export function SpecNum({ value, unit }: { value: number; unit?: "mm" | "g" }) {
  return (
    <>
      <span className="font-bold tabular-nums text-rl-highlight">{value}</span>
      {unit && <span className="ml-0.5 text-xs font-bold">{unit}</span>}
    </>
  );
}

/**
 * 表の寸法の値(dd)。数字は 本文の書体の太字・マゼンタ(桁をそろえる)、単位は本文の色の小さい字(単位はマゼンタにしない)。
 * 公式に数字がないときは「公式の記載なし」を本文の色で出す(数字ではないのでマゼンタにしない)。
 */
export function SpecValue({ value, unit }: { value: number | null; unit: "mm" | "g" }) {
  if (value === null) return <dd className="text-rl-text">{NO_DATA}</dd>;
  return (
    <dd className="text-rl-text">
      <SpecNum value={value} unit={unit} />
    </dd>
  );
}
