export type AffiliateItem = {
  id: string;
  name: string;
  genre: "device" | "food" | "selfcare" | "gadget";
  url: string;
  store: "amazon" | "rakuten";
  /** 本人の実体験の一言。作り話を書かない */
  comment: string;
  forTypes: string[] | "all";
};

export const AFFILIATES: AffiliateItem[] = [
  // 本人が商品を決めたら、ここに追加する(例の形)
  // { id: "mousepad-x", name: "商品名", genre: "device", url: "https://...", store: "amazon",
  //   comment: "本人の一言", forTypes: ["ARCH", "ARLH"] },
];

export function affiliatesFor(code: string, limit = 3): AffiliateItem[] {
  const specific = AFFILIATES.filter((a) => a.forTypes !== "all" && a.forTypes.includes(code));
  const general = AFFILIATES.filter((a) => a.forTypes === "all");
  return [...specific, ...general].slice(0, limit);
}
