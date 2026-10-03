export const SW_URL = "/sw.js";

export type SwRegisterEnv = {
  nodeEnv: string | undefined;
  serviceWorker: { register(url: string, options: RegistrationOptions): Promise<unknown> } | undefined;
  readyState: DocumentReadyState;
  /** load の耳を付け、外す関数を返す */
  addLoadListener: (fn: () => void) => () => void;
};

/**
 * 本番のビルドで service worker が使えるときだけ、ページの読み込みのあとに /sw.js を登録する(設計書 3-2)。
 * updateViaCache: "none" で、ページを開くたびにブラウザが新しい sw.js を確かめる。失敗しても何も出さない。戻り値は後片付け。
 */
export function scheduleSwRegister(env: SwRegisterEnv): () => void {
  const sw = env.serviceWorker;
  if (env.nodeEnv !== "production" || !sw) return () => {};
  const go = () => {
    sw.register(SW_URL, { scope: "/", updateViaCache: "none" }).catch(() => {});
  };
  if (env.readyState === "complete") {
    go();
    return () => {};
  }
  return env.addLoadListener(go);
}
