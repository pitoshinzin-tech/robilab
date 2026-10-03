/**
 * /skates の「マイ設定のマウスで選ぶ」のための小さな読み取り(ブラウザの部品が使う)。
 * マイ設定の読み書きの部品(入力チェック一式)をブラウザの JS に入れないため、キーと id の形だけを写す(テストで一致を確かめる)。
 */
export const MY_SETTINGS_STORAGE_KEY = "robilab:mySettings";
/** src/lib/my-settings.ts の CATALOG_ID_RE と同じ */
export const MOUSE_ID_RE = /^[a-z0-9-]{1,40}$/;

/** 保存されたマイ設定の文字から、候補から選んだマウスの id を読む。読めない・自由入力の名前・形が違うときは null */
export function myMouseIdFrom(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null) return null;
    const devices = (v as { devices?: unknown }).devices;
    if (typeof devices !== "object" || devices === null) return null;
    const mouse = (devices as { mouse?: unknown }).mouse;
    if (typeof mouse !== "object" || mouse === null) return null;
    const id = (mouse as { id?: unknown }).id;
    return typeof id === "string" && MOUSE_ID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** URL にマウスの指定がまったくないときだけ選び直す(「選ばない」を選んだ ?mouse= は上書きしない) */
export function shouldPreselect(search: string): boolean {
  return !new URLSearchParams(search).has("mouse");
}

const SKATE_MATERIALS: readonly string[] = ["all", "PTFE", "glass", "UPE", "other"];
const SKATE_SHAPES: readonly string[] = ["all", "full", "dot"];

/**
 * 選び直しの URL の query。マウス(mouse)と from=my に、決まった値の material・shape だけを写す
 * (ほかのキー・決まっていない値・元の from は捨てる。URL に何が付いていても、そのまま router.replace に渡さない)。
 */
export function preselectQuery(search: string, mouseId: string): string {
  const src = new URLSearchParams(search);
  const q = new URLSearchParams();
  q.set("mouse", mouseId);
  const material = src.get("material");
  if (material !== null && SKATE_MATERIALS.includes(material)) q.set("material", material);
  const shape = src.get("shape");
  if (shape !== null && SKATE_SHAPES.includes(shape)) q.set("shape", shape);
  q.set("from", "my");
  return q.toString();
}
