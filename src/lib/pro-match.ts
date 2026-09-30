import { getSensGame } from "@/data/sensitivity";
import { PRO_GAMES, type ProSetting } from "@/data/pros";
import { cm360, edpi } from "@/lib/sensitivity";
import type { MySettings } from "@/lib/my-settings";

export type NearPro = { pro: ProSetting; cm: number; diff: number };
export type ProSort = "cmAsc" | "cmDesc" | "name";

/** プロの振り向き(cm)。感度計算ツールと同じ式。 */
export function proCm(p: ProSetting): number {
  return cm360(p.dpi, p.sens, getSensGame(p.game)!.yaw);
}

export function proEdpi(p: ProSetting): number {
  return edpi(p.dpi, p.sens);
}

const byName = (a: ProSetting, b: ProSetting) => a.name.localeCompare(b.name, "ja");

/**
 * 振り向きが近い順。userGame がプロのいるゲームなら、同じゲームの人を先にする。
 * 同じなら名前順。
 */
export function nearPros(userCm: number, userGame: string | null, pros: ProSetting[], limit: number): NearPro[] {
  const preferGame = userGame !== null && (PRO_GAMES as string[]).includes(userGame) ? userGame : null;
  return pros
    .map((pro) => {
      const cm = proCm(pro);
      return { pro, cm, diff: Math.abs(cm - userCm) };
    })
    .sort((a, b) => {
      if (preferGame) {
        const sa = a.pro.game === preferGame ? 0 : 1;
        const sb = b.pro.game === preferGame ? 0 : 1;
        if (sa !== sb) return sa - sb;
      }
      return a.diff - b.diff || byName(a.pro, b.pro);
    })
    .slice(0, limit);
}

/** 差の一言。差を 0.1cm にそろえ、0.5cm 以下は「ほぼ同じ」。 */
export function diffText(proCmValue: number, userCm: number): string {
  const d = Math.round((proCmValue - userCm) * 10) / 10;
  if (Math.abs(d) <= 0.5) return "ほぼ同じ";
  return `あなたより ${Math.abs(d).toFixed(1)}cm ${d < 0 ? "短い" : "長い"}`;
}

/** 一覧の並び替え(元の配列は変えない)。振り向きが同じなら名前順。 */
export function sortPros(pros: ProSetting[], sort: ProSort): ProSetting[] {
  const list = [...pros];
  if (sort === "name") return list.sort(byName);
  const dir = sort === "cmAsc" ? 1 : -1;
  return list.sort((a, b) => dir * (proCm(a) - proCm(b)) || byName(a, b));
}

/** マイ設定のメインゲーム・感度・DPI から、あなたの振り向き。そろっていなければ null。 */
export function userCmFrom(s: MySettings | null): { cm: number; game: string } | null {
  if (!s || !s.mainGame || s.dpi === null) return null;
  const sens = s.sens[s.mainGame];
  const game = getSensGame(s.mainGame);
  if (sens === undefined || !game) return null;
  return { cm: cm360(s.dpi, sens, game.yaw), game: s.mainGame };
}
