import type { Metadata } from "next";
import { MySettingsClient } from "@/components/my/MySettingsClient";
import { PageShell } from "@/components/ui/page-shell";
import { InstallHintBlock } from "@/components/pwa/InstallHintBlock";

export const metadata: Metadata = {
  title: "マイ設定",
  description: "感度・デバイス・好きなゲームを一度だけ登録して、ツールで使ったり名刺カードにしてシェアしたりできます。",
};

export default function MyPage() {
  return (
    <PageShell width="wide" title="マイ設定" description="一度入れたら、感度計算などのツールが自動で使います。入力はその場で保存されます。">
      <MySettingsClient />
      <InstallHintBlock place="my" className="mt-rl-ma-md" />
    </PageShell>
  );
}
