import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { assertKnownIds, DISCONTINUED_MICE, DISCONTINUED_PADS, DISCONTINUED_SKATES, PAD_RENAMES, TARGETS, toMouseSpecs, toPadSpecs, toSkateSpecs } from "../../scripts/gear-data";
import { MICE } from "@/data/mice";
import { PADS } from "@/data/pads";
import { SKATES } from "@/data/skates";

const norm = (s: string) => s.replace(/\r\n/g, "\n");
const json = (p: string) => JSON.parse(readFileSync(p, "utf8"));

describe("生成した src/data の .ts が docs/content/gear の JSON と合っている(作り直し忘れがない)", () => {
  it.each(TARGETS.map((t) => [t.out, t] as const))("%s", (out, t) => {
    expect(norm(readFileSync(out, "utf8"))).toBe(t.render());
  });
});

describe("JSON を直接読んで、大事な数字が生成物に落ちずに入っている", () => {
  it("パッドの sizes(幅・奥行・厚さ)", () => {
    const raw = json("docs/content/gear/pads.json").pads as { id: string; sizes: { label: string; widthMm: number | null; depthMm: number | null; thicknessMm: number | null }[] }[];
    expect(PADS.map((p) => p.id)).toEqual(raw.map((p) => p.id));
    for (const r of raw) {
      const p = PADS.find((x) => x.id === r.id)!;
      expect(p.sizes, r.id).toEqual(r.sizes.map((s) => ({ label: s.label, widthMm: s.widthMm, depthMm: s.depthMm, thicknessMm: s.thicknessMm })));
    }
  });
  it("ソールの厚さと入数", () => {
    const raw = json("docs/content/gear/skates.json").items as { id: string; thicknessMm: number | null; piecesPerPack: number | null; setsPerPack: number | null }[];
    expect(SKATES.map((s) => s.id)).toEqual(raw.map((s) => s.id));
    for (const r of raw) {
      const s = SKATES.find((x) => x.id === r.id)!;
      expect([s.thicknessMm, s.piecesPerPack, s.setsPerPack], r.id).toEqual([r.thicknessMm, r.piecesPerPack, r.setsPerPack]);
    }
  });
  it("マウスの長さ・幅・高さ・重さ", () => {
    const raw = json("docs/content/gear/mice.json") as { id: string; lengthMm: number | null; widthMm: number | null; heightMm: number | null; weightG: number | null }[];
    expect(MICE.map((m) => m.id)).toEqual(raw.map((m) => m.id));
    for (const r of raw) {
      const m = MICE.find((x) => x.id === r.id)!;
      expect([m.lengthMm, m.widthMm, m.heightMm, m.weightG], r.id).toEqual([r.lengthMm, r.widthMm, r.heightMm, r.weightG]);
    }
  });
});

describe("名前の直し・生産終了の表に、データにない id があれば止まる", () => {
  const pads = json("docs/content/gear/pads.json");
  const skates = json("docs/content/gear/skates.json");
  const mice = json("docs/content/gear/mice.json");
  const without = <T extends { id: string }>(list: T[], id: string): T[] => list.filter((x) => x.id !== id);

  it("本物のデータでは通る", () => {
    expect(() => toPadSpecs(pads)).not.toThrow();
    expect(() => toSkateSpecs(skates)).not.toThrow();
    expect(() => toMouseSpecs(mice)).not.toThrow();
  });
  it("名前の直しの id がデータにないと throw する", () => {
    const id = Object.keys(PAD_RENAMES)[0];
    expect(() => toPadSpecs({ pads: without(pads.pads, id) })).toThrow(id);
  });
  it("生産終了の id がデータにないと throw する", () => {
    expect(() => toPadSpecs({ pads: without(pads.pads, DISCONTINUED_PADS[0]) })).toThrow(DISCONTINUED_PADS[0]);
  });
  it("マウス・ソールの生産終了の表も同じ確かめを通る(今は空)", () => {
    expect(DISCONTINUED_SKATES).toEqual([]);
    expect(DISCONTINUED_MICE).toEqual([]);
    expect(() => assertKnownIds(["no-such-mouse"], mice.map((m: { id: string }) => m.id), "DISCONTINUED_MICE")).toThrow("no-such-mouse");
    expect(() => assertKnownIds([mice[0].id], mice.map((m: { id: string }) => m.id), "DISCONTINUED_MICE")).not.toThrow();
  });
});
