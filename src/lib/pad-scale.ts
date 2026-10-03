import type { PadSize } from "@/data/gear-types";

/**
 * マウスパッドの実寸の縮尺図「パッドの上のマウス」の計算(アートディレクション 2 章:数字は物の大きさで見せる)。
 * 公式の幅・奥行きがそろうサイズだけを、同じ縮尺で左下をそろえて重ね、一番小さいサイズの真ん中に平均的なマウスを置く。
 * 単位は mm(viewBox も mm)。図は viewBox で枠に合わせて縮むので、同じ図の中のサイズとマウスはいつも同じ縮尺。
 */

/** 平均的なマウス(長さ 120mm・幅 63mm。ロビラボの目安。製品の数字ではない) */
export const AVG_MOUSE = { lengthMm: 120, widthMm: 63 } as const;

/** 図の枠(px)。md 以上は 400×240 まで、375 は高さ 128 まで(幅は画面いっぱいの 343 まで)。名前の行の高さは 16px */
export const SCALE_FRAME = { maxWidthPx: 400, heightPx: 240, mobileMaxWidthPx: 343, mobileHeightPx: 128, labelLinePx: 16 } as const;

/** マウスの幅がこれより細く見えるとき(375 の枠で)は、図の下に「同じ縮尺」と書き添える */
const TINY_MOUSE_PX = 16;
/** 名前(12px)1 文字あたりの幅の目安(px)と、外形の角からの余白(px) */
const CHAR_PX = 8;
const LABEL_INSET_PX = 4;

export type PadOutline = {
  label: string; widthMm: number; depthMm: number;
  x: number; y: number; width: number; height: number;
  /** 大きさ・厚さの絞り込みに合うサイズ */
  matched: boolean;
  /** 名前を置く高さ(上からの mm。右上の角の内側。ほかの名前と重ならないように下へずらしたもの) */
  labelTopMm: number;
};

export type PadScaleGeometry = {
  viewBox: string;
  widthMm: number; depthMm: number;
  /** md 以上の枠での 1mm あたりの px */
  pxPerMm: number;
  /** 375 の枠での 1mm あたりの px(名前の重なりはこちらで見る) */
  pxPerMmMin: number;
  outlines: PadOutline[];
  mouse: { x: number; y: number; width: number; height: number; rx: number };
  narrowed: boolean;
  tinyMouse: boolean;
};

const drawable = (s: PadSize): s is PadSize & { widthMm: number; depthMm: number } =>
  s.widthMm !== null && s.depthMm !== null && s.widthMm > 0 && s.depthMm > 0;

/**
 * matched:絞り込みで残ったサイズ(pad.sizes と同じもの)。絞り込んでいないときは null。
 * 描けるサイズがなければ null(図を出さない。作った数字を出さない)。
 */
export function padScale(sizes: readonly PadSize[], matched: readonly PadSize[] | null): PadScaleGeometry | null {
  const hit = matched === null ? null : new Set(matched);
  // 同じ大きさは 1 本の線にまとめる(硬さ違いなど)
  const groups = new Map<string, { labels: string[]; widthMm: number; depthMm: number; matched: boolean }>();
  for (const s of sizes) {
    if (!drawable(s)) continue;
    const key = `${s.widthMm}x${s.depthMm}`;
    const g = groups.get(key) ?? { labels: [], widthMm: s.widthMm, depthMm: s.depthMm, matched: false };
    if (!g.labels.includes(s.label)) g.labels.push(s.label);
    if (hit?.has(s)) g.matched = true;
    groups.set(key, g);
  }
  if (groups.size === 0) return null;

  const list = [...groups.values()].sort((a, b) => b.widthMm * b.depthMm - a.widthMm * a.depthMm || b.widthMm - a.widthMm);
  const widthMm = Math.max(...list.map((g) => g.widthMm));
  const depthMm = Math.max(...list.map((g) => g.depthMm));
  const pxPerMm = Math.min(SCALE_FRAME.maxWidthPx / widthMm, SCALE_FRAME.heightPx / depthMm);
  const pxPerMmMin = Math.min(SCALE_FRAME.mobileMaxWidthPx / widthMm, SCALE_FRAME.mobileHeightPx / depthMm);
  const line = SCALE_FRAME.labelLinePx / pxPerMmMin;
  const inset = LABEL_INSET_PX / pxPerMmMin;

  const placed: { top: number; left: number; right: number }[] = [];
  const outlines: PadOutline[] = list.map((g) => {
    const label = g.labels.join("・");
    const y = depthMm - g.depthMm;
    const right = g.widthMm - inset;
    const left = right - (label.length * CHAR_PX) / pxPerMmMin;
    let top = y + inset;
    // 横に重なる名前と縦に近ければ、その下へずらす(上から順に見る)
    for (let moved = true; moved; ) {
      moved = false;
      for (const p of placed) {
        if (left < p.right && p.left < right && top < p.top + line && top > p.top - line) { top = p.top + line; moved = true; }
      }
    }
    top = Math.min(top, Math.max(0, depthMm - line));
    placed.push({ top, left, right });
    return { label, widthMm: g.widthMm, depthMm: g.depthMm, x: 0, y, width: g.widthMm, height: g.depthMm, matched: g.matched, labelTopMm: top };
  });

  // マウスは一番小さいサイズの真ん中。その名前と重なるときは、左下の角に寄せる(どちらもパッドの上)
  const smallest = list[list.length - 1];
  const last = placed[placed.length - 1];
  const mouse = {
    x: smallest.widthMm / 2 - AVG_MOUSE.widthMm / 2,
    y: depthMm - smallest.depthMm / 2 - AVG_MOUSE.lengthMm / 2,
    width: AVG_MOUSE.widthMm,
    height: AVG_MOUSE.lengthMm,
    rx: AVG_MOUSE.widthMm * 0.45,
  };
  if (mouse.x < last.right && last.left < mouse.x + mouse.width && mouse.y < last.top + line) {
    mouse.x = inset;
    mouse.y = depthMm - inset - AVG_MOUSE.lengthMm;
  }
  return {
    viewBox: `0 0 ${widthMm} ${depthMm}`, widthMm, depthMm, pxPerMm, pxPerMmMin, outlines, mouse,
    narrowed: hit !== null,
    tinyMouse: AVG_MOUSE.widthMm * pxPerMmMin < TINY_MOUSE_PX,
  };
}

/** 図の意味を言葉で(role="img" の aria-label) */
export function padScaleLabel(g: PadScaleGeometry): string {
  const names = g.outlines.map((o) => `${o.label} ${o.widthMm}×${o.depthMm}mm`).join("・");
  const hits = g.outlines.filter((o) => o.matched).map((o) => o.label);
  const tail = g.narrowed && hits.length > 0 ? `(絞り込みに合うサイズ:${hits.join("・")})` : "";
  return `${names} の上に、平均的なマウス ${AVG_MOUSE.lengthMm}×${AVG_MOUSE.widthMm}mm を同じ縮尺で置いた図${tail}`;
}
