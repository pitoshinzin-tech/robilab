"use client";
import { useEffect } from "react";

/**
 * /lobby/inbox がマウントされたら Bell に「既読になった」ことを知らせる。
 * サーバー側の mark_inbox_seen はページ描画前に完了しているが、
 * Bell(クライアントコンポーネント)は自分の usePathname 変化でも再取得するため、
 * このイベントは念のための二重の合図として使う。
 */
export function InboxSeenPing() {
  useEffect(() => {
    window.dispatchEvent(new Event("robilab:inbox-seen"));
  }, []);
  return null;
}
