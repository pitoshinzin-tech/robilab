import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.TEST_SUPABASE_URL!;
const anon = process.env.TEST_SUPABASE_ANON_KEY!;
export const admin = createClient(url, process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export type TestUser = { id: string; client: SupabaseClient };
const created: string[] = [];

/** 日本時間の今日から years 年前の日付(誕生日の当日を作る) */
export function birthdateYearsAgo(years: number, dayOffset = 0): string {
  const jst = new Date(Date.now() + 9 * 3600 * 1000);
  const d = new Date(Date.UTC(jst.getUTCFullYear() - years, jst.getUTCMonth(), jst.getUTCDate() + dayOffset));
  return d.toISOString().slice(0, 10);
}

export async function makeUser(opts: { birthdate?: string; register?: boolean; nickname?: string } = {}): Promise<TestUser> {
  const email = `rls-${crypto.randomUUID()}@example.test`;
  const password = `pw-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const id = data.user.id;
  created.push(id);
  if (opts.register !== false) {
    const { error: e } = await admin.rpc("_register_profile", {
      p_uid: id, p_discord_id: `d-${id}`, p_discord_name: `name-${id.slice(0, 6)}`,
      p_birthdate: opts.birthdate ?? birthdateYearsAgo(25), p_nickname: opts.nickname ?? "テスト",
      p_type_code: "ARCH", p_axes: { attack: 0.3, instinct: 0.3, team: 0.3, heat: 0.3 },
      p_games: [{ id: "valorant" }], p_platforms: ["pc"], p_voice_ok: true, p_time_slots: ["weekday-night"], p_bio: "",
    });
    if (e) throw new Error(e.message);
  }
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id, client };
}

export async function cleanup() {
  for (const id of created.splice(0)) await admin.auth.admin.deleteUser(id);
}

export function errorCode(error: { message?: string } | null): string | undefined {
  return error?.message?.match(/[A-Z_]{4,}/)?.[0];
}
