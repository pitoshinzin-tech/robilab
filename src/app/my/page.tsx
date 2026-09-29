import type { Metadata } from "next";
import { MySettingsClient } from "@/components/my/MySettingsClient";

export const metadata: Metadata = {
  title: "マイ設定",
  description: "感度・デバイス・好きなゲームを一度だけ登録して、ツールで使ったり名刺カードにしてシェアしたりできます。",
};

export default function MyPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-2 text-2xl font-bold">マイ設定</h1>
      <p className="mb-6 text-sm text-[var(--rl-muted)]">一度入れたら、感度計算などのツールが自動で使います。入力はその場で保存されます。</p>
      <MySettingsClient />
    </main>
  );
}
