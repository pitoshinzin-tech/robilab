import { describe, it, expect } from "vitest";
import { sortAndFilter } from "@/lib/lobby-sort";
import type { Candidate } from "@/lib/lobby-types";

const base: Omit<Candidate, "id" | "axes" | "created_at"> = {
  nickname: "x", type_code: "ARCH", games: [{ id: "valorant" }], platforms: ["pc"], voice_ok: true, time_slots: ["weekday-night"], bio: "",
};
const c = (id: string, axes: Candidate["axes"], created_at = "2026-10-01T00:00:00Z", extra: Partial<Candidate> = {}): Candidate => ({ ...base, id, axes, created_at, ...extra });
const me = { axes: { attack: 1, instinct: 0.5, team: 1, heat: 0.3 } };

describe("sortAndFilter", () => {
  it("sorts by compatibility, people without a diagnosis last (newest first)", () => {
    const list = [
      c("nodiag-old", null, "2026-09-01T00:00:00Z"),
      c("low", { attack: 1, instinct: 0.5, team: 1, heat: -1 }),
      c("nodiag-new", null, "2026-10-02T00:00:00Z"),
      c("perfect", { attack: -1, instinct: -0.5, team: -1, heat: 0.3 }),
    ];
    expect(sortAndFilter(me, list, {}).map((r) => r.candidate.id)).toEqual(["perfect", "low", "nodiag-new", "nodiag-old"]);
  });
  it("gives no score when I have no diagnosis", () => {
    const r = sortAndFilter({ axes: null }, [c("a", { attack: 0, instinct: 0, team: 0, heat: 0 })], {});
    expect(r[0].match).toBeNull();
  });
  it("filters by game, slot and voice", () => {
    const list = [c("a", null), c("b", null, undefined, { games: [{ id: "apex" }], voice_ok: false, time_slots: ["holiday-night"] })];
    expect(sortAndFilter(me, list, { game: "apex" }).map((r) => r.candidate.id)).toEqual(["b"]);
    expect(sortAndFilter(me, list, { slot: "weekday-night" }).map((r) => r.candidate.id)).toEqual(["a"]);
    expect(sortAndFilter(me, list, { voice: true }).map((r) => r.candidate.id)).toEqual(["a"]);
  });
  it("does not crash when a candidate's axes object is missing keys", () => {
    const malformed = { attack: 1 } as unknown as Candidate["axes"];
    const r = sortAndFilter(me, [c("bad", malformed)], {});
    expect(r[0].match).toBeNull();
  });
});
