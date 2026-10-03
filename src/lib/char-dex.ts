import type { Axes } from "@/data/axes";
import { CHARS, type Char } from "@/data/chars";
import { CHAR_GAME_SETTINGS, type CharGameSetting } from "@/data/char-games";
import type { CharGameId } from "@/data/char-types";
import { GAMES, type Game } from "@/data/games";
import { pickForGame } from "@/lib/char-match";
import { surpriseReason } from "@/lib/char-reason";

/**
 * キャラ図鑑の組み立て(公開のスイッチ・予備を出さない・段分け・結果ページの導線)。
 * キャラのデータを読むので、ページ(src/app)と sitemap だけが使う。部品(src/components)と "use client" からは import しない
 * (型だけはよい。tests/data/gear-boundary.test.ts が確かめる)。
 */
export type DexSettings = Record<CharGameId, CharGameSetting>;

/** URL の [game] から設定を引く。Object.hasOwn で __proto__・constructor などを通さない */
export function settingOf(gameId: string, settings: DexSettings = CHAR_GAME_SETTINGS): CharGameSetting | undefined {
  return Object.hasOwn(settings, gameId) ? settings[gameId as CharGameId] : undefined;
}

export function publishedGames(settings: DexSettings = CHAR_GAME_SETTINGS, games: readonly Game[] = GAMES): Game[] {
  return games.filter((g) => settingOf(g.id, settings)?.published === true);
}

export function publishedGame(gameId: string, settings: DexSettings = CHAR_GAME_SETTINGS, games: readonly Game[] = GAMES): { game: Game; setting: CharGameSetting } | undefined {
  const setting = settingOf(gameId, settings);
  const game = games.find((g) => g.id === gameId);
  return setting?.published && game ? { game, setting } : undefined;
}

/** 図鑑に出すキャラ(予備を除く。データの順) */
export function dexChars(gameId: string, chars: readonly Char[] = CHARS): Char[] {
  return chars.filter((c) => c.game === gameId && !c.reserve);
}

export function findDexChar(
  gameId: string, charId: string, settings: DexSettings = CHAR_GAME_SETTINGS, chars: readonly Char[] = CHARS, games: readonly Game[] = GAMES,
): { game: Game; setting: CharGameSetting; char: Char } | undefined {
  const found = publishedGame(gameId, settings, games);
  const char = found ? dexChars(gameId, chars).find((c) => c.id === charId) : undefined;
  return found && char ? { ...found, char } : undefined;
}

/** 1 体のページの generateStaticParams(公開しているゲームの代表だけ) */
export function dexParams(settings: DexSettings = CHAR_GAME_SETTINGS, chars: readonly Char[] = CHARS): { game: string; char: string }[] {
  return publishedGames(settings).flatMap((g) => dexChars(g.id, chars).map((c) => ({ game: g.id, char: c.id })));
}

export type DexSection = { key: string; title: string; reason: string | null; roleId: string | null; chars: Char[] };

/** 一覧の段。ロールで分けるゲームは、相性に入るキャラだけをロールの段に入れ、ほかは最後の「型を決めていないキャラ」 */
export function dexSections(game: Game, setting: CharGameSetting, chars: readonly Char[] = CHARS): DexSection[] {
  const list = dexChars(game.id, chars);
  if (!setting.groupByRole) return [{ key: "all", title: "キャラ一覧", reason: null, roleId: null, chars: list }];
  const sections: DexSection[] = game.roles
    .map((r) => ({ key: r.id, title: r.name, reason: r.reason, roleId: r.id, chars: list.filter((c) => c.roleId === r.id && c.matchable) }))
    .filter((s) => s.chars.length > 0);
  const rest = list.filter((c) => !c.matchable);
  return rest.length > 0 ? [...sections, { key: "unmatched", title: "型を決めていないキャラ", reason: setting.unmatchableNote, roleId: null, chars: rest }] : sections;
}

/** 同じロールのほかの代表(相性に入るものだけ)。自分が相性に入らなければ空 */
export function sameRoleChars(char: Char, chars: readonly Char[] = CHARS): Char[] {
  if (!char.matchable) return [];
  return dexChars(char.game, chars).filter((c) => c.roleId === char.roleId && c.matchable && c.id !== char.id);
}

/** 一番新しい確認日(YYYY-MM-DD は文字の順で比べられる) */
export function latestCheckedAt(list: readonly Char[]): string {
  return list.reduce((max, c) => (c.checkedAt > max ? c.checkedAt : max), "");
}

export const charHref = (c: { game: string; id: string }) => `/games/${c.game}/chars/${c.id}`;

export type CharLink = { href: string; name: string };
export type ResultCharPick = { fits: CharLink[]; surprise: (CharLink & { reason: string }) | null };

const linkOf = (c: Char): CharLink => ({ href: charHref(c), name: c.nameJa });

/** 結果ページのゲームごとの行に出す分(公開していて、合うキャラを出すゲームだけ)。部品へは表示に要る文字だけを渡す */
export function resultCharPicks(
  user: Axes, settings: DexSettings = CHAR_GAME_SETTINGS, chars: readonly Char[] = CHARS, games: readonly Game[] = GAMES,
): Record<string, ResultCharPick> {
  const out: Record<string, ResultCharPick> = {};
  for (const game of publishedGames(settings, games)) {
    if (!settingOf(game.id, settings)?.matching) continue;
    const pick = pickForGame(user, game, dexChars(game.id, chars));
    if (pick.fits.length === 0) continue;
    const s = pick.surprise;
    out[game.id] = {
      fits: pick.fits.map(linkOf),
      surprise: s ? { ...linkOf(s.char), reason: surpriseReason(user, s.char, s.role, s.tag) } : null,
    };
  }
  return out;
}

export type CharSource = { url: string; label: string };

/** ページの下の出典(公式ページ+引用を出すゲームは引用の出典)。同じ URL は 1 つ */
export function charSources(char: Char, setting: CharGameSetting): CharSource[] {
  const list: CharSource[] = [{ url: char.sourceUrl, label: "公式のキャラページ" }];
  if (setting.showQuotes) {
    list.push({ url: char.quote.url, label: "公式の言葉の出典" });
    for (const e of char.evidence) list.push({ url: e.url, label: "傾向の根拠の出典" });
  }
  return list.filter((s, i) => list.findIndex((x) => x.url === s.url) === i);
}
