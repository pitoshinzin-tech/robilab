/**
 * 追補 6 章:マウス探しの「実寸の重ね図」。自分の手の輪郭(長さ・幅から)の上に、マウスの形(長さ・幅の角丸の四角)を同じ縮尺で重ねる。
 * 単位は mm。手首の真ん中を (0, 0) に置き、上をマイナスにする。図は viewBox で箱に合わせて縮むので、はみ出さない。
 */
/** HandGuide.tsx と同じ手の絵(220×260 の座標。手のひらと指・親指) */
export const HAND_ART_PATHS: readonly string[] = [
  "M70 240 L70 150 Q70 130 80 125 L80 60 Q80 48 90 48 Q100 48 100 60 L100 120 L102 40 Q102 28 112 28 Q122 28 122 40 L122 118 L126 48 Q126 36 136 36 Q146 36 146 48 L146 122 L150 72 Q150 60 160 60 Q170 60 170 72 L170 170 Q170 215 140 240 Z",
  "M70 175 Q48 160 38 135 Q32 122 42 118 Q52 114 58 128 L70 150",
];
/** 絵の中の、親指の左端・指の先・手のひらの幅(HandGuide の「幅」の矢印と同じ x=80〜170。4 本の指の付け根)・手首 */
const ART = { left: 32, top: 28, palmLeft: 80, palmRight: 170, bottom: 240 } as const;
/** 手の幅が分からないときの目安(長さ × 0.45) */
export const HAND_WIDTH_RATIO = 0.45;
const PAD_MM = 6;

export type FitGeometry = {
  viewBox: string;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  handBox: { left: number; right: number; top: number; bottom: number };
  handTransform: string;
  mouse: { x: number; y: number; width: number; height: number; rx: number };
};

const r1 = (n: number) => Math.round(n * 10) / 10;

export function fitOverlay(handLengthCm: number, handWidthCm: number | null, mouseLengthMm: number, mouseWidthMm: number): FitGeometry {
  const hl = handLengthCm * 10;
  const hw = (handWidthCm ?? handLengthCm * HAND_WIDTH_RATIO) * 10;
  const sx = hw / (ART.palmRight - ART.palmLeft);
  const sy = hl / (ART.bottom - ART.top);
  const center = (ART.palmLeft + ART.palmRight) / 2;
  const handBox = { left: (ART.left - center) * sx, right: (ART.palmRight - center) * sx, top: -hl, bottom: 0 };
  const mouse = { x: -mouseWidthMm / 2, y: -mouseLengthMm, width: mouseWidthMm, height: mouseLengthMm, rx: Math.min(mouseWidthMm, mouseLengthMm) * 0.45 };
  const bounds = {
    minX: Math.min(handBox.left, mouse.x) - PAD_MM,
    minY: Math.min(handBox.top, mouse.y) - PAD_MM,
    maxX: Math.max(handBox.right, mouse.x + mouse.width) + PAD_MM,
    maxY: PAD_MM,
  };
  return {
    viewBox: [bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY].map(r1).join(" "),
    bounds,
    handBox,
    handTransform: `translate(${r1(-center * sx)} ${r1(-ART.bottom * sy)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})`,
    mouse,
  };
}
