/**
 * 表示速度(docs/design/perf.md):ドット絵のマス(<rect> 1 つずつ)を、同じ色ごとに 1 本の <path> にまとめる。
 * マスは重ならず、座標・幅・高さは整数で、shape-rendering: crispEdges なので、塗られる画素は <rect> を並べたときと同じ。
 * トップだけで <rect> が 2,820 個あり、HTML と RSC の両方に入っていた。
 */
export type PixelRect = { x: number; y: number; w: number; h: number };

/** マスを 1 本の path の d にする(マスごとに閉じた四角の部分パス) */
export function rectsToPath(cells: readonly PixelRect[]): string {
  return cells.map((c) => `M${c.x} ${c.y}h${c.w}v${c.h}h${-c.w}z`).join("");
}

/** 色ごとにまとめる。色の順は最初に出てきた順(重ならないので塗る順は見た目に影響しないが、元の順に近づける) */
export function groupByFill<T extends PixelRect>(cells: readonly T[], fillOf: (c: T) => string): { fill: string; d: string }[] {
  const groups = new Map<string, T[]>();
  for (const c of cells) {
    const f = fillOf(c);
    const list = groups.get(f);
    if (list) list.push(c);
    else groups.set(f, [c]);
  }
  return [...groups].map(([fill, list]) => ({ fill, d: rectsToPath(list) }));
}
