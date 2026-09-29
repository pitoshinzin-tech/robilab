// ビルド時は16枚を同時に作るので、短すぎると失敗する。止まったままにならない程度の長さにする
const TIMEOUT_MS = 15000;

/** Google Fonts の CSS から、フォントファイル(opentype / truetype)の URL を取り出す */
export function extractFontUrl(css: string): string | null {
  return css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1] ?? null;
}

/** Google Fonts から、使う文字だけのフォントを取得する(シェア画像の日本語用)。取れなければ null。 */
export async function loadOgFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@700&text=${encodeURIComponent(text)}`, {
        cache: "force-cache",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    ).text();
    const url = extractFontUrl(css);
    if (!url) return null;
    return await (await fetch(url, { cache: "force-cache", signal: AbortSignal.timeout(TIMEOUT_MS) })).arrayBuffer();
  } catch {
    return null;
  }
}
