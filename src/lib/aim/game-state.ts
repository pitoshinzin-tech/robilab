import type { View } from "./view";

export type AimPhase = "idle" | "countdown" | "playing" | "finished" | "aborted";
export type AimEvent = "start" | "go" | "done" | "lost" | "reset";

export function reduceAim(phase: AimPhase, event: AimEvent): AimPhase {
  switch (event) {
    case "start": return phase === "idle" ? "countdown" : phase;
    case "go": return phase === "countdown" ? "playing" : phase;
    case "done": return phase === "playing" ? "finished" : phase;
    case "lost": return phase === "countdown" || phase === "playing" ? "aborted" : phase;
    case "reset": return "idle";
  }
}

/** 判定を進めてよい視点の範囲(度)。yaw は巻き戻さないので、90° 以上では aimPoint が鏡写しになる。 */
export const STEP_LIMIT_DEG = 80;

/** 視点が板の前方にあるときだけ true。false のフレームは stepTrace を呼ばない。 */
export function canStepTrace(v: View): boolean {
  return Math.abs(v.yaw) < STEP_LIMIT_DEG && Math.abs(v.pitch) < STEP_LIMIT_DEG;
}

/** 筆(左ボタン)の状態を変える出来事。lost はポインターロックが外れた、blur はウィンドウから外れた。 */
export type PenEvent = { kind: "down" | "up"; button: number } | { kind: "lost" } | { kind: "blur" };

/**
 * 筆が下りているか(左ボタンを押しているか)を更新する。
 * 遊んでいる間(カウントダウンの後)に押したときだけ下ろす。スタートのクリックやカウントダウン中から
 * 押しっぱなしのボタンは数えない(押し直しが要る)。ロックが外れたときやウィンドウから外れたときは上げる。
 */
export function reducePen(down: boolean, ev: PenEvent, phase: AimPhase): boolean {
  switch (ev.kind) {
    case "down":
      if (ev.button !== 0) return down;
      return phase === "playing";
    case "up":
      return ev.button === 0 ? false : down;
    case "lost":
    case "blur":
      return false;
  }
}
