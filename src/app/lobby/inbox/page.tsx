import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { InboxList } from "@/components/lobby/InboxList";
import type { InboxRow } from "@/lib/lobby-types";

export default async function InboxPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/lobby");
  const { data } = await supabase.rpc("my_inbox");
  await supabase.rpc("mark_inbox_seen");
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">🔔 通知</h1>
      <InboxList rows={(data ?? []) as InboxRow[]} />
    </main>
  );
}
