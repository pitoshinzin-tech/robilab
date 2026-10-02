import type { Metadata } from "next";
import { PROS_READY } from "@/data/pros";
import { subnavFor } from "@/lib/nav";
import { PageShell } from "@/components/ui/page-shell";
import { SubNav } from "@/components/brand/SubNav";
import { SensitivityTool } from "./SensitivityTool";

export const metadata: Metadata = {
  title: "感度計算(振り向き・eDPI・ゲーム間の換算)",
  description: "VALORANT・オーバーウォッチ・Apex・CS2 などの感度を、振り向き(cm/360°)と eDPI で比べて、ゲーム間で換算できます。",
};

export default function SensitivityPage() {
  return (
    <PageShell title="感度計算" description="振り向き(360°回るのに必要なマウスの移動距離)と eDPI を計算し、ほかのゲームの感度に換算します。腰だめ(ADS なし)の感度が対象です。"
      subnav={<SubNav label="感度・マウス" items={subnavFor("mouse", PROS_READY)} />}>
      <SensitivityTool />
    </PageShell>
  );
}
