import { buildCardView, parseCardRequest } from "@/lib/card-view";
import { renderCardImage } from "@/components/card/CardImage";

/**
 * 本人用の名刺カード画像。本文(公開カードの項目)を受け取って PNG を返す。
 * URL だけで呼べる GET は用意しない(他人に見せる手段にしない)。
 */
export async function POST(request: Request) {
  const data = parseCardRequest(await request.text());
  if (!data) return new Response("Bad Request", { status: 400 });
  try {
    const image = await renderCardImage(buildCardView(data));
    image.headers.set("Cache-Control", "no-store");
    return image;
  } catch {
    return new Response("画像を作れませんでした。", { status: 500 });
  }
}
