/**
 * View Transition の名前と遷移の型(追補 S2・S3)。名前は必ずここで作る。
 * 1 ページに同じ view-transition-name が 2 つあると、ブラウザはその遷移をやめる。
 */
export const VT_SITE_HEADER = "site-header";
export const VT_TAB_BAR = "tab-bar";
export const VT_TODAY_KANJI = "today-kanji";
export const VT_TYPE_SPRITE = "type-sprite";

export const typeVtName = (code: string): string => `type-${code}`;
/** id(uuid)の英数字と - _ だけを使う。先頭は player- なので数字で始まっても識別子になる。 */
export const playerVtName = (id: string): string => `player-${id.replace(/[^A-Za-z0-9_-]/g, "")}`;

const IDENT_RE = /^-?[A-Za-z_][A-Za-z0-9_-]*$/;
export function isVtIdent(name: string): boolean {
  return IDENT_RE.test(name) && name !== "none" && name !== "auto";
}

/** 遷移の型(<Link transitionTypes> と router.push の transitionTypes) */
export const NAV_FORWARD = "nav-forward";
export const NAV_BACK = "nav-back";
export const TYPE_REVEAL = "type-reveal";
/** 結果の画面の「相性のいいタイプ」の行から次の結果へ(この型のときだけ、行の絵と次の結果の絵が対になる) */
export const TYPE_ROW = "type-row";

/** PageShell の enter / exit。型のない移動(ブラウザの戻る・ふつうのリンク)はスキャンライン、診断 → 結果は絵の移る動きだけ。 */
export const PAGE_VT_CLASSES = {
  [NAV_FORWARD]: "rl-forward",
  [NAV_BACK]: "rl-back",
  [TYPE_REVEAL]: "none",
  default: "rl-scan",
} as const;

/** 共有の要素のクラス(globals.css の ::view-transition-group(.rl-morph-*)) */
export const MORPH_PIXEL = "rl-morph-pixel";
export const MORPH_LINE = "rl-morph-line";
