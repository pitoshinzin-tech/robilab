// ビルド時は16枚を同時に作るので、短すぎると失敗する。止まったままにならない程度の長さにする
const TIMEOUT_MS = 15000;
/** フォントファイルの大きさの上限(使う文字だけのサブセットなので、ふつうは数百 KB 以下) */
export const OG_FONT_MAX_BYTES = 5 * 1024 * 1024;
/** Google Fonts の CSS の大きさの上限(ふつうは数 KB) */
export const OG_FONT_CSS_MAX_BYTES = 200 * 1024;
const FONT_ORIGIN = "https://fonts.gstatic.com";

/** Google Fonts の CSS から、フォントファイル(opentype / truetype)の URL を取り出す */
export function extractFontUrl(css: string): string | null {
  return css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1] ?? null;
}

/** フォントを取りに行ってよい URL か(https://fonts.gstatic.com/ のものだけ) */
export function isAllowedFontUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.origin === FONT_ORIGIN && u.username === "" && u.password === "";
  } catch {
    return false;
  }
}

/** 応答(フォント・CSS)を、上限のバイト数までだけ読む。超えたら null。 */
export async function readFontCapped(res: Response, maxBytes: number = OG_FONT_MAX_BYTES): Promise<ArrayBuffer | null> {
  if (!res.ok) return null;
  const length = res.headers.get("content-length");
  if (length !== null && /^[0-9]+$/.test(length) && Number(length) > maxBytes) {
    await res.body?.cancel().catch(() => {});
    return null;
  }
  if (!res.body) return new ArrayBuffer(0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out.buffer;
}

/** Google Fonts から、使う文字だけのフォントを取得する(シェア画像の日本語用)。取れなければ null。 */
export async function loadOgFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(`https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@700&text=${encodeURIComponent(text)}`, {
      cache: "force-cache",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const cssBytes = await readFontCapped(cssRes, OG_FONT_CSS_MAX_BYTES);
    if (!cssBytes) return null;
    const css = new TextDecoder().decode(cssBytes);
    const url = extractFontUrl(css);
    if (!url || !isAllowedFontUrl(url)) return null;
    // 転送(リダイレクト)は追わない。転送先がどこであっても、そこへは接続しない
    const res = await fetch(url, { cache: "force-cache", redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS) });
    // 念のため、取った先が fonts.gstatic.com でなければ使わない
    if (res.url && !isAllowedFontUrl(res.url)) {
      await res.body?.cancel().catch(() => {});
      return null;
    }
    return await readFontCapped(res);
  } catch {
    return null;
  }
}
