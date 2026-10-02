/**
 * 追補 6 章:振り向きの長さを、画面の上の実寸の定規で見せる。CSS の 1cm は 96 / 2.54 px(機械によって実際の長さとはずれる。画面に「目安」と書く)。
 * 画面より長いときは折り返さず、出せる分(整数の cm)と「あと n cm」にする。
 */
export const PX_PER_CM = 96 / 2.54;
/** 「あと n cm」の文字のために空けておく長さ */
export const RULER_LABEL_CM = 4;

export type RulerLayout = { shownCm: number; restCm: number; ticks: { cm: number; major: boolean }[] };

export function rulerLayout(cm: number, availableCm: number): RulerLayout {
  const total = Number.isFinite(cm) && cm > 0 ? cm : 0;
  const room = Number.isFinite(availableCm) && availableCm > 0 ? availableCm : 0;
  const shownCm = total <= room ? total : Math.floor(room);
  const restCm = Math.max(0, Math.round((total - shownCm) * 10) / 10);
  const ticks = Array.from({ length: Math.floor(shownCm) + 1 }, (_, i) => ({ cm: i, major: i % 5 === 0 }));
  return { shownCm, restCm, ticks };
}

/**
 * 定規の SVG の長さ(整数の cm)。測った幅 availableCm に全部収まるときは幅いっぱい(整数に切る)、
 * 収まらないときは「あと n cm」の文字の分(RULER_LABEL_CM)を空ける。
 * 「収まる」は整数に切ったあとの幅で判断する(8.1cm を幅 8.23cm に出すと 8cm で切れて「あと 0.1cm」が出るため、その分も空ける)。
 */
export function rulerRoomCm(cm: number, availableCm: number): number {
  const total = Number.isFinite(cm) && cm > 0 ? cm : 0;
  const avail = Number.isFinite(availableCm) && availableCm > 0 ? availableCm : 0;
  const whole = Math.floor(avail);
  return total <= whole ? whole : Math.max(0, Math.floor(avail - RULER_LABEL_CM));
}
