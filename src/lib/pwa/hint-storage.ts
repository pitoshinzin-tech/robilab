// 「ホーム画面に追加」の案内の記録(localStorage の robilab:pwaHint)を、ブラウザで読み書きする小さな道具。
// 判断は install-hint.ts の純粋な関数に任せ、ここは保存だけ。読めない・書けないときは投げない(画面を止めない)。
import { HINT_STORAGE_KEY, dismissHint, parseHintState } from "./install-hint";

export type HintStorage = Pick<Storage, "getItem" | "setItem">;

/** localStorage が使えれば返す。プライベートモードなどで読めない・書けないときは null(案内を出さない) */
export function openHintStorage(): HintStorage | null {
  try {
    const s = window.localStorage;
    const probe = "robilab:probe";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/**
 * インストールした(appinstalled が来た)ことを残す:来訪日はそのまま、dismissed を立てる(設計書 4-1「インストールしたら二度と出さない」)。
 * layout の SwRegister から呼ぶので、/my の「追加する」でも、ブラウザのメニューから入れても、どのページでも残る。
 */
export function recordInstalled(storage: HintStorage | null): void {
  if (!storage) return;
  try {
    const next = dismissHint(parseHintState(storage.getItem(HINT_STORAGE_KEY)));
    storage.setItem(HINT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 書けなくても画面は変えない
  }
}
