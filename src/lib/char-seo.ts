import type { Char } from "@/data/char-types";
import type { CharGameSetting } from "@/data/char-games";
import type { Game, Role } from "@/data/games";
import type { GamerType } from "@/data/types";

/**
 * キャラ図鑑のページの title・description・パンくず(設計書 6-6・台帳)。キャラのデータは読まない(引数で受け取る)。
 * keywords は作らない。VALORANT(nameInTitle: false)は title・description・パンくずにキャラ名を入れない。
 * layout の title の template で「|ロビラボ」が後ろに付く。
 */
export type PageText = { title: string; description: string };

export function dexIndexMeta(gameCount: number): PageText {
  return {
    title: "キャラ図鑑|ゲームごとの代表キャラ",
    description: `${gameCount} 本のゲームの代表キャラを、公式のロールと公式の言葉でまとめました。診断のタイプから、合うキャラが分かります。`,
  };
}

/** 一覧のページの 1 行の説明(h1 の下) */
export function listLead(setting: CharGameSetting, count: number): string {
  return setting.matching
    ? `代表キャラ ${count} 体。公式のロールと公式の言葉から、どんなタイプに合うかをまとめました。`
    : `代表キャラ ${count} 体。公式の紹介と公式ページへのリンクをまとめました。`;
}

export function listMeta(game: Game, setting: CharGameSetting, count: number): PageText {
  return {
    title: setting.matching ? `${game.name} のキャラ図鑑|合うキャラが分かる` : `${game.name} のキャラ図鑑`,
    description: `${game.name} の${listLead(setting, count)}`,
  };
}

export function charMeta(char: Char, game: Game, role: Role | undefined, setting: CharGameSetting, fits: readonly GamerType[]): PageText {
  const matched = setting.matching && char.matchable && fits.length > 0;
  if (!setting.nameInTitle) {
    const roleName = role?.name ?? "キャラ";
    return {
      title: `${game.name} のキャラ図鑑(${roleName})`,
      description: `${game.name} の${roleName}の代表キャラを、公式のロールと公式の言葉から紹介します。${matched ? "合うタイプも分かります。" : ""}`,
    };
  }
  if (!matched) return { title: `${char.nameJa}(${game.name})|キャラ図鑑`, description: char.summary };
  return {
    title: `${char.nameJa}(${game.name})はどんなタイプに合う?`,
    description: `${char.summary}合うタイプ:${fits.map((t) => t.name).join("・")}。`,
  };
}

export type Crumb = { name: string; path: string };

export function listCrumbs(game: Game): Crumb[] {
  return [{ name: "キャラ図鑑", path: "/games" }, { name: `${game.name} のキャラ図鑑`, path: `/games/${game.id}/chars` }];
}

export function charCrumbs(char: Char, game: Game, setting: CharGameSetting): Crumb[] {
  const base = listCrumbs(game);
  return setting.nameInTitle ? [...base, { name: char.nameJa, path: `/games/${game.id}/chars/${char.id}` }] : base;
}

/** パンくずの JSON-LD。Next の JSON-LD の手引きどおり、JSON.stringify のあと < を < に(script の外に出られない) */
export function breadcrumbJsonLd(crumbs: readonly Crumb[], site: string): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${site}${c.path}` })),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** 英語(ASCII と ©・’ だけ)の文か。英語の引用・断り書きに lang="en" を付けるため */
export function isLatinText(s: string): boolean {
  return /^[\x20-\x7E©’]+$/.test(s);
}
