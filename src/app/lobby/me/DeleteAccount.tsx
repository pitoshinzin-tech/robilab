"use client";
import { useState, useTransition } from "react";
import { deleteMeAction } from "@/app/lobby/actions";
import { browserStorage } from "@/lib/my-settings-store";
import { HISTORY_KEY, clearLocal as clearAimHistory } from "@/lib/aim/history";
import { PlainButton } from "@/components/ui/plain-button";
import { DangerAction } from "@/components/ui/danger-zone";

/**
 * 退会の操作(DangerZone の中に置く 1 つの DangerAction)。/lobby/me と /my で使う。
 * onDeleted: 退会を確定したとき(サーバーへの削除を始める直前)に呼ぶ。/my でこの端末の設定を消すのに使う。
 */
export function DeleteAccount({ onDeleted }: { onDeleted?: () => void } = {}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const confirmAndDelete = () => {
    if (confirm("退会すると、プロフィールと声かけの記録、エイムの記録がすべて消えます(この端末のエイムの記録も消えます)。退会から7日間は、同じ Discord アカウントで再登録できません。よろしいですか?")) {
      // この端末のエイムの記録も消す(plan.md D43。同じブラウザを使うほかの人に見せないため)。
      // 退会できなかったとき(利用停止中・確認中の通報があるとき)は元に戻す
      const storage = browserStorage();
      let savedHistory: string | null = null;
      try { savedHistory = storage?.getItem(HISTORY_KEY) ?? null; } catch { /* 読めなくても退会は進める */ }
      clearAimHistory(storage);
      onDeleted?.();
      start(async () => {
        const res = await deleteMeAction();
        if (res?.error) {
          setError(res.error);
          try { if (savedHistory) storage?.setItem(HISTORY_KEY, savedHistory); } catch { /* 戻せなくても画面は止めない */ }
        }
      });
    }
  };
  return (
    <DangerAction
      description="プロフィール・声かけ・エイムの記録がすべて消えます。退会から 7 日間は再登録できません。"
      error={error}
    >
      <PlainButton type="button" variant="danger" size="sm" fixedWidth loading={pending} loadingText="退会の手続き中…" onClick={confirmAndDelete}>
        退会する
      </PlainButton>
    </DangerAction>
  );
}
