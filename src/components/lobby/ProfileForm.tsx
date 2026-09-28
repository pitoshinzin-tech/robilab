"use client";
import { startTransition, useActionState, useEffect, useState } from "react";
import { GAMES } from "@/data/games";
import { TIME_SLOTS, PLATFORMS, RANK_BANDS } from "@/data/lobby-options";
import type { Candidate } from "@/lib/lobby-types";

type Result = { error?: string; ok?: string };
type Props = {
  mode: "register" | "edit";
  action: (prev: Result, form: FormData) => Promise<Result>;
  initial?: Partial<Candidate>;
};

export function ProfileForm({ mode, action, initial }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [diag, setDiag] = useState<{ code: string; axes: string } | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  // 診断結果(sessionStorage に保存したもの)があれば自動で入れる
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("robilab:lastDiagnosis");
      if (raw) setDiag(JSON.parse(raw));
    } catch {}
  }, []);

  const [checkedGames, setCheckedGames] = useState<Set<string>>(
    () => new Set((initial?.games ?? []).map((g) => g.id)),
  );

  function toggleGame(id: string, checked: boolean) {
    setCheckedGames((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // React 19 の <form action> は、成功・失敗にかかわらず送信後にフォームを
    // リセットしてしまう(requestFormReset)。サーバー側エラーで入力内容が
    // 消えるのを防ぐため、ここで preventDefault してから FormData を作り、
    // startTransition 経由で formAction を手動で呼び出す。
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const hasGame = formData.getAll("games").length > 0;
    const hasTimeSlot = formData.getAll("timeSlots").length > 0;
    if (!hasGame || !hasTimeSlot) {
      setClientError("遊ぶゲームと時間帯を、それぞれ1つ以上選んでください。");
      return;
    }
    setClientError(null);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {mode === "register" && (
        <label className="grid gap-1 text-sm">
          生年月日(公開されません。年齢の確認だけに使います)
          <input type="date" name="birthdate" required className="h-12 rounded-xl border border-white/15 bg-[#151a33] px-3" />
        </label>
      )}
      <label className="grid gap-1 text-sm">
        ニックネーム(20文字まで)
        <input name="nickname" maxLength={20} required defaultValue={initial?.nickname} className="h-12 rounded-xl border border-white/15 bg-[#151a33] px-3" />
      </label>
      <fieldset className="grid gap-2 text-sm">
        <legend className="mb-1">遊ぶゲーム(1つ以上)とランク帯</legend>
        {GAMES.map((g) => (
          <div key={g.id} className="grid gap-2 rounded-lg border border-white/10 p-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="games"
                value={g.id}
                checked={checkedGames.has(g.id)}
                onChange={(e) => toggleGame(g.id, e.target.checked)}
              />
              {g.name}
            </label>
            {checkedGames.has(g.id) && (
              <select
                name={`rank-${g.id}`}
                defaultValue={initial?.games?.find((x) => x.id === g.id)?.rank ?? "unranked"}
                className="w-full rounded bg-[#151a33] px-2 py-1"
              >
                {RANK_BANDS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            )}
          </div>
        ))}
      </fieldset>
      <fieldset className="grid grid-cols-2 gap-2 text-sm">
        <legend className="mb-1">遊ぶ時間帯(1つ以上)</legend>
        {TIME_SLOTS.map((t) => (
          <label key={t.id} className="flex items-center gap-2"><input type="checkbox" name="timeSlots" value={t.id} defaultChecked={initial?.time_slots?.includes(t.id)} />{t.label}</label>
        ))}
      </fieldset>
      <fieldset className="flex flex-wrap gap-3 text-sm">
        <legend className="mb-1">機種</legend>
        {PLATFORMS.map((p) => (
          <label key={p.id} className="flex items-center gap-2"><input type="checkbox" name="platforms" value={p.id} defaultChecked={initial?.platforms?.includes(p.id)} />{p.label}</label>
        ))}
      </fieldset>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="voiceOk" defaultChecked={initial?.voice_ok} />ボイスチャット OK</label>
      <label className="grid gap-1 text-sm">
        ひとこと(50文字まで)
        <input name="bio" maxLength={50} defaultValue={initial?.bio} className="h-12 rounded-xl border border-white/15 bg-[#151a33] px-3" />
      </label>
      <input type="hidden" name="typeCode" value={diag?.code ?? initial?.type_code ?? ""} />
      <input type="hidden" name="axes" value={diag?.axes ?? (initial?.axes ? JSON.stringify(initial.axes) : "")} />
      <p className="text-xs text-[var(--rl-muted)]">
        {diag || initial?.type_code ? `タイプ:${diag?.code ?? initial?.type_code}(診断結果から自動で入ります)` : "診断をすると、相性の%が表示されるようになります。"}
      </p>
      {mode === "register" && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="agree" required />
          <span><a href="/terms" target="_blank" className="underline">利用規約</a>と<a href="/privacy" target="_blank" className="underline">プライバシーポリシー</a>に同意します(18歳以上であることを含みます)</span>
        </label>
      )}
      {clientError && <p role="alert" className="text-sm text-[var(--rl-magenta)]">{clientError}</p>}
      {state.error && <p role="alert" className="text-sm text-[var(--rl-magenta)]">{state.error}</p>}
      {state.ok && <p className="text-sm text-[var(--rl-lime)]">{state.ok}</p>}
      <button disabled={pending} className="h-12 rounded-full bg-[var(--rl-cyan)] font-bold text-[#0a0c16] disabled:opacity-50">
        {mode === "register" ? "登録してロビーに入る" : "保存する"}
      </button>
    </form>
  );
}
