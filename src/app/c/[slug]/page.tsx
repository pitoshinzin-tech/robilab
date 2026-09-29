import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublicCard } from "@/lib/public-card";
import { buildCardView } from "@/lib/card-view";

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
    <main className="mx-auto grid max-w-2xl gap-5 px-4 py-6">
      <h1 className="text-2xl font-bold">{view.cardName ?? "ゲーマー"}のマイ設定</h1>
      {/* eslint-disable-next-line @next/next/no-img-element -- 動的な OG 画像をそのまま見せる */}
      <img src={`/c/${slug}/opengraph-image`} alt="名刺カード" width={1200} height={630} className="w-full rounded-xl border border-[var(--rl-border)]" />
      <Link href="/my" className="justify-self-start rounded-full bg-[var(--rl-accent)] px-6 py-3 font-bold text-[var(--rl-on-accent)]">自分も作る</Link>
    </main>
  );
}
