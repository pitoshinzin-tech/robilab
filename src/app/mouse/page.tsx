import type { Metadata } from "next";
import Link from "next/link";
import { MICE_RAKUTEN } from "@/data/mice-rakuten";
import { getSiteUrl } from "@/lib/site-url";
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
    <main className="mx-auto grid max-w-3xl gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold">マウス探し</h1>
        <p className="text-sm text-[var(--rl-muted)]">手の大きさと持ち方から、ちょうどいい大きさのマウスを探します。</p>
      </header>
      <MouseClient pageUrl={`${getSiteUrl()}/mouse`} />
      <p className="text-xs text-[var(--rl-muted)]">
        大きさ・重さは各メーカー公式サイトの表記です(確認日はデータに記録)。目安は一般的な考え方を元にした参考の値です。
        価格や在庫は各ショップでご確認ください。Amazon・楽天のリンクには広告(PR)が含まれる場合があります(<Link href="/disclosure" className="underline">広告表記</Link>)。
      </p>
      {Object.keys(MICE_RAKUTEN).length > 0 && (
        // 楽天ウェブサービスのクレジット表記(公式の「テキストクレジット」のコードをそのまま使う。改変しない決まりなので rel も足さない。target="_blank" は今のブラウザでは noopener 扱い)
        <p className="text-xs text-[var(--rl-muted)]">
          {/* Rakuten Web Services Attribution Snippet FROM HERE */}
          <a href="https://developers.rakuten.com/" target="_blank">Supported by Rakuten Developers</a>
          {/* Rakuten Web Services Attribution Snippet TO HERE */}
        </p>
      )}
    </main>
  );
}
