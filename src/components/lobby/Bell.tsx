import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function Bell() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.rpc("unread_count");
  const n = typeof data === "number" ? data : 0;
  return (
    <Link href="/lobby/inbox" aria-label={`通知 ${n}件`} className="relative">
      🔔{n > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-[var(--rl-magenta)] px-1.5 text-[10px] font-bold text-white">{n}</span>}
    </Link>
  );
}
