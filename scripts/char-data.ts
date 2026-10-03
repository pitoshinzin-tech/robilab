/**
 * docs/content/chars/*.json(公式の原文の引用・出典 URL・確認日つき。照合済み)から src/data/chars.ts を作る。
 * 使い方(リポジトリの一番上で): node scripts/char-data.ts
 * JSON を直したら作り直し、JSON と .ts を一緒にコミットする。サイトの実行時には JSON を読まない(この .ts だけを import する)。
 * tests/data/chars-generated.test.ts が「作り直し忘れ」を、tests/data/chars.test.ts がデータの決まりを確かめる。
 * 決まりに合わないデータは書き出さずに止める(どのキャラのどこかをエラーに出す)。調べた人のメモ(selectionBasis)は持ち込まない。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type { Char, CharEvidence, CharGameId, CharPickedBy, CharQuote, CharTagId } from "../src/data/char-types";

export const GAME_FILES: readonly CharGameId[] = ["overwatch", "valorant", "apex", "sf6", "dbd"];
export const TAGS: readonly CharTagId[] = ["front", "hold", "mobile", "setup", "ally", "lone", "aggro", "calm"];
/** 札が動かす軸(設計書 3-2。同じ軸に 2 枚は付けない)。src/lib/char-match.ts の TAG_AXIS と同じ(テストで確かめる) */
export const TAG_AXIS_ID: Record<CharTagId, "attack" | "instinct" | "team" | "heat"> = {
  front: "attack", hold: "attack", mobile: "instinct", setup: "instinct", ally: "team", lone: "team", aggro: "heat", calm: "heat",
};
const PICKED_BY: readonly CharPickedBy[] = ["official-beginner", "free", "variety"];
/** ゲームごとに出典にしてよい公式のドメイン(設計書 3-4・8 章)。そのドメインか、そのサブドメインだけ */
export const OFFICIAL_HOSTS: Record<CharGameId, readonly string[]> = {
  overwatch: ["overwatch.blizzard.com"],
  valorant: ["playvalorant.com"],
  apex: ["ea.com"],
  sf6: ["streetfighter.com"],
  dbd: ["deadbydaylight.com"],
};
export const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const SUMMARY_MAX = 80;
export const QUOTE_MAX = 40;

const len = (s: string) => [...s].length;

/** JSON の 1 件(JSON.parse の結果なので中身は確かめながら使う) */
type RawChar = {
  id: string; game: string; roleId: string; nameJa: string; nameEn: string; officialRole: string; summary: string;
  quote: { text: string; url: string }; evidence: { tag: string; quote: string; url: string }[]; pickedBy: string;
  sourceUrl: string; checkedAt: string; matchable: boolean; roleBasis?: { text: string; url: string }; reserve?: boolean; selectionBasis?: string;
};

function fail(where: string, message: string): never {
  throw new Error(`${where}: ${message}`);
}

export function isOfficialUrl(url: string, game: CharGameId): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  return u.protocol === "https:" && OFFICIAL_HOSTS[game].some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
}

function quoteOf(raw: { text: string; url: string }, where: string, game: CharGameId): CharQuote {
  if (typeof raw.text !== "string" || raw.text.trim() === "" || len(raw.text) > QUOTE_MAX) fail(where, `引用は 1〜${QUOTE_MAX} 字`);
  if (!isOfficialUrl(raw.url, game)) fail(where, `出典が公式の https ではない ${raw.url}`);
  return { text: raw.text, url: raw.url };
}

