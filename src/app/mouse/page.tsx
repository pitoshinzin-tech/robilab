import type { Metadata } from "next";
import Link from "next/link";
import { DEVICES } from "@/data/devices";
import { MICE } from "@/data/mice";
import { MICE_RAKUTEN } from "@/data/mice-rakuten";
import { SKATES } from "@/data/skates";
import { PROS_READY } from "@/data/pros";
import { toMouseRows } from "@/lib/mouse-rows";
import { skateCounts } from "@/lib/skate-match";
import { subnavFor } from "@/lib/nav";
import { getSiteUrl } from "@/lib/site-url";
import { PageShell } from "@/components/ui/page-shell";
import { SubNav } from "@/components/brand/SubNav";
import { OtherMiceList } from "@/components/mouse/OtherMiceList";
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
  // 表示に要る分だけの行にして渡す(機種のデータ本体・出典の文はブラウザの JS に入れない)
  const { comparable, other } = toMouseRows(MICE, (id) => DEVICES.find((d) => d.id === id), MICE_RAKUTEN, skateCounts(SKATES));
  return (
    <PageShell width="wide" title="マウス探し" description="手の大きさと持ち方から、ちょうどいい大きさのマウスを探します。"
      subnav={<SubNav label="感度・マウス" items={subnavFor("mouse", PROS_READY)} />}>
      <div className="grid gap-8">
        <MouseClient pageUrl={`${getSiteUrl()}/mouse`} mice={comparable} />
        {other.length > 0 && <OtherMiceList items={other} />}
        <p className="text-xs text-rl-muted">
          大きさ・重さは各メーカー公式サイトの表記です(確認日はデータに記録)。公式に数字がない項目は「公式の記載なし」と出します。目安は一般的な考え方を元にした参考の値です。
          価格や在庫は各ショップでご確認ください。Amazon・楽天のリンクには広告(PR)が含まれる場合があります(<Link href="/disclosure" className="text-rl-accent underline">広告表記</Link>)。
        </p>
        {Object.keys(MICE_RAKUTEN).length > 0 && (
          // 楽天ウェブサービスのクレジット表記(公式の「テキストクレジット」のコード。文言とリンク先は変えず、別タブで開くので rel="noopener noreferrer" だけ足す)
          <p className="text-xs text-rl-muted">
            {/* Rakuten Web Services Attribution Snippet FROM HERE */}
            <a href="https://developers.rakuten.com/" target="_blank" rel="noopener noreferrer">Supported by Rakuten Developers</a>
            {/* Rakuten Web Services Attribution Snippet TO HERE */}
          </p>
        )}
      </div>
    </PageShell>
  );
}
