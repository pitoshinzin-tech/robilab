import { describe, it, expect } from "vitest";
import { toMouseRows, type MouseSource } from "@/lib/mouse-rows";

const src = (id: string, lengthMm: number | null, widthMm: number | null, extra: Partial<MouseSource> = {}): MouseSource => ({
  id, lengthMm, widthMm, heightMm: 40, weightG: 60, shape: "symmetric", connection: "wireless", officialUrl: `https://example.com/${id}`, ...extra,
});
const NAMES: Record<string, { brand: string; name: string }> = {
  a: { brand: "B", name: "Alpha" }, b: { brand: "B", name: "Beta" }, c: { brand: "C", name: "Gamma" }, d: { brand: "D", name: "Delta" },
};
const names = (id: string) => NAMES[id];

describe("toMouseRows", () => {
  it("長さと幅がそろうものは比べる行に、ないものは「比べられません」に(足りない項目つき)", () => {
    const { comparable, other } = toMouseRows([src("a", 120, 60), src("b", null, 60), src("c", 120, null), src("d", null, null)], names, {}, {}, {});
    expect(comparable.map((r) => r.id)).toEqual(["a"]);
    expect(other.map((r) => [r.id, r.missing])).toEqual([["b", ["長さ"]], ["c", ["幅"]], ["d", ["長さ", "幅"]]]);
  });
  it("devices.ts に名前がないものは出さない", () => {
    expect(toMouseRows([src("zzz", 120, 60)], names, {}, {}, {}).comparable).toEqual([]);
  });
  it("ブラウザへ送るのは表示に要る分だけ(出典の文・メモ・公式 URL の生の値を持たない)", () => {
    const [row] = toMouseRows([src("a", 120, 60, { selectionBasis: "Amazon 1位" })], names, {}, {}, {}).comparable;
    expect(Object.keys(row).sort()).toEqual(["brand", "connection", "heightMm", "id", "imageUrl", "lengthMm", "links", "name", "shape", "skateCount", "weightG", "widthMm"]);
  });
  it("店のリンクは「メーカー 名前」で探し、公式は出典の URL", () => {
    const [row] = toMouseRows([src("a", 120, 60)], names, {}, {}, {}).comparable;
    expect(new URL(row.links.amazon).searchParams.get("k")).toBe("B Alpha");
    expect(row.links.official).toBe("https://example.com/a");
    expect(row.links.amazonPr).toBe(false);
  });
  it("楽天の商品ページ(https の item.rakuten.co.jp)があるときだけ画像を使い、ソールの数を入れる", () => {
    const rakuten = {
      a: { itemUrl: "https://item.rakuten.co.jp/shop/a/", imageUrl: "https://thumbnail.image.rakuten.co.jp/a.jpg" },
      b: { itemUrl: "http://evil.example/b", imageUrl: "https://thumbnail.image.rakuten.co.jp/b.jpg" },
    };
    const { comparable } = toMouseRows([src("a", 120, 60), src("b", 120, 60)], names, rakuten, { a: 3 }, {});
    expect(comparable[0].imageUrl).toBe("https://thumbnail.image.rakuten.co.jp/a.jpg");
    expect(comparable[0].links.rakutenIsItem).toBe(true);
    expect(comparable[0].skateCount).toBe(3);
    expect(comparable[1].imageUrl).toBeNull();
    expect(comparable[1].links.rakutenIsItem).toBe(false);
    expect(comparable[1].skateCount).toBe(0);
  });
  it("比べる行はデータの順のまま、比べられない行は人気の順(順位のないものは後ろ)", () => {
    const { comparable, other } = toMouseRows(
      [src("c", 120, 60), src("a", 121, 60), src("b", null, null, { selectionBasis: "" }), src("d", null, null, { selectionBasis: "価格.com 2位" })],
      names, {}, {}, {},
    );
    expect(comparable.map((r) => r.id)).toEqual(["c", "a"]);
    expect(other.map((r) => r.id)).toEqual(["d", "b"]);
  });
});
