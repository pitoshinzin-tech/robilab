import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// エイム記録(1800、plan.md D43):自分の行だけ、4 列だけ、ログインした人だけ
const sql = readFileSync(join(process.cwd(), "supabase", "migrations", "20261001001800_aim_history.sql"), "utf8")
  .replace(/--[^\n]*/g, "");

describe("my_aim_history (1800)", () => {
  it("is security definer with a fixed search_path", () => {
    expect(sql).toMatch(/function public\.my_aim_history\(p_from date\)/);
    expect(sql).toMatch(/security definer/);
    expect(sql).toMatch(/set search_path = public/);
  });
  it("returns only the caller's rows, four columns, within 400 days up to today", () => {
    expect(sql).toMatch(/raise exception 'NOT_LOGGED_IN'/);
    expect(sql).toMatch(/s\.user_id = v_uid/);
    expect(sql).toMatch(/returns table \(play_date date, score int, accuracy numeric, time_ms int\)/);
    expect(sql).toMatch(/v_today - 399/);
    expect(sql).toMatch(/s\.play_date <= v_today/);
    expect(sql).toMatch(/limit 400/);
  });
  it("is callable only by authenticated users", () => {
    expect(sql).toMatch(/revoke all on function public\.my_aim_history\(date\) from public, anon;/);
    expect(sql).toMatch(/grant execute on function public\.my_aim_history\(date\) to authenticated;/);
  });
});
