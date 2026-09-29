import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/** ブラウザで描画しているとき true(サーバー描画とハイドレーション中は false)。localStorage を安全に読むために使う。 */
export function useIsClient(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
