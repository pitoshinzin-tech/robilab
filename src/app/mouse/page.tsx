import type { Metadata } from "next";
import Link from "next/link";
import { MICE_RAKUTEN } from "@/data/mice-rakuten";
import { PROS_READY } from "@/data/pros";
import { subnavFor } from "@/lib/nav";
import { getSiteUrl } from "@/lib/site-url";
import { PageShell } from "@/components/ui/page-shell";
import { SubNav } from "@/components/brand/SubNav";
import { MouseClient } from "./MouseClient";

const TITLE = "マウス探し(手の大きさと持ち方で選ぶ)";
const DESCRIPTION = "手の長さ・幅と持ち方から、ちょうどいい大きさのゲーミングマウスを理由付きで並べます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function MousePage() {
  return (
    <PageShell width="wide" title="マウス探し" description="手の大きさと持ち方から、ちょうどいい大きさのマウスを探します。"
      subnav={<SubNav label="感度・マウス" items={subnavFor("mouse", PROS_READY)} />}>
      <div className="grid gap-8">
        <MouseClient pageUrl={`${getSiteUrl()}/mouse`} />
        <p className="text-xs text-rl-muted">
          大きさ・重さは各メーカー公式サイトの表記です(確認日はデータに記録)。目安は一般的な考え方を元にした参考の値です。
          価格や在庫は各ショップでご確認ください。Amazon・楽天のリンクには広告(PR)が含まれる場合があります(<Link href="/disclosure" className="text-rl-accent underline">広告表記</Link>)。
        </p>
        {Object.keys(MICE_RAKUTEN).length > 0 && (
          // 楽天ウェブサービスのクレジット表記(公式の「テキストクレジット」のコードをそのまま使う。改変しない決まりなので rel も足さない。target="_blank" は今のブラウザでは noopener 扱い)
          <p className="text-xs text-rl-muted">
            {/* Rakuten Web Services Attribution Snippet FROM HERE */}
            <a href="https://developers.rakuten.com/" target="_blank">Supported by Rakuten Developers</a>
            {/* Rakuten Web Services Attribution Snippet TO HERE */}
          </p>
        )}
      </div>
    </PageShell>
  );
}
