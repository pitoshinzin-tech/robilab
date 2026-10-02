import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { assertNoRpcError } from "@/lib/lobby-errors";
import { ProfileForm } from "@/components/lobby/ProfileForm";
import { PageShell } from "@/components/ui/page-shell";
import { registerAction } from "../actions";

export default async function JoinPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/lobby");
  const me = assertNoRpcError(await supabase.rpc("my_profile"));
  if (me && me.length > 0) redirect("/lobby");
  return (
    <PageShell title="ロビーに登録" description={<span className="block [word-break:auto-phrase] text-balance">Discord の名前は、おたがいが「OK」した相手にだけ表示されます。</span>}>
      <div className="grid gap-6">
        {/* 流れはフォームの並びと同じ順(生年月日 → プロフィール → 規約)。押せない目印なので数字はマゼンタ */}
        <ol aria-label="登録の流れ" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {["生年月日", "プロフィール", "規約に同意"].map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span aria-hidden className="grid size-8 place-items-center rounded-rl-pill bg-rl-surface-2 font-display text-sm text-rl-highlight">{i + 1}</span>{s}
            </li>
          ))}
        </ol>
        <ProfileForm mode="register" action={registerAction} />
      </div>
    </PageShell>
  );
}
