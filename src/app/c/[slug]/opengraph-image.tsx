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
  return renderCardImage(buildCardView(card));
}
