import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/lobby/ProfileForm";
import type { Candidate } from "@/lib/lobby-types";
import { updateProfileAction } from "../actions";
import { DeleteAccount } from "./DeleteAccount";

export default async function MePage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/lobby");
  const { data } = await supabase.rpc("my_profile");
  const me = data?.[0];
  if (!me) redirect("/lobby/join");
  const initial: Partial<Candidate> = {
    id: me.id,
    nickname: me.nickname,
    type_code: me.type_code,
    axes: me.axes,
    games: me.games,
    platforms: me.platforms,
    voice_ok: me.voice_ok,
    time_slots: me.time_slots,
    bio: me.bio,
    created_at: me.created_at,
  };
  return (
    <main className="mx-auto grid max-w-md gap-8 px-4 py-6">
      <h1 className="text-2xl font-bold">プロフィール</h1>
      <ProfileForm mode="edit" action={updateProfileAction} initial={initial} />
      <DeleteAccount />
    </main>
  );
}
