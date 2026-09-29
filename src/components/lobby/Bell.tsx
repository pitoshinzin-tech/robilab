"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const INBOX_SEEN_EVENT = "robilab:inbox-seen";

export function Bell() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createSupabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    if (!mounted.current) return;
    if (!user) {
      setVisible(false);
      return;
    }
    const { data, error } = await supabase.rpc("unread_count");
    if (!mounted.current) return;
    if (error) {
      setVisible(false);
      return;
    }
    setVisible(true);
    setCount(typeof data === "number" ? data : 0);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // ページ遷移のたびに再取得(サーバーコンポーネントのレイアウトは再レンダリングされないため)
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  // /lobby/inbox で既読化(markInboxSeenAction)が終わった直後に 0 へ更新する
  useEffect(() => {
    const onSeen = () => refresh();
    window.addEventListener(INBOX_SEEN_EVENT, onSeen);
    return () => window.removeEventListener(INBOX_SEEN_EVENT, onSeen);
  }, [refresh]);

  // タブに戻ってきたときにも再取得
  useEffect(() => {
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  if (!visible) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <Link href="/lobby/inbox" aria-label={`通知 ${count}件`} className="relative">
      🔔{count > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-[var(--rl-magenta)] px-1.5 text-[10px] font-bold text-white">{label}</span>}
    </Link>
  );
}
