/** 「私に合うマウス TOP3」の投稿文。手の大きさ(個人の情報)は入れない。 */
export function buildMouseShareText(top: { brand: string; name: string }[]): string {
  const lines = ["私に合うマウス TOP3", ...top.slice(0, 3).map((m, i) => `${i + 1}. ${m.brand} ${m.name}`), "#ロビラボ #マウス探し"];
  return lines.join("\n");
}
