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
/** 名前(12px)1 文字あたりの幅の目安(px。英数字 8・全角 12)、札の左右の余白(px-1 の 4px×2)、外形の角からの余白(px) */
const CHAR_PX = 8;
const WIDE_CHAR_PX = 12;
const LABEL_PAD_PX = 8;
const LABEL_INSET_PX = 4;

const labelPx = (label: string) => [...label].reduce((w, c) => w + (/[　-鿿＀-￯]/.test(c) ? WIDE_CHAR_PX : CHAR_PX), LABEL_PAD_PX);

export type PadOutline = {
  label: string; widthMm: number; depthMm: number;
  x: number; y: number; width: number; height: number;
  /** 大きさ・厚さの絞り込みに合うサイズ */
  matched: boolean;
  /**
   * 名前の札を図の中に描くか。375 の枠で外形の中に収まらない、ほかの札とずらしても置けない、マウスの面に重なるときは描かない
   * (小さいサイズの札が重なって面を隠すため。描かない名前は hiddenLabels にまとめ、図の下に 1 行で出す)。
   */
  labelShown: boolean;
  /** 札を置く高さ(上からの mm。右上の角の内側。ほかの札と重ならないように下へずらしたもの) */
  labelTopMm: number;
  /** 札の左端と右端(左からの mm。375 の枠での文字の幅の目安) */
  labelLeftMm: number;
  labelRightMm: number;
};

export type PadScaleGeometry = {
  viewBox: string;
  widthMm: number; depthMm: number;
  /** md 以上の枠での 1mm あたりの px */
  pxPerMm: number;
  /** 375 の枠での 1mm あたりの px(札が収まるか・重なるかはこちらで見る) */
  pxPerMmMin: number;
  outlines: PadOutline[];
  /** 図の中に描かない名前(小さい順) */
  hiddenLabels: string[];
  mouse: { x: number; y: number; width: number; height: number; rx: number };
  narrowed: boolean;
  tinyMouse: boolean;
};

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const drawable = (s: PadSize): s is PadSize & { widthMm: number; depthMm: number } =>
  s.widthMm !== null && s.depthMm !== null && s.widthMm > 0 && s.depthMm > 0;

/**
 * matched:絞り込みで残ったサイズ(pad.sizes と同じもの)。絞り込んでいないときは null。
 * 描けるサイズがなければ null(図を出さない。作った数字を出さない)。
 */
const sizeKey = (s: { widthMm: number; depthMm: number }) => `${s.widthMm}x${s.depthMm}`;

/** 外形(同じ大きさは 1 本にまとめる)を大きい順に。padScale と padOutlineIndexer で同じ並びを使う */
function outlineGroups(sizes: readonly PadSize[], hit: ReadonlySet<PadSize> | null) {
  // 同じ大きさは 1 本の線にまとめる(硬さ違いなど)
  const groups = new Map<string, { labels: string[]; widthMm: number; depthMm: number; matched: boolean }>();
  for (const s of sizes) {
    if (!drawable(s)) continue;
    const key = sizeKey(s);
    const g = groups.get(key) ?? { labels: [], widthMm: s.widthMm, depthMm: s.depthMm, matched: false };
    if (!g.labels.includes(s.label)) g.labels.push(s.label);
    if (hit?.has(s)) g.matched = true;
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.widthMm * b.depthMm - a.widthMm * a.depthMm || b.widthMm - a.widthMm);
}

/**
 * 表の行と図の外形をつなぐ番号の数(globals.css の .rl-size-link の決まりを 0〜PAD_LINK_SLOTS-1 まで書いている)。
 * データでいちばん多いパッドは外形 8 本。これより多い番号の行・外形には番号を付けない(つながらないだけで壊れない)。
 */
export const PAD_LINK_SLOTS = 10;

/**
 * 表の行(サイズ)→ 図の外形の番号(padScale の outlines の添え字)。数字がないサイズ・PAD_LINK_SLOTS を超える番号は null。
 * sizes は図に渡すものと同じ(pad.sizes)。サイズの名前は自由な文字なので、番号で CSS の :has() に照らし合わせる。
 */
