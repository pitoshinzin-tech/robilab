import { buildCardView, CARD_REQUEST_MAX_BYTES, contentLengthTooLarge, parseCardRequest } from "@/lib/card-view";
import { readBodyCapped } from "@/lib/read-body";
import { renderCardImage } from "@/components/card/CardImage";

/**
 * 本人用の名刺カード画像。本文(公開カードの項目)を受け取って PNG を返す。
 * URL だけで呼べる GET は用意しない(他人に見せる手段にしない)。
 */
export async function POST(request: Request) {
  if (contentLengthTooLarge(request.headers.get("content-length"))) return new Response("Payload Too Large", { status: 413 });
  let body: string | null;
  try {
    body = await readBodyCapped(request, CARD_REQUEST_MAX_BYTES);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
  if (body === null) return new Response("Payload Too Large", { status: 413 });
  const data = parseCardRequest(body);
  if (!data) return new Response("Bad Request", { status: 400 });
  try {
    const image = await renderCardImage(buildCardView(data));
    image.headers.set("Cache-Control", "no-store");
    return image;
  } catch {
    return new Response("画像を作れませんでした。", { status: 500 });
  }
}
