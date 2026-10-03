/**
 * 表示速度(docs/design/perf.md):/my の名刺の画像(/api/card-image)を、画面の部品が描かれるのを待たずに作り始める。
 * CardPreview のファイルが読み込まれた時(JS が動いた時)に、この端末のマイ設定から最初の本文で 1 回だけ頼み、
 * CardPreview の最初の作成で本文が同じならそれを使う(違えば捨てて、今までどおり頼む)。見た目は変わらない。
 * さらに早く、/my の HTML の 1 行の script(cardEarlyScript)が、JS を待たずに頼み始める(window に置き、ここで受け取る)。
 */
import { MY_SETTINGS_KEY } from "@/lib/my-settings-store";
type Early = { body: string; promise: Promise<Blob | null> };
let early: Early | null = null;

/** ページの HTML の 1 行の script(cardEarlyScript)が置く先の名前 */
export const CARD_EARLY_GLOBAL = "__rlCardEarly";

/** HTML の script が先に頼んでいれば、それを受け取る(1 回だけ) */
function fromPage(): Early | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const e = w[CARD_EARLY_GLOBAL] as { body?: unknown; promise?: unknown } | undefined;
  delete w[CARD_EARLY_GLOBAL];
  if (!e || typeof e.body !== "string" || !(e.promise instanceof Promise)) return null;
  const promise = (e.promise as Promise<unknown>).then((b) => (b instanceof Blob ? b : null), () => null);
  return { body: e.body, promise };
}

/** 本文で画像を頼み始める(すでに頼んでいれば何もしない) */
export function startEarlyCardImage(body: string, fetcher: typeof fetch = fetch): void {
  if (early) return;
  early = fromPage();
  if (early) return;
  const promise = fetcher("/api/card-image", { method: "POST", body, headers: { "Content-Type": "application/json" } })
    .then((res) => (res.ok ? res.blob() : null))
    .catch(() => null);
  early = { body, promise };
}

/** 先に頼んだ画像を受け取る(1 回だけ)。本文が違えば null(先の分は捨てる) */
export function takeEarlyCardImage(body: string): Promise<Blob | null> | null {
  const e = early ?? fromPage();
  early = null;
  return e && e.body === body ? e.promise : null;
}

/**
 * /my の HTML に置く 1 行の script。この端末の保存から toPublicCardData と同じ形・同じ並びの本文を作り、/api/card-image を頼み始める。
 * 保存がなければ空のマイ設定の本文。保存が壊れていても、本文が CardPreview の本文と違うだけ(使われず、今までどおり頼む。サーバーは形を確かめる)。
 * 本文はこの端末の保存だけから作る(URL などページの外の値は使わない)。
 */
export function cardEarlyScript(): string {
  return `try{(function(){var s=null;try{s=JSON.parse(localStorage.getItem(${JSON.stringify(MY_SETTINGS_KEY)})||"null")}catch(e){}`
    + `var o=s&&typeof s==="object"&&!Array.isArray(s);var g=o?s.mainGame:null;var v=o&&g&&s.sens&&typeof s.sens==="object"&&s.sens[g]!==undefined?s.sens[g]:null;`
    + `var d=o?{typeCode:s.typeCode,cardName:s.cardName,dpi:s.dpi,mainGame:g,mainSens:g?v:null,grip:s.hand&&typeof s.hand==="object"?s.hand.grip:null,devices:s.devices,favoriteGames:s.favoriteGames}`
    + `:{typeCode:null,cardName:null,dpi:null,mainGame:null,mainSens:null,grip:null,devices:{mouse:null,pad:null,keyboard:null,headset:null},favoriteGames:[]};`
    + `var b=JSON.stringify(d);window.${CARD_EARLY_GLOBAL}={body:b,promise:fetch("/api/card-image",{method:"POST",body:b,headers:{"Content-Type":"application/json"}}).then(function(r){return r.ok?r.blob():null}).catch(function(){return null})}})()}catch(e){}`;
}
