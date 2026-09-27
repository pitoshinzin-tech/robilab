/** Google Fonts から、使う文字だけのフォントを取得する(シェア画像の日本語用)。取れなければ null。 */
export async function loadOgFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@700&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}
