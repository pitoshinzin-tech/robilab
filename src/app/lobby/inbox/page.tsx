import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertNoRpcError } from "@/lib/lobby-errors";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { InboxList } from "@/components/lobby/InboxList";
import { AccountStatusNotice } from "@/components/lobby/AccountStatusNotice";
import { PageShell } from "@/components/ui/page-shell";
import { InboxSeenPing } from "./InboxSeenPing";
import type { InboxRow } from "@/lib/lobby-types";

type MyProfileRow = { status: "active" | "suspended" | "banned"; type_code: string | null };

export default async function InboxPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/lobby");

  const meRows = assertNoRpcError(await supabase.rpc("my_profile"));
  const me = (meRows as MyProfileRow[] | null)?.[0];
  if (!me) redirect("/lobby/join");
  if (me.status !== "active") return <AccountStatusNotice status={me.status} />;

  const data = assertNoRpcError(await supabase.rpc("my_inbox"));
  const rows = (data ?? []) as InboxRow[];
  // 追補 6 章:絵は、ここ(サーバー)で作って渡す(16 タイプの文章をブラウザの JS に入れない)。
  // dissolve:届いた声かけの名前のリンクのホバー・フォーカスで塗り替わる重ね(動きの参考 025)。リンクの外では動かない
  const codes = new Set([me.type_code, ...rows.map((r) => r.type_code)].filter((c): c is string => Boolean(c)));
  const icons = Object.fromEntries([...codes].map((code) => [code, <TypeIcon key={code} code={code} size={48} dissolve />]));
  return (
    <PageShell title="通知">
      <InboxSeenPing />
      <InboxList rows={rows} icons={icons} myType={me.type_code} />
    </PageShell>
  );
}
