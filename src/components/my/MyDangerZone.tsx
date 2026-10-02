"use client";
import { useState } from "react";
import { DeleteAccount } from "@/app/lobby/me/DeleteAccount";
import { browserStorage, clearDirty, clearLocal } from "@/lib/my-settings-store";
import { DangerAction, DangerZone } from "@/components/ui/danger-zone";
import { PlainButton } from "@/components/ui/plain-button";

/** 退会を確定したとき、この端末のマイ設定も消す(今までの SyncPanel と同じ) */
function clearThisDevice() {
  const storage = browserStorage();
  clearLocal(storage);
  clearDirty(storage);
}

/**
 * /my の消す操作(ページの一番下、赤い枠)。「設定を消す」と、ログインしていれば「退会する」を線で分けて並べる。
 * 確かめの文と動き(window.confirm・消せたら読み込み直す)は今までの SyncPanel のまま。
 */
export function MyDangerZone({ loggedIn, onRemove }: { loggedIn: boolean; onRemove: () => Promise<boolean> }) {
  const [removing, setRemoving] = useState(false);
  const remove = () => {
    if (removing || !confirm("マイ設定を消します(この端末とサーバーの両方)。よろしいですか?")) return;
    setRemoving(true);
    // 消せたら読み込み直すので、そのまま押せない形で待つ。消せなかったら(理由は「保存と公開」に出る)押せる形に戻す
    void onRemove().then((ok) => { if (ok) window.location.reload(); else setRemoving(false); }, () => setRemoving(false));
  };
  return (
    <DangerZone headingId="my-danger">
      <DangerAction description={loggedIn ? "この端末とサーバーの両方から、マイ設定を消します。" : "この端末から、マイ設定を消します。"}>
        <PlainButton type="button" variant="danger" size="sm" fixedWidth loading={removing} loadingText="消しています…" onClick={remove}>
          設定を消す
        </PlainButton>
      </DangerAction>
      {loggedIn && <DeleteAccount onDeleted={clearThisDevice} />}
    </DangerZone>
  );
}
