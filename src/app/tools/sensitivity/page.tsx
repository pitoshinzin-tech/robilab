import type { Metadata } from "next";
import { SensitivityClient } from "./SensitivityClient";

export const metadata: Metadata = {
  title: "感度計算(振り向き・eDPI・ゲーム間の換算)",
  description: "VALORANT・オーバーウォッチ・Apex・CS2 などの感度を、振り向き(cm/360°)と eDPI で比べて、ゲーム間で換算できます。",
};

export default function SensitivityPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-2 text-2xl font-bold">感度計算</h1>
      <p className="mb-6 text-sm text-[var(--rl-muted)]">振り向き(360°回るのに必要なマウスの移動距離)と eDPI を計算し、ほかのゲームの感度に換算します。腰だめ(ADS なし)の感度が対象です。</p>
      <SensitivityClient />
    </main>
  );
}
