"use client";
import { useEffect } from "react";
import { markInboxSeenAction } from "@/app/lobby/actions";

/**
 * /lobby/inbox がマウントされたら既読にし、Bell に「既読になった」ことを知らせる。
 * 既読化はページの描画(GET)ではなく、ここからのサーバーアクション(POST)で行う。
 * GET で状態を変えると、別サイトからのリンクを開いただけで未読が消えてしまうため。
 */
export function InboxSeenPing() {
  useEffect(() => {
    markInboxSeenAction()
      .catch(() => {})
      .finally(() => window.dispatchEvent(new Event("robilab:inbox-seen")));
  }, []);
  return null;
}
