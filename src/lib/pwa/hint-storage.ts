// 「ホーム画面に追加」の案内の記録(localStorage の robilab:pwaHint)を、ブラウザで読み書きする小さな道具。
// layout の SwRegister から全ページで読まれるので、install-hint.ts を import しない(判断の関数を全ページの JS に入れない)。
// キーと形は install-hint.ts と同じ(tests/pwa/hint-storage.test.ts が照らす)。読めない・書けないときは投げない。

/** install-hint.ts の HINT_STORAGE_KEY と同じ */
const KEY = "robilab:pwaHint";

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
 * インストールした(appinstalled が来た)ことを残す:{ v: 1, days, dismissed: true }。来訪日はそのまま残す
 * (中身の正しさは、読むときに install-hint.ts の parseHintState がそろえる)。設計書 4-1「インストールしたら二度と出さない」。
 * layout の SwRegister から呼ぶので、/my の「追加する」でも、ブラウザのメニューから入れても、どのページでも残る。
 */
export function recordInstalled(storage: HintStorage | null): void {
  if (!storage) return;
  try {
    let days: unknown = [];
    try {
      const o = JSON.parse(storage.getItem(KEY) ?? "null") as { v?: unknown; days?: unknown } | null;
      if (o && o.v === 1 && Array.isArray(o.days)) days = o.days;
    } catch {
      // 壊れた値は来訪日なしで書き直す
    }
    storage.setItem(KEY, JSON.stringify({ v: 1, days, dismissed: true }));
  } catch {
    // 書けなくても画面は変えない
  }
}
