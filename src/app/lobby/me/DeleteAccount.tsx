"use client";
import { useState, useTransition } from "react";
import { deleteMeAction } from "@/app/lobby/actions";
import { browserStorage } from "@/lib/my-settings-store";
import { clearLocal as clearAimHistory } from "@/lib/aim/history";

/** onDeleted: 退会を確定したとき(サーバーへの削除を始める直前)に呼ぶ。/my でこの端末の設定を消すのに使う。 */
export function DeleteAccount({ onDeleted }: { onDeleted?: () => void } = {}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      <button type="button" disabled={pending}
        onClick={() => {
          if (confirm("退会すると、プロフィールと声かけの記録、エイムの記録がすべて消えます(この端末のエイムの記録も消えます)。退会から7日間は、同じ Discord アカウントで再登録できません。よろしいですか?")) {
            // この端末のエイムの記録も消す(plan.md D43。同じブラウザを使うほかの人に見せないため)
            clearAimHistory(browserStorage());
            onDeleted?.();
            start(async () => {
              const res = await deleteMeAction();
              if (res?.error) setError(res.error);
            });
          }
        }}
        className="text-sm text-[var(--rl-muted)] underline">
        退会する
      </button>
      {error && <p role="alert" className="text-sm text-[var(--rl-danger)]">{error}</p>}
    </div>
  );
}
