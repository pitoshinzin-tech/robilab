import type { Axes } from "@/data/axes";
import { toTypeCode } from "@/lib/scoring";

/** 診断の結果の URL(今の DiagnosisClient と同じ /type/CODE?axes=a,i,t,h。小数 2 桁)。最後の答えを押した時点でも作れる。 */
export function resultPath(axes: Axes): { code: string; path: string } {
  const code = toTypeCode(axes);
  const packed = [axes.attack, axes.instinct, axes.team, axes.heat].map((n) => n.toFixed(2)).join(",");
  return { code, path: `/type/${code}?axes=${packed}` };
}

/** 先読みしてよいか(スマホの節約モード navigator.connection.saveData のときはしない) */
export function shouldPrefetch(nav: { connection?: { saveData?: boolean } } | undefined): boolean {
  return nav?.connection?.saveData !== true;
}
