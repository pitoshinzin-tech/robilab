import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/lobby/ProfileForm";
import { registerAction } from "../actions";

export default async function JoinPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/lobby");
  const { data: me } = await supabase.rpc("my_profile");
  if (me && me.length > 0) redirect("/lobby");
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-2 text-2xl font-bold">ロビーに登録</h1>
      <p className="mb-6 text-sm text-[var(--rl-muted)]">Discord の名前は、おたがいが「OK」した相手にだけ表示されます。</p>
      <ProfileForm mode="register" action={registerAction} />
    </main>
  );
}