export function padOutlineIndexer(sizes: readonly PadSize[]): (s: PadSize) => number | null {
  const index = new Map(outlineGroups(sizes, null).map((g, i) => [sizeKey(g), i]));
  return (s) => {
    if (!drawable(s)) return null;
    const i = index.get(sizeKey(s));
    return i === undefined || i >= PAD_LINK_SLOTS ? null : i;
  };
}

export function padScale(sizes: readonly PadSize[], matched: readonly PadSize[] | null): PadScaleGeometry | null {
  const hit = matched === null ? null : new Set(matched);
  const list = outlineGroups(sizes, hit);
  if (list.length === 0) return null;

  const widthMm = Math.max(...list.map((g) => g.widthMm));
  const depthMm = Math.max(...list.map((g) => g.depthMm));
  const pxPerMm = Math.min(SCALE_FRAME.maxWidthPx / widthMm, SCALE_FRAME.heightPx / depthMm);
  const pxPerMmMin = Math.min(SCALE_FRAME.mobileMaxWidthPx / widthMm, SCALE_FRAME.mobileHeightPx / depthMm);
  const line = SCALE_FRAME.labelLinePx / pxPerMmMin;
  const inset = LABEL_INSET_PX / pxPerMmMin;

  // 札を大きい順に右上の角へ。外形に収まらない札は描かない。横に重なる札と縦に近ければ下へずらし、外形の下に出るなら描かない
  const placed: Box[] = [];
  const outlines: PadOutline[] = list.map((g) => {
    const label = g.labels.join("・");
    const y = depthMm - g.depthMm;
    const right = g.widthMm - inset;
    const w = labelPx(label) / pxPerMmMin;
    const left = right - w;
    let top = y + inset;
    let shown = left >= inset && line + 2 * inset <= g.depthMm;
    if (shown) {
      for (let moved = true; moved; ) {
        moved = false;
        for (const p of placed) {
          if (overlaps({ x: left, y: top, width: w, height: line }, p)) { top = p.y + p.height; moved = true; }
        }
      }
      shown = top + line <= depthMm;
      if (shown) placed.push({ x: left, y: top, width: w, height: line });
    }
    return { label, widthMm: g.widthMm, depthMm: g.depthMm, x: 0, y, width: g.widthMm, height: g.depthMm, matched: g.matched, labelShown: shown, labelTopMm: top, labelLeftMm: left, labelRightMm: right };
  });

  // マウスは一番小さいサイズの真ん中。札と重なるときは左下の角に寄せ(どちらもパッドの上)、それでも重なる札は描かない(面を隠さない)
  const smallest = list[list.length - 1];
  const center = {
    x: smallest.widthMm / 2 - AVG_MOUSE.widthMm / 2,
    y: depthMm - smallest.depthMm / 2 - AVG_MOUSE.lengthMm / 2,
    width: AVG_MOUSE.widthMm,
    height: AVG_MOUSE.lengthMm,
  };
  const corner = { ...center, x: inset, y: depthMm - inset - AVG_MOUSE.lengthMm };
  const boxOf = (o: PadOutline): Box => ({ x: o.labelLeftMm, y: o.labelTopMm, width: o.labelRightMm - o.labelLeftMm, height: line });
  const hits = (m: Box) => outlines.filter((o) => o.labelShown && overlaps(boxOf(o), m));
  const cornerFits = corner.x + corner.width <= smallest.widthMm && corner.y >= depthMm - smallest.depthMm;
  const place = hits(center).length > 0 && cornerFits && hits(corner).length === 0 ? corner : center;
  for (const o of hits(place)) o.labelShown = false;

  return {
    viewBox: `0 0 ${widthMm} ${depthMm}`, widthMm, depthMm, pxPerMm, pxPerMmMin, outlines,
    hiddenLabels: outlines.filter((o) => !o.labelShown).map((o) => o.label).reverse(),
    mouse: { ...place, rx: AVG_MOUSE.widthMm * 0.45 },
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
