import { describe, it, expect } from "vitest";
import { PADS } from "@/data/pads";
import { SKATES } from "@/data/skates";
import { DEVICES } from "@/data/devices";

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
const onHost = (url: string, hosts: readonly string[]) => {
  const u = new URL(url);
  return u.protocol === "https:" && hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
};
const PAD_HOSTS = ["artisan-jp.com", "logicool.co.jp", "razer.com", "benq.com", "steelseries.com", "pulsar.gg", "x-raypad.com", "aim1.jp", "endgamegear.com", "corsair.com", "wallhack.com"];
const SKATE_HOSTS = ["esptiger.com", "corepad.de", "x-raypad.com", "pulsar.gg", "wallhack.com", "artisan-jp.com"];
const HIDDEN = ["dotandz-glimpse-beta", "elecom-gaming-pad-balance", "fnatic-jet", "hyperx-pulsefire-mat", "skypad-glass-3", "talongames-maya", "vaxee-pa"];

describe("マウスパッドのデータ", () => {
  it("48 件で id が重ならない", () => {
    expect(PADS).toHaveLength(48);
    expect(new Set(PADS.map((p) => p.id)).size).toBe(PADS.length);
  });
  it("公式の数字が 1 つもない 7 件だけ hidden(画面に出さない)", () => {
    expect(PADS.filter((p) => p.hidden).map((p) => p.id).sort()).toEqual([...HIDDEN].sort());
  });
  it("画面に出すものは https のメーカーのページと確認日を持つ", () => {
    for (const p of PADS) {
      expect(isDate(p.checkedAt), p.id).toBe(true);
      if (p.hidden) continue;
      expect(p.officialUrl, p.id).not.toBeNull();
      expect(onHost(p.officialUrl!, PAD_HOSTS), `${p.id}: ${p.officialUrl}`).toBe(true);
    }
  });
  it("生産終了は公式に書いてある 3 件", () => {
    expect(PADS.filter((p) => p.discontinued).map((p) => p.id).sort()).toEqual(["artisan-shidenkai", "zowie-g-sr", "zowie-g-tr"]);
  });
  it("大きさ・厚さは正の数か null(作った数字を入れない)", () => {
    for (const p of PADS) {
      for (const s of p.sizes) {
        for (const v of [s.widthMm, s.depthMm]) if (v !== null) expect(v, `${p.id} ${s.label}`).toBeGreaterThanOrEqual(200);
        for (const v of [s.widthMm, s.depthMm]) if (v !== null) expect(v, `${p.id} ${s.label}`).toBeLessThanOrEqual(1700);
        if (s.thicknessMm !== null) expect(s.thicknessMm, `${p.id} ${s.label}`).toBeGreaterThan(0);
        if (s.thicknessMm !== null) expect(s.thicknessMm, `${p.id} ${s.label}`).toBeLessThanOrEqual(10);
      }
    }
  });
  it("名前の直し:LGG は Pulsar、SkyPAD は Wallhack、Razer は名前にブランドを重ねない(id は残す)", () => {
    const byId = (id: string) => PADS.find((p) => p.id === id)!;
    expect([byId("lgg-saturn-pro").brand, byId("lgg-saturn-pro").name]).toEqual(["Pulsar", "eS Saturn Pro"]);
    expect([byId("lgg-jupiter").brand, byId("lgg-jupiter").name]).toEqual(["Pulsar", "eS Jupiter Pro"]);
    expect(byId("skypad-glass-3").brand).toBe("Wallhack");
    for (const p of PADS.filter((x) => x.brand === "Razer")) expect(p.name.startsWith("Razer "), p.id).toBe(false);
  });
  it("画面に出すパッドは devices.ts に同じ名前で入っている(マイ設定でも選べる)", () => {
    for (const p of PADS.filter((x) => !x.hidden)) {
      const d = DEVICES.find((x) => x.id === p.id);
      expect(d?.category, p.id).toBe("pad");
      expect(`${d?.brand} ${d?.name}`, p.id).toBe(`${p.brand} ${p.name}`);
    }
  });
});

describe("マウスソールのデータ", () => {
  it("58 件で id が重ならない", () => {
    expect(SKATES).toHaveLength(58);
    expect(new Set(SKATES.map((s) => s.id)).size).toBe(SKATES.length);
  });
  it("https のメーカーのページと確認日を持つ", () => {
    for (const s of SKATES) {
      expect(onHost(s.officialUrl, SKATE_HOSTS), `${s.id}: ${s.officialUrl}`).toBe(true);
      expect(isDate(s.checkedAt), s.id).toBe(true);
    }
  });
  it("合うマウスの id はすべて devices.ts のマウス", () => {
    for (const s of SKATES) {
      for (const id of s.mouseIds) expect(DEVICES.find((d) => d.id === id)?.category, `${s.id} → ${id}`).toBe("mouse");
    }
  });
  it("汎用のドットはマウスに結び付けない", () => {
    for (const s of SKATES.filter((x) => x.shape === "dot")) expect(s.mouseIds, s.id).toEqual([]);
  });
  it("厚さ・入数は正の数か null", () => {
    for (const s of SKATES) {
      if (s.thicknessMm !== null) expect(s.thicknessMm, s.id).toBeGreaterThan(0);
      if (s.thicknessMm !== null) expect(s.thicknessMm, s.id).toBeLessThan(3);
      for (const n of [s.piecesPerPack, s.setsPerPack]) if (n !== null) expect(Number.isInteger(n) && n > 0, s.id).toBe(true);
    }
  });
  it("生産終了は 0 件(公式に記載がない)", () => {
    expect(SKATES.filter((s) => s.discontinued)).toEqual([]);
  });
});
