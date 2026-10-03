import type { Metadata } from "next";
import { MySettingsClient } from "@/components/my/MySettingsClient";
import { PageShell } from "@/components/ui/page-shell";
import { InstallHintBlock } from "@/components/pwa/InstallHintBlock";
import { cardEarlyScript } from "@/lib/card-early";

export const metadata: Metadata = {
  title: "マイ設定",
  description: "感度・デバイス・好きなゲームを一度だけ登録して、ツールで使ったり名刺カードにしてシェアしたりできます。",
};

export default function MyPage() {
  return (
    <PageShell width="wide" title="マイ設定" description="一度入れたら、感度計算などのツールが自動で使います。入力はその場で保存されます。">
      {/* 表示速度:名刺の画像を、JS を待たずに頼み始める(src/lib/card-early.ts。CardPreview が同じ本文なら使う) */}
      <script dangerouslySetInnerHTML={{ __html: cardEarlyScript() }} />
      <MySettingsClient installHint={<InstallHintBlock place="my" className="border-t border-rl-line pt-6" />} />
    </PageShell>
  );
}
