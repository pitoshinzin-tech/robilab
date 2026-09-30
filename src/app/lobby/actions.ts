"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { errorCodeOf, lobbyErrorMessage } from "@/lib/lobby-errors";
import { parseAxesField } from "@/lib/lobby-form";

type Result = { error?: string; ok?: string };

function profileArgs(form: FormData): { error: string } | { args: Record<string, unknown> } {
  const games = form.getAll("games").map((id) => ({ id: String(id), rank: String(form.get(`rank-${id}`) ?? "unranked") }));
  const axes = parseAxesField(form.get("axes"));
  if (axes === "invalid") return { error: lobbyErrorMessage("INVALID_INPUT") };
  return {
    args: {
      p_nickname: String(form.get("nickname") ?? ""),
      p_type_code: (form.get("typeCode") as string) || null,
      p_axes: axes,
      p_games: games,
      p_platforms: form.getAll("platforms").map(String),
      p_voice_ok: form.get("voiceOk") === "on",
      p_time_slots: form.getAll("timeSlots").map(String),
      p_bio: String(form.get("bio") ?? ""),
    },
  };
}

export async function registerAction(_: Result, form: FormData): Promise<Result> {
  if (form.get("agree") !== "on") return { error: "利用規約への同意が必要です。" };
  const parsed = profileArgs(form);
  if ("error" in parsed) return { error: parsed.error };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("register_profile", { p_birthdate: String(form.get("birthdate") ?? ""), ...parsed.args });
  if (error) return { error: lobbyErrorMessage(errorCodeOf(error)) };
  redirect("/lobby");
}

export async function updateProfileAction(_: Result, form: FormData): Promise<Result> {
  const parsed = profileArgs(form);
  if ("error" in parsed) return { error: parsed.error };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("update_profile", parsed.args);
  if (error) return { error: lobbyErrorMessage(errorCodeOf(error)) };
  revalidatePath("/lobby");
  revalidatePath("/lobby/me");
  return { ok: "保存しました。" };
}

export async function sendApproachAction(id: string): Promise<Result> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("send_approach", { p_to: id });
  if (error) return { error: lobbyErrorMessage(errorCodeOf(error)) };
  revalidatePath("/lobby/inbox");
  return { ok: data === "matched" ? "つながりました!通知から Discord 名を確認してね。" : "声をかけました!返事を待ってね。" };
}

export async function respondAction(id: string, accept: boolean): Promise<Result> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("respond_approach", { p_id: id, p_accept: accept });
  if (error) return { error: lobbyErrorMessage(errorCodeOf(error)) };
  revalidatePath("/lobby/inbox");
  return { ok: accept ? "つながりました!" : "今回はパスしました。" };
}

export async function blockAction(id: string): Promise<Result> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("block_user", { p_id: id });
  if (error) return { error: lobbyErrorMessage(errorCodeOf(error)) };
  redirect("/lobby");
}

export async function reportAction(id: string, reason: string, detail: string): Promise<Result> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("report_user", { p_id: id, p_reason: reason, p_detail: detail });
  if (error) return { error: lobbyErrorMessage(errorCodeOf(error)) };
  redirect("/lobby?reported=1");
}

/** 通知ページを開いたときに、ブラウザ側から呼ぶ(GET の描画中に状態を変えないため) */
export async function markInboxSeenAction(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.rpc("mark_inbox_seen");
}

export async function deleteMeAction(): Promise<Result> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("delete_me");
  if (error) {
    const code = errorCodeOf(error);
    // 利用停止中だけでなく、運営が確認中の通報があるときも NOT_ACTIVE になる(停止されていない人もいる)
    if (code === "NOT_ACTIVE") return { error: "いまは退会の手続きができません。利用規約のお問い合わせ先までご連絡ください。" };
    return { error: lobbyErrorMessage(code) };
  }
  await supabase.auth.signOut();
  redirect("/");
}
