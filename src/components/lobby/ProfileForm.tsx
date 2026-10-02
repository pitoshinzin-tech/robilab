"use client";
import { startTransition, useActionState, useMemo, useState, useSyncExternalStore } from "react";
import { GAMES } from "@/data/games";
import { TIME_SLOTS, PLATFORMS, RANK_BANDS } from "@/data/lobby-options";
import type { Candidate } from "@/lib/lobby-types";
import { Check } from "lucide-react";
import { lobbyErrorMessage } from "@/lib/lobby-errors";
import { ButtonLink } from "@/components/ui/button-link";
import { PlainButton } from "@/components/ui/plain-button";
import { Field, FieldError, fieldDescribedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { CheckChip } from "@/components/ui/chip-button";

type Result = { error?: string; ok?: string };
type Diag = { code: string; axes: string };

const DIAG_KEY = "robilab:lastDiagnosis";
const noSubscribe = () => () => {};
function readDiagRaw(): string | null {
  try {
    return sessionStorage.getItem(DIAG_KEY);
  } catch {
    return null;
  }
}
type Props = {
  mode: "register" | "edit";
  action: (prev: Result, form: FormData) => Promise<Result>;
  initial?: Partial<Candidate>;
};

export function ProfileForm({ mode, action, initial }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  // 診断結果(sessionStorage に保存したもの)があれば自動で入れる。サーバーでの描画時は null
  const diagRaw = useSyncExternalStore(noSubscribe, readDiagRaw, () => null);
  const diag = useMemo<Diag | null>(() => {
    if (!diagRaw) return null;
    try {
      return JSON.parse(diagRaw) as Diag;
    } catch {
      return null;
    }
  }, [diagRaw]);
  const [clientError, setClientError] = useState<string | null>(null);
  const BIO_MAX = 50;
  const [bioLength, setBioLength] = useState((initial?.bio ?? "").length);
  const underAge = state.error === lobbyErrorMessage("UNDER_AGE");
  // 保存できたあと、まだ何も直していない間だけボタンを「保存しました」にする(009)
  const [editedSinceSubmit, setEditedSinceSubmit] = useState(false);
  const saved = !!state.ok && !state.error && !clientError && !pending && !editedSinceSubmit;

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

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    setEditedSinceSubmit(false);
    handleSubmit(e);
  }

  return (
    <form onSubmit={onSubmit} onChange={() => setEditedSinceSubmit(true)} className="grid gap-6">
      {mode === "register" && (
        <Field id="pf-birthdate" label="生年月日" required hint="公開されません。年齢の確認だけに使います。">
          <Input id="pf-birthdate" type="date" name="birthdate" required aria-describedby={fieldDescribedBy("pf-birthdate", { hint: true })} />
        </Field>
      )}
      <Field id="pf-nickname" label="ニックネーム(20文字まで)" required>
        <Input id="pf-nickname" name="nickname" maxLength={20} required defaultValue={initial?.nickname} />
      </Field>
      <fieldset className="grid gap-4">
        <legend className="mb-2 text-sm font-bold">遊ぶゲーム(1つ以上)</legend>
        <div className="flex flex-wrap gap-2">
          {GAMES.map((g) => (
            <CheckChip key={g.id} name="games" value={g.id} checked={checkedGames.has(g.id)} onChange={(e) => toggleGame(g.id, e.target.checked)}>{g.name}</CheckChip>
          ))}
        </div>
        {GAMES.filter((g) => checkedGames.has(g.id)).map((g) => (
          <Field key={g.id} id={`pf-rank-${g.id}`} label={`${g.name} のランク帯`}>
            <NativeSelect id={`pf-rank-${g.id}`} name={`rank-${g.id}`} defaultValue={initial?.games?.find((x) => x.id === g.id)?.rank ?? "unranked"}>
              {RANK_BANDS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </NativeSelect>
          </Field>
        ))}
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-bold">遊ぶ時間帯(1つ以上)</legend>
        <div className="flex flex-wrap gap-2">
          {TIME_SLOTS.map((t) => <CheckChip key={t.id} name="timeSlots" value={t.id} defaultChecked={initial?.time_slots?.includes(t.id)}>{t.label}</CheckChip>)}
        </div>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-bold">機種</legend>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => <CheckChip key={p.id} name="platforms" value={p.id} defaultChecked={initial?.platforms?.includes(p.id)}>{p.label}</CheckChip>)}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-2"><CheckChip name="voiceOk" defaultChecked={initial?.voice_ok}>ボイスチャット OK</CheckChip></div>
      <Field id="pf-bio" label={`ひとこと(${BIO_MAX}文字まで)`} hint={`あと ${BIO_MAX - bioLength} 文字`}>
        <Input id="pf-bio" name="bio" maxLength={BIO_MAX} defaultValue={initial?.bio} aria-describedby={fieldDescribedBy("pf-bio", { hint: true })}
          onChange={(e) => setBioLength(e.target.value.length)} />
      </Field>
      <input type="hidden" name="typeCode" value={diag?.code ?? initial?.type_code ?? ""} />
      <input type="hidden" name="axes" value={diag?.axes ?? (initial?.axes ? JSON.stringify(initial.axes) : "")} />
      <p className="text-sm text-rl-muted">
        {diag || initial?.type_code ? `タイプ:${diag?.code ?? initial?.type_code}(診断結果から自動で入ります)` : "診断をすると、相性の%が表示されるようになります。"}
      </p>
      {mode === "register" && (
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input type="checkbox" name="agree" required className="mt-1 size-5 shrink-0 cursor-pointer accent-rl-selected" />
          <span className="min-w-0"><a href="/terms" target="_blank" rel="noopener" className="text-rl-accent underline">利用規約</a>と<a href="/privacy" target="_blank" rel="noopener" className="text-rl-accent underline">プライバシーポリシー</a>に同意します(18歳以上であることを含みます)</span>
        </label>
      )}
      {clientError && <FieldError>{clientError}</FieldError>}
      {state.error && <FieldError>{state.error}</FieldError>}
      {underAge && (
        <div className="grid gap-4">
          <p className="text-base [word-break:auto-phrase]">18 歳になったら使えます。それまでは診断やマイ設定を使ってね。</p>
          <ButtonLink href="/" variant="secondary" className="justify-self-start">トップへ</ButtonLink>
        </div>
      )}
      {state.ok && <p role="status" className="flex items-start gap-2 text-sm text-rl-success"><Check aria-hidden className="mt-0.5 size-4 shrink-0" /><span className="min-w-0">{state.ok}</span></p>}
      {/* (動きの参考 009)送る → 保存中 → 保存しました。3 つを同じマスに重ねるので幅は変わらない。直すとまた「保存する」に戻る */}
      <PlainButton type="submit" variant="primary" fixedWidth loading={pending} loadingText="保存中…"
        successText={mode === "edit" ? "保存しました" : undefined} success={saved} className="justify-self-start">
        {mode === "register" ? "登録してロビーに入る" : "保存する"}
      </PlainButton>
    </form>
  );
}
