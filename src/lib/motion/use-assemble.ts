import { useState, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/**
 * 追補 S2:結果の大きな絵を rl-assemble で組み上げるか。
 * ページを読み込んだとき(直接開いた・再読み込み)と、View Transition がないブラウザで移ってきたときだけ組み上げる。
 * View Transition で移ってきたときは、診断のマスの画面から移る動きだけにする(2 つ重ねない)。
 */
export function shouldAssemble(hydrating: boolean, supportsViewTransition: boolean): boolean {
  return hydrating || !supportsViewTransition;
}

/**
 * サーバーとハイドレーションでは true。ハイドレーションでないとき(ブラウザの中で移ってきたとき)は、View Transition の有無で決める。
 * 最初に決めた値をそのまま使う(ハイドレーションのあとに false へ変わると、組み上がりの途中でクラスが外れて絵が飛ぶため)。
 */
export function useAssemble(): boolean {
  const hydrating = useSyncExternalStore(noSubscribe, () => false, () => true);
  const [assemble] = useState(() => shouldAssemble(hydrating, typeof document !== "undefined" && typeof document.startViewTransition === "function"));
  return assemble;
}
