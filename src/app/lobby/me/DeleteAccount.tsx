"use client";
import { useState, useTransition } from "react";
import { deleteMeAction } from "@/app/lobby/actions";
import { browserStorage } from "@/lib/my-settings-store";
import { unstable_rethrow } from "next/navigation";
import { clearDeviceRecords, deleteWithRestore } from "@/lib/device-records";
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
      // この端末のエイムの記録と、ホーム画面に追加の案内の記録も消す(plan.md D43。同じブラウザを使うほかの人に見せないため)。
      // 退会できなかったとき(利用停止中・確認中の通報があるとき・通信が切れたとき)は元に戻す
      const restoreDeviceRecords = clearDeviceRecords(browserStorage());
      onDeleted?.();
      start(async () => {
        // {error} のときも、通信が切れて action が例外で終わったときも、記録を戻す。退会できたときの移動(redirect)は投げ直す
        const { error: message } = await deleteWithRestore(() => deleteMeAction(), restoreDeviceRecords, unstable_rethrow);
        if (message) setError(message);
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
