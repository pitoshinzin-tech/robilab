import { describe, it, expect } from "vitest";
import { cleanItemUrl, imageUrl300, pickRakutenItem, toRakutenItem, type RakutenCandidate } from "@/lib/rakuten-pick";

const c = (itemName: string, reviewCount: number, itemCode = itemName): RakutenCandidate => ({
  itemCode,
  itemName,
  itemUrl: "https://item.rakuten.co.jp/shop/item/?variantId=1",
  shopName: "ショップ",
  reviewCount,
  mediumImageUrls: [{ imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/shop/cabinet/a.jpg?_ex=128x128" }],
});

describe("pickRakutenItem", () => {
  it("picks the most reviewed matching item", () => {
    const got = pickRakutenItem([c("Razer Viper V3 Pro 白", 10, "a"), c("【国内正規品】Razer Viper V3 Pro ゲーミングマウス", 50, "b"), c("Razer Viper V3 Pro", 20, "c")], "Razer", "Viper V3 Pro");
    expect(got?.itemCode).toBe("b");
  });
  it("excludes accessories and used items", () => {
    const got = pickRakutenItem([
      c("Razer Viper V3 Pro 用 グリップテープ", 900, "tape"),
      c("Razer Viper V3 Pro 交換ソール", 800, "sole"),
      c("【中古】Razer Viper V3 Pro", 700, "used"),
      c("Razer Viper V3 Pro", 5, "ok"),
    ], "Razer", "Viper V3 Pro");
    expect(got?.itemCode).toBe("ok");
  });
  it("requires the brand (Logicool G matches Logicool or ロジクール, case-insensitive)", () => {
    expect(pickRakutenItem([c("ロジクール G304 ワイヤレス", 3, "jp")], "Logicool G", "G304")?.itemCode).toBe("jp");
    expect(pickRakutenItem([c("LOGICOOL G304", 3, "en")], "Logicool G", "G304")?.itemCode).toBe("en");
    expect(pickRakutenItem([c("G304 ワイヤレスマウス", 3)], "Logicool G", "G304")).toBeNull();
  });
  it("requires every model word as a whole word", () => {
    expect(pickRakutenItem([c("Logicool G3050", 9)], "Logicool G", "G305")).toBeNull();
    expect(pickRakutenItem([c("Razer DeathAdder V2", 9)], "Razer", "DeathAdder V3")).toBeNull();
    expect(pickRakutenItem([c("ＲＡＺＥＲ ｄｅａｔｈａｄｄｅｒ ｖ３", 9, "zen")], "Razer", "DeathAdder V3")?.itemCode).toBe("zen");
  });
  it("skips items for a longer-named sibling model", () => {
    const items = [c("Logicool G PRO X SUPERLIGHT 2 ワイヤレス", 100, "sl2"), c("Logicool G PRO X SUPERLIGHT ワイヤレス", 30, "sl1")];
    expect(pickRakutenItem(items, "Logicool G", "PRO X SUPERLIGHT", ["PRO X SUPERLIGHT 2", "G305"])?.itemCode).toBe("sl1");
    expect(pickRakutenItem(items, "Logicool G", "PRO X SUPERLIGHT 2", ["PRO X SUPERLIGHT"])?.itemCode).toBe("sl2");
  });
  it("returns null when nothing matches", () => {
    expect(pickRakutenItem([], "Razer", "Viper Mini")).toBeNull();
    expect(pickRakutenItem([c("SteelSeries Aerox 3", 5)], "Razer", "Viper Mini")).toBeNull();
  });
});

describe("rakuten URLs", () => {
  it("cleans item URLs and keeps only https Rakuten item pages", () => {
    expect(cleanItemUrl("https://item.rakuten.co.jp/shop/item/?variantId=1&x=2")).toBe("https://item.rakuten.co.jp/shop/item/");
    expect(cleanItemUrl("http://item.rakuten.co.jp/shop/item/")).toBeNull();
    expect(cleanItemUrl("https://example.com/shop/item/")).toBeNull();
  });
  it("switches images to 300x300", () => {
    expect(imageUrl300("https://thumbnail.image.rakuten.co.jp/@0_mall/shop/cabinet/a.jpg?_ex=128x128")).toBe("https://thumbnail.image.rakuten.co.jp/@0_mall/shop/cabinet/a.jpg?_ex=300x300");
    expect(imageUrl300("https://example.com/a.jpg")).toBeNull();
  });
  it("builds a stored item", () => {
    expect(toRakutenItem(c("Razer Viper Mini", 1, "code"), "2026-09-30")).toEqual({
      itemCode: "code",
      itemName: "Razer Viper Mini",
      shopName: "ショップ",
      itemUrl: "https://item.rakuten.co.jp/shop/item/",
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/shop/cabinet/a.jpg?_ex=300x300",
      checkedAt: "2026-09-30",
    });
    expect(toRakutenItem({ ...c("x", 1), mediumImageUrls: [] }, "2026-09-30")).toBeNull();
  });
});
