import type { Point } from "./view";

/**
 * 動きの参考 061(HUD の照準):遊ぶ面の照準の横に出す小さな座標(板の単位 0〜109 を丸めて 3 桁)。
 * 表示だけ(判定・点数には使わない)。桁をそろえて、動かしても文字の幅が揺れにくくする。
 */
export function hudCoords(p: Point): string {
  const f = (n: number) => {
    const r = Math.round(n);
    return `${r < 0 ? "-" : " "}${String(Math.abs(r)).padStart(3, "0")}`;
  };
  return `X${f(p.x)}  Y${f(p.y)}`;
}