export function toChars(game: CharGameId, raw: RawChar[]): Char[] {
  const seen = new Set<string>();
  return raw.map((c) => {
    const where = `${game}/${c.id}`;
    if (!ID_RE.test(c.id)) fail(where, "id は英小文字・数字・ハイフンだけ");
    if (seen.has(c.id)) fail(where, "id が重なっている");
    seen.add(c.id);
    if (c.game !== game) fail(where, `game が ${game} ではない`);
    if (!ID_RE.test(c.roleId)) fail(where, "roleId の形");
    for (const [k, v] of [["nameJa", c.nameJa], ["nameEn", c.nameEn], ["officialRole", c.officialRole]] as const) {
      if (typeof v !== "string" || v.trim() === "") fail(where, `${k} が空`);
    }
    if (typeof c.summary !== "string" || c.summary.trim() === "" || len(c.summary) > SUMMARY_MAX) fail(where, `summary は 1〜${SUMMARY_MAX} 字`);
    if (!(PICKED_BY as readonly string[]).includes(c.pickedBy)) fail(where, `pickedBy が想定外 ${c.pickedBy}`);
    if (!DATE_RE.test(c.checkedAt) || Number.isNaN(Date.parse(`${c.checkedAt}T00:00:00Z`))) fail(where, "checkedAt は YYYY-MM-DD");
    if (!isOfficialUrl(c.sourceUrl, game)) fail(where, `sourceUrl が公式の https ではない ${c.sourceUrl}`);
    if (typeof c.matchable !== "boolean") fail(where, "matchable は true / false");
    if (!Array.isArray(c.evidence) || c.evidence.length > 2) fail(where, "札は 0〜2 枚");
    const evidence: CharEvidence[] = c.evidence.map((e, i) => {
      if (!(TAGS as readonly string[]).includes(e.tag)) fail(`${where}.evidence[${i}]`, `札が想定外 ${e.tag}`);
      const q = quoteOf({ text: e.quote, url: e.url }, `${where}.evidence[${i}]`, game);
      return { tag: e.tag as CharTagId, quote: q.text, url: q.url };
    });
    const axes = evidence.map((e) => TAG_AXIS_ID[e.tag]);
    if (new Set(axes).size !== axes.length) fail(where, "同じ軸に札が 2 枚");
    return {
      id: c.id,
      game,
      roleId: c.roleId,
      nameJa: c.nameJa,
      nameEn: c.nameEn,
      officialRole: c.officialRole,
      summary: c.summary,
      quote: quoteOf(c.quote, `${where}.quote`, game),
      evidence,
      pickedBy: c.pickedBy as CharPickedBy,
      sourceUrl: c.sourceUrl,
      checkedAt: c.checkedAt,
      matchable: c.matchable,
      roleBasis: c.roleBasis ? quoteOf(c.roleBasis, `${where}.roleBasis`, game) : null,
      reserve: c.reserve === true,
    };
  });
}

/** 1 件を 1 行に(差分が読みやすい。JSON の書き方は TS としても正しい) */
function lines(items: readonly object[]): string {
  return items.map((x) => `  ${JSON.stringify(x)},`).join("\n");
}

export function renderCharsTs(all: Record<CharGameId, RawChar[]>): string {
  const chars = GAME_FILES.flatMap((g) => toChars(g, all[g]));
  return `// scripts/char-data.ts が docs/content/chars/*.json から作る。手で直さない(JSON を直して \`node scripts/char-data.ts\` で作り直す)。
import type { Char } from "./char-types";
export type { Char, CharEvidence, CharGameId, CharPickedBy, CharQuote, CharTagId } from "./char-types";

export const CHARS: Char[] = [
${lines(chars)}
];
`;
}

const readAll = () =>
  Object.fromEntries(GAME_FILES.map((g) => [g, JSON.parse(readFileSync(`docs/content/chars/${g}.json`, "utf8"))])) as Record<CharGameId, RawChar[]>;

/** 書き出すファイル(テストも同じ一覧を使う) */
export const TARGETS: { out: string; render: () => string }[] = [{ out: "src/data/chars.ts", render: () => renderCharsTs(readAll()) }];

function main() {
  for (const t of TARGETS) {
    writeFileSync(t.out, t.render());
    console.log(`書き出した: ${t.out}`);
  }
}

// node scripts/char-data.ts で動かしたときだけ書き出す(テストが import したときは書かない)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
