import type { Option } from "@/lib/item-ref";

/** 好きなゲームの候補(名前だけ)。診断の対象5本(src/data/games.ts)の id は同じにする。 */
export const POPULAR_GAMES: { id: string; name: string }[] = [
  { id: "valorant", name: "VALORANT" },
  { id: "apex", name: "Apex Legends" },
  { id: "overwatch", name: "オーバーウォッチ" },
  { id: "sf6", name: "ストリートファイター6" },
  { id: "dbd", name: "Dead by Daylight" },
  { id: "fortnite", name: "フォートナイト" },
  { id: "cs2", name: "Counter-Strike 2" },
  { id: "cod", name: "Call of Duty" },
  { id: "r6", name: "レインボーシックス シージ" },
  { id: "pubg", name: "PUBG: BATTLEGROUNDS" },
  { id: "the-finals", name: "THE FINALS" },
  { id: "marvel-rivals", name: "Marvel Rivals" },
  { id: "tarkov", name: "Escape from Tarkov" },
  { id: "delta-force", name: "Delta Force" },
  { id: "knives-out", name: "荒野行動" },
  { id: "lol", name: "リーグ・オブ・レジェンド" },
  { id: "tft", name: "チームファイト タクティクス" },
  { id: "dota2", name: "Dota 2" },
  { id: "tekken8", name: "鉄拳8" },
  { id: "smash-sp", name: "大乱闘スマッシュブラザーズ SPECIAL" },
  { id: "splatoon3", name: "スプラトゥーン3" },
  { id: "mario-kart-world", name: "マリオカート ワールド" },
  { id: "minecraft", name: "Minecraft" },
  { id: "monster-hunter-wilds", name: "モンスターハンターワイルズ" },
  { id: "elden-ring-nightreign", name: "ELDEN RING NIGHTREIGN" },
  { id: "genshin", name: "原神" },
  { id: "honkai-star-rail", name: "崩壊:スターレイル" },
  { id: "zenless-zone-zero", name: "ゼンレスゾーンゼロ" },
  { id: "pokemon-unite", name: "ポケモンユナイト" },
  { id: "rocket-league", name: "Rocket League" },
  { id: "fall-guys", name: "Fall Guys" },
  { id: "among-us", name: "Among Us" },
  { id: "lethal-company", name: "Lethal Company" },
  { id: "palworld", name: "パルワールド" },
  { id: "rust", name: "Rust" },
  { id: "gta5", name: "グランド・セフト・オートV" },
  { id: "ff14", name: "ファイナルファンタジーXIV" },
  { id: "dq10", name: "ドラゴンクエストX" },
  { id: "umamusume", name: "ウマ娘 プリティーダービー" },
  { id: "monster-strike", name: "モンスターストライク" },
];

export function gameOptions(): Option[] {
  return POPULAR_GAMES.map((g) => ({ id: g.id, label: g.name }));
}
