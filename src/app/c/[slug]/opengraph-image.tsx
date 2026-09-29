import { notFound } from "next/navigation";
import { fetchPublicCard } from "@/lib/public-card";
import { buildCardView } from "@/lib/card-view";
import { renderCardImage, CARD_SIZE } from "@/components/card/CardImage";

export const size = CARD_SIZE;
export const contentType = "image/png";
export const alt = "ロビラボ マイ設定の名刺カード";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await fetchPublicCard(slug);
  if (!card) notFound();
  const res = await renderCardImage(buildCardView(card));
  // 公開をやめたり内容を変えたりしたら、すぐ反映されるようにする(ImageResponse の既定は 1 年の immutable)。検索にも載せない
  const headers = new Headers(res.headers);
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  headers.set("X-Robots-Tag", "noindex");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
