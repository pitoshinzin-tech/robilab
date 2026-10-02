/** 追補 6 章:開始のときの 3・2・1。1 つ 600ms で置き換える(点滅させない。明るさは変えない)。動きを減らす設定でも数は出す(ゲームの合図)。 */
export const COUNTDOWN_STEP_MS = 600;
export const COUNTDOWN_MS = COUNTDOWN_STEP_MS * 3;

export function countdownDigit(remainingMs: number): 1 | 2 | 3 {
  return Math.min(3, Math.max(1, Math.ceil(remainingMs / COUNTDOWN_STEP_MS))) as 1 | 2 | 3;
}

/** --rl-text-display-2 の clamp(72px, 55.1px + 4.51vw, 120px) を、canvas の文字の大きさに使う px にする */
export function display2Px(viewportWidth: number): number {
  return Math.round(Math.min(120, Math.max(72, 55.1 + 0.0451 * viewportWidth)));
}
