/** 追補 S5:名簿の入場の判定(ブラウザの API に触らない純粋な部分)。 */

/** IntersectionObserver の threshold と同じ値。ハイドレーションの時点の「見えている」もこれで決める。 */
export const ROSTER_THRESHOLD = 0.2;

type VRect = { top: number; bottom: number };

/** 要素の縦の何割が画面(0〜viewportHeight)に入っているか。 */
export function visibleFraction(rect: VRect, viewportHeight: number): number {
  const height = rect.bottom - rect.top;
  if (!(height > 0)) return 0;
  const inside = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
  return Math.max(0, inside) / height;
}

export const isMostlyVisible = (rect: VRect, viewportHeight: number): boolean => visibleFraction(rect, viewportHeight) >= ROSTER_THRESHOLD;

type SeenStorage = { getItem(key: string): string | null; setItem(key: string, value: string): void };
type GetStorage = () => SeenStorage | undefined;

/**
 * 「入場をもう見た」をセッションの間おぼえる。同じページの中はモジュールの変数、読み直したあとは sessionStorage。
 * storage が使えない(プライベートモード・ブロック)ときは例外を飲み込み、変数だけでおぼえる。
 */
export function createSeenFlag(key: string) {
  let seen = false;
  return {
    has(getStorage: GetStorage): boolean {
      if (seen) return true;
      try {
        seen = getStorage()?.getItem(key) === "1";
      } catch {
        // 読めないときは見ていない扱い
      }
      return seen;
    },
    mark(getStorage: GetStorage): void {
      seen = true;
      try {
        getStorage()?.setItem(key, "1");
      } catch {
        // 書けなくても、このページの中では変数でおぼえている
      }
    },
  };
}

const flags = new Map<string, ReturnType<typeof createSeenFlag>>();
/** ページ(パス)ごとのフラグ。トップで見たあとでも、`/types` の名簿は初めての 1 回だけ動く。 */
export function rosterSeen(path: string) {
  let flag = flags.get(path);
  if (!flag) flags.set(path, (flag = createSeenFlag(`rl-roster-seen:${path}`)));
  return flag;
}
