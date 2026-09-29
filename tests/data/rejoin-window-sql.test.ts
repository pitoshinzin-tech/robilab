import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// 退会後の再登録待ち(_register_profile の left_discord_ids)は、パスを相手に伏せる期間
// (send_approach の ALREADY_PENDING 判定)より短くしてはいけない。
// 短いと、退会 → 再登録でパスの記録を消して、同じ相手にまた声をかけられてしまう。
const dir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(join(dir, f), "utf8"));

function latestDefinition(name: string): string {
  const def = files
    .map((sql) => {
      const start = sql.indexOf(`function public.${name}(`);
      if (start < 0) return null;
      const end = sql.indexOf("end $$;", start);
      return sql.slice(start, end);
    })
    .filter((x): x is string => x !== null)
    .at(-1);
  if (!def) throw new Error(`${name} not found`);
  return def;
}

function days(def: string, pattern: RegExp): number {
  const m = def.match(pattern);
  if (!m) throw new Error(`interval not found: ${pattern}`);
  return Number(m[1]);
}

describe("rejoin cooldown vs pass-masking window", () => {
  it("the rejoin cooldown is at least as long as the pass-masking window", () => {
    const cooldown = days(latestDefinition("_register_profile"), /left_at > now\(\) - interval '(\d+) days'/);
    const passMask = days(latestDefinition("send_approach"), /status = 'passed' and created_at >= now\(\) - interval '(\d+) days'/);
    expect(cooldown).toBeGreaterThanOrEqual(passMask);
  });
});
