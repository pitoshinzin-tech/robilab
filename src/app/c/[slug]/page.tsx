import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicCard } from "@/lib/public-card";
import { buildCardView } from "@/lib/card-view";
import { BRAND } from "@/lib/brand";
import { ButtonLink } from "@/components/ui/button-link";
import { PageShell } from "@/components/ui/page-shell";
import { CardImageFrame } from "./CardImageFrame";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await fetchPublicCard(slug);
  if (!card) return { robots: { index: false, follow: false } };
  const view = buildCardView(card);
  return {
    title: `${view.cardName ?? "ゲーマー"}のマイ設定`,
    description: "ロビラボのマイ設定(感度・デバイス・好きなゲーム)の名刺カード",
    robots: { index: false, follow: false },
  };
}

export default async function PublicCardPage({ params }: Props) {
  const { slug } = await params;
  const card = await fetchPublicCard(slug);
  if (!card) notFound();
  const view = buildCardView(card);
  return (
    <PageShell title={`${view.cardName ?? "ゲーマー"}のマイ設定`}>
      <div className="grid gap-6">
        <CardImageFrame slug={slug} />
        <p className="text-base text-rl-muted [word-break:auto-phrase] text-balance">{BRAND.name}は、{BRAND.lead}です。</p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/my" variant="primary">自分の名刺をつくる</ButtonLink>
          <ButtonLink href="/diagnosis" variant="secondary">タイプ診断をする</ButtonLink>
        </div>
      </div>
    </PageShell>
  );
}
