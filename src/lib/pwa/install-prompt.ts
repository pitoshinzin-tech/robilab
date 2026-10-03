/** Chrome・Edge の beforeinstallprompt(標準の型にないので、使う所だけ) */
export type InstallPromptEvent = Event & { prompt: () => Promise<unknown> };
export type InstallPromptSnapshot = { event: InstallPromptEvent | null; installed: boolean };
type Target = Pick<EventTarget, "addEventListener">;

export type InstallPromptStore = {
  start(target: Target): void;
  prompt(): Promise<void>;
  subscribe(fn: () => void): () => void;
  get(): InstallPromptSnapshot;
};

/** useSyncExternalStore のサーバーの値(同じものを返し続ける) */
export const SERVER_SNAPSHOT: InstallPromptSnapshot = { event: null, installed: false };

/**
 * 「ホーム画面に追加」の知らせを持つ入れ物(読み替え 4)。知らせはページを開いた直後に 1 回だけ来るので、
 * layout の SwRegister で受け取り始め、ページを移っても使えるようにモジュールの中に持つ。
 * preventDefault はしない(ブラウザ自身の案内を消さない。設計書 4-2)。
 */
export function createInstallPromptStore(): InstallPromptStore {
  let snapshot: InstallPromptSnapshot = SERVER_SNAPSHOT;
  let started = false;
  const listeners = new Set<() => void>();
  const set = (next: InstallPromptSnapshot) => {
    snapshot = next;
    listeners.forEach((fn) => fn());
  };
  return {
    start(target) {
      if (started) return;
      started = true;
      target.addEventListener("beforeinstallprompt", (e) => set({ ...snapshot, event: e as InstallPromptEvent }));
      target.addEventListener("appinstalled", () => set({ event: null, installed: true }));
    },
    async prompt() {
      const e = snapshot.event;
      if (!e) return;
      // prompt() は 1 回しか使えないので、先に手放す(ボタンが消える)
      set({ ...snapshot, event: null });
      try {
        await e.prompt();
      } catch {
        // 使えないときは何もしない(手順の文は残っている)
      }
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    get: () => snapshot,
  };
}

export const installPromptStore = createInstallPromptStore();
