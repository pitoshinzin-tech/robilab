import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ロビーのニックネーム・自己紹介で弾く文字(_validate_profile_input の v_bad_chars)。
// SQL の chr() の組み立てを JS の正規表現に直して、U+202E などを本当に含むか確かめる。
const dir = join(process.cwd(), "supabase", "migrations");
const names = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const files = names.map((f) => ({ name: f, sql: readFileSync(join(dir, f), "utf8") }));

function latestDefinition(name: string): { file: string; def: string } {
  const found = files
    .map(({ name: file, sql }) => {
      const start = sql.indexOf(`function public.${name}(`);
      if (start < 0) return null;
      const end = sql.indexOf("end $$;", start);
      return { file, def: sql.slice(start, end) };
    })
    .filter((x): x is { file: string; def: string } => x !== null)
    .at(-1);
  if (!found) throw new Error(`${name} not found`);
  return found;
}

/** `v_xxx text := '[' || chr(1) || '-' || ... || ']';` を JS の正規表現に直す */
function chrRegex(def: string, name: string): RegExp {
  const m = def.match(new RegExp(`${name} text :=([\\s\\S]*?);`));
  if (!m) throw new Error(`${name} not found`);
  const expr = m[1].replace(/--[^\n]*/g, "");
  const parts = expr.split("||").map((s) => s.trim()).filter(Boolean);
  let cls = "";
  for (const p of parts) {
    const chr = p.match(/^chr\((\d+)\)$/);
    const lit = p.match(/^'([^']*)'$/);
    if (chr) cls += `\\u{${Number(chr[1]).toString(16)}}`;
    else if (lit) cls += lit[1];
    else throw new Error(`unexpected part: ${p}`);
  }
  return new RegExp(cls, "u");
}

describe("_validate_profile_input rejects control and bidi/format characters", () => {
  const { file, def } = latestDefinition("_validate_profile_input");
  const re = chrRegex(def, "v_bad_chars");
  const blank = chrRegex(def, "v_blank_only");

  it("the latest definition is in 1600 and still defines the function", () => {
    expect(file).toBe("20261001001600_profile_text_hardening.sql");
    expect(def).toContain("function public._validate_profile_input(");
    expect(def).toMatch(/p_nickname ~ v_bad_chars or coalesce\(p_bio, ''\) ~ v_bad_chars then raise exception 'INVALID_INPUT'/);
    expect(def).toContain("_has_ng_word(");
  });

  it("covers U+202E and the other listed ranges", () => {
    const codes = [
      0x01, 0x09, 0x0a, 0x1f, 0x7f, 0x85, 0x9f,
      0x200b, 0x200c, 0x200e, 0x200f, 0x202a, 0x202d, 0x202e, 0x2060, 0x2066, 0x2069, 0xfeff,
      // run-10 で足した見えない文字・区切り文字
      0xad, 0x61c, 0x115f, 0x1160, 0x180e, 0x2028, 0x2029, 0x3164, 0xffa0,
    ];
    for (const c of codes) expect(re.test(String.fromCodePoint(c)), c.toString(16)).toBe(true);
  });

  it("does not reject U+200D (ZWJ) so ordinary emoji sequences are allowed", () => {
    expect(re.test(String.fromCodePoint(0x200d))).toBe(false);
    const family = [0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467].map((c) => String.fromCodePoint(c)).join("");
    expect(re.test(`${family}ゲーム好き`)).toBe(false);
  });

  it("treats a nickname made only of spaces (including U+3000) as empty", () => {
    expect(def).toMatch(/p_nickname is null or p_nickname ~ v_blank_only or char_length\(p_nickname\) > 20/);
    for (const s of ["", " ", "\u3000", "\u3000 \u3000", "\u00a0", "\u2003\u202f\u205f"]) expect(blank.test(s), JSON.stringify(s)).toBe(true);
    for (const s of ["a", "\u3000あ\u3000", " x "]) expect(blank.test(s), JSON.stringify(s)).toBe(false);
  });

  it("allows ordinary Japanese and ASCII text", () => {
    for (const s of ["テスト", "オンラインで遊ぼう", "Valorant 好き!", "ｄｅｖ", "a-z_0"]) expect(re.test(s), s).toBe(false);
  });

  it("the file keeps the revoke and the one-time ban status sync", () => {
    const sql = files.find((f) => f.name === "20261001001600_profile_text_hardening.sql")!.sql;
    expect(sql).toContain("revoke all on function public._validate_profile_input from public, anon, authenticated;");
    expect(sql).toMatch(/update public\.profiles p\s+set status = 'banned'\s+where p\.status <> 'banned'/);
    expect(sql).toContain("join public.banned_discord_ids b on b.discord_user_id = pi.discord_user_id");
    // chr(0) は Postgres でエラーになるので使わない
    expect(sql.replace(/--[^\n]*/g, "")).not.toContain("chr(0)");
  });
});
