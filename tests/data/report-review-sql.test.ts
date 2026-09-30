import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// 通報で相手を自動で利用停止にするのは age_fake(年齢詐称)のときだけ(1700、plan.md D42)。
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

/** SQL のコメント(-- から行末まで)を除く */
const stripComments = (sql: string) => sql.replace(/--[^\n]*/g, "");

describe("report_user (1700)", () => {
  const { file, def } = latestDefinition("report_user");
  const body = stripComments(def);

  it("the latest definition is in 20261001001700_report_review.sql", () => {
    expect(file).toBe("20261001001700_report_review.sql");
  });

  it("suspends the target only when the reason is age_fake", () => {
    const suspends = [...body.matchAll(/update public\.profiles set status = 'suspended'/g)];
    expect(suspends).toHaveLength(1);
    const guarded = body.match(
      /if p_reason = 'age_fake'\s+and not exists[\s\S]*?then\s+update public\.profiles set status = 'suspended' where id = p_id and status = 'active';\s+end if;/,
    );
    expect(guarded).not.toBeNull();
  });

  it("does not suspend when the target has blocked or has an open report against the reporter (retaliation)", () => {
    const cond = body.slice(body.indexOf("if p_reason = 'age_fake'"), body.indexOf("update public.profiles set status = 'suspended'"));
    // 相手(p_id)が通報した人(auth.uid())をブロックしている
    expect(cond).toMatch(/not exists \(select 1 from public\.blocks where blocker_id = p_id and blocked_id = auth\.uid\(\)\)/);
    // 相手が通報した人を通報していて open(退会・再登録をはさんでも Discord ID で見る)
    expect(cond).toMatch(/not exists \(\s*select 1 from public\.reports\s+where status = 'open'/);
    expect(cond).toContain("(reporter_id = p_id or reporter_discord_id = v_target_discord_id)");
    expect(cond).toContain("(target_id = auth.uid() or target_discord_id = v_me_discord_id)");
  });

  it("still records the report before deciding on suspension", () => {
    expect(body.indexOf("insert into public.reports")).toBeGreaterThan(0);
    expect(body.indexOf("insert into public.reports")).toBeLessThan(body.indexOf("if p_reason = 'age_fake'"));
  });

  it("still blocks the target for every reason (outside the age_fake branch)", () => {
    const afterIf = body.slice(body.indexOf("end if;", body.indexOf("if p_reason = 'age_fake'")));
    expect(afterIf).toContain("perform public.block_user(p_id);");
  });

  it("keeps execute for authenticated only", () => {
    const sql = files.find((f) => f.name === "20261001001700_report_review.sql")!.sql;
    expect(sql).toContain("revoke all on function public.report_user from public, anon;");
    expect(sql).toContain("grant execute on function public.report_user to authenticated;");
  });

  it("delete_me still refuses while an open report exists", () => {
    const del = stripComments(latestDefinition("delete_me").def);
    expect(del).toMatch(/exists \(select 1 from public\.reports where target_id = auth\.uid\(\) and status = 'open'\)/);
  });
});
