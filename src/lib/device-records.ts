import type { SettingsStorage } from "@/lib/my-settings-store";
import { HISTORY_KEY } from "@/lib/aim/history";
import { HINT_STORAGE_KEY } from "@/lib/pwa/install-hint";

/** 退会のときに消す、この端末の記録(plan.md D43。同じブラウザを使うほかの人に見せない・残さない) */
export const DEVICE_RECORD_KEYS = [HISTORY_KEY, HINT_STORAGE_KEY] as const;

/**
 * この端末の記録を消し、元に戻す関数を返す(退会できなかったときに呼ぶ)。
 * 読めない・消せない・戻せないときも投げない(退会の手続きと画面は止めない)。
 */
export function clearDeviceRecords(storage: SettingsStorage | null): () => void {
  const saved: [string, string][] = [];
  for (const key of DEVICE_RECORD_KEYS) {
    try {
      const v = storage?.getItem(key);
      if (v != null) saved.push([key, v]);
    } catch {
      // 読めなくても消すのは試す
    }
    try {
      storage?.removeItem(key);
    } catch {
      // 消せなくても画面は止めない
    }
  }
  return () => {
    for (const [key, v] of saved) {
      try {
        storage?.setItem(key, v);
      } catch {
        // 戻せなくても画面は止めない
      }
    }
  };
}

/** action が例外で失敗した(通信が切れたなど)ときの文。謝らない・次にやることを言う */
export const DELETE_FAILED_MESSAGE = "退会の手続きができませんでした。電波のよい所で、もう一度お試しください。";

/**
 * 退会の action を動かし、できなかったときはこの端末の記録を戻す(restore)。
 * - `{ error }` が返ったとき:戻して、その文を返す
 * - 例外(通信が切れた・サーバーが落ちた):戻して、DELETE_FAILED_MESSAGE を返す
 * - 退会できたときの redirect は、クライアントでは例外として届く。rethrow(next/navigation の unstable_rethrow)で投げ直し、戻さない
 */
export async function deleteWithRestore(
  run: () => Promise<{ error?: string } | void | undefined>,
  restore: () => void,
  rethrow: (e: unknown) => void,
): Promise<{ error: string | null }> {
  try {
    const res = await run();
    if (res?.error) {
      restore();
      return { error: res.error };
    }
    return { error: null };
  } catch (e) {
    rethrow(e);
    restore();
    return { error: DELETE_FAILED_MESSAGE };
  }
}
