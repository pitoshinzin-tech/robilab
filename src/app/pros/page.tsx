import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROS_READY } from "@/data/pros";
import { subnavFor } from "@/lib/nav";
import { PageShell } from "@/components/ui/page-shell";
import { SubNav } from "@/components/brand/SubNav";
import { ProsClient } from "./ProsClient";

const TITLE = "プロ設定(VALORANT・Apex・OW2・CS2 の感度)";
const DESCRIPTION = "プロ選手の DPI・感度・振り向きの距離を一覧に。あなたの感度に近いプロもわかります。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function ProsPage() {
  // データが入るまでページは隠す(一次情報が見つかるまで、空の一覧を公開しない)
  if (!PROS_READY) notFound();
  return (
    <PageShell width="wide" title="プロ設定" description="プロ選手の感度と、あなたの感度に近いプロ。"
      subnav={<SubNav label="感度・マウス" items={subnavFor("mouse", PROS_READY)} />}>
      <div className="grid gap-8">
        <ProsClient />
        <div className="grid gap-1 text-sm text-rl-muted">
          <p>数字は選手本人・所属チームの公開情報です。変わることがあります(確認日は各選手に記載)。</p>
          <p>掲載を外してほしい場合は、<Link href="/terms" className="text-rl-accent underline">利用規約のお問い合わせ先</Link>からご連絡ください。</p>
        </div>
      </div>
    </PageShell>
  );
}
