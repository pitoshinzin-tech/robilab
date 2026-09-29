import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertNoRpcError } from "@/lib/lobby-errors";
import { InboxList } from "@/components/lobby/InboxList";
import { AccountStatusNotice } from "@/components/lobby/AccountStatusNotice";
import { InboxSeenPing } from "./InboxSeenPing";
import type { InboxRow } from "@/lib/lobby-types";

type MyProfileRow = { status: "active" | "suspended" | "banned" };

export default async function InboxPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/lobby");

  const meRows = assertNoRpcError(await supabase.rpc("my_profile"));
  const me = (meRows as MyProfileRow[] | null)?.[0];
  if (!me) redirect("/lobby/join");
  if (me.status !== "active") return <AccountStatusNotice status={me.status} />;

  const data = assertNoRpcError(await supabase.rpc("my_inbox"));
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <InboxSeenPing />
      <h1 className="mb-6 text-2xl font-bold">🔔 通知</h1>
      <InboxList rows={(data ?? []) as InboxRow[]} />
    </main>
  );
}
