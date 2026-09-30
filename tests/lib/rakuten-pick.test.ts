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
  it("skips 0-review items unless the shop is official, and Amazon-ASIN item codes", () => {
    const shop = (itemName: string, reviewCount: number, itemCode: string, shopName: string): RakutenCandidate => ({ ...c(itemName, reviewCount, itemCode), shopName });
    expect(pickRakutenItem([shop("Razer Viper V3 Pro", 0, "s:a", "転売ショップ")], "Razer", "Viper V3 Pro")).toBeNull();
    expect(pickRakutenItem([shop("Razer Viper V3 Pro", 0, "s:a", "Razer 公式ストア")], "Razer", "Viper V3 Pro")?.itemCode).toBe("s:a");
    expect(pickRakutenItem([shop("Razer Viper V3 Pro", 99, "trend:b0ccgzfr44", "ショップ")], "Razer", "Viper V3 Pro")).toBeNull();
    expect(pickRakutenItem([shop("Razer Viper V3 Pro", 99, "trend:B0CCGZFR44", "ショップ"), shop("Razer Viper V3 Pro", 3, "ok:viper", "ショップ")], "Razer", "Viper V3 Pro")?.itemCode).toBe("ok:viper");
  });
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

describe("pickRakutenItem: 別の型・中古・セットを除く", () => {
  const c = (itemName: string, reviewCount = 10) => ({ itemCode: itemName, itemName, itemUrl: "https://item.rakuten.co.jp/a/b/", shopName: "s", reviewCount });
  it("製品名にない型の語(HyperSpeed・AIR・Core・V2・eS)がある商品は選ばない", () => {
    expect(pickRakutenItem([c("Razer DeathAdder V3 HyperSpeed ワイヤレス")], "Razer", "DeathAdder V3")).toBeNull();
    expect(pickRakutenItem([c("CORSAIR M75 AIR WIRELESS")], "CORSAIR", "M75 WIRELESS")).toBeNull();
    expect(pickRakutenItem([c("HyperX Pulsefire Haste 2 Core")], "HyperX", "Pulsefire Haste 2")).toBeNull();
    expect(pickRakutenItem([c("ENDGAME GEAR OP1 8K V2")], "Endgame Gear", "OP1 8k")).toBeNull();
    expect(pickRakutenItem([c("Pulsar Xlite V3 eS Medium")], "Pulsar", "Xlite v3 Medium")).toBeNull();
    expect(pickRakutenItem([c("Pulsar X2 v2 Medium ワイヤレス")], "Pulsar", "X2 v2 Medium")?.itemName).toBe("Pulsar X2 v2 Medium ワイヤレス");
  });
  it("中古に近い品(極美品など)とセット品は選ばない", () => {
    expect(pickRakutenItem([c("【極美品】Logicool G PRO X SUPERLIGHT")], "Logicool G", "PRO X SUPERLIGHT")).toBeNull();
    expect(pickRakutenItem([c("Razer Cobra &amp; Viper Mini")], "Razer", "Viper Mini")).toBeNull();
  });
});

describe("pickRakutenItem: 製品名はひと続きで、すぐ後に別の型の語が続かない", () => {
  const c = (itemName: string) => ({ itemCode: itemName, itemName, itemUrl: "https://item.rakuten.co.jp/a/b/", shopName: "s", reviewCount: 1 });
  it("数字が離れた場所(2年保証など)にあるだけでは当たらない", () => {
    expect(pickRakutenItem([c("HyperX Pulsefire Hasteゲーマー向け 2年保証")], "HyperX", "Pulsefire Haste 2")).toBeNull();
    expect(pickRakutenItem([c("HyperX Pulsefire Haste 2 ワイヤレス")], "HyperX", "Pulsefire Haste 2")).not.toBeNull();
  });
  it("すぐ後に 2C・Gen などが続く別の型には当たらない", () => {
    expect(pickRakutenItem([c("Logicool G PRO X SUPERLIGHT 2C ワイヤレス")], "Logicool G", "PRO X SUPERLIGHT")).toBeNull();
    expect(pickRakutenItem([c("SteelSeries Aerox 3 Wireless Gen 2")], "SteelSeries", "Aerox 3 Wireless")).toBeNull();
    expect(pickRakutenItem([c("Logicool G ゲーミングマウス 有線 G502 HEROセンサー")], "Logicool G", "G502 HERO")).not.toBeNull();
  });
});
