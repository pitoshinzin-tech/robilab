import type { Metadata } from "next";
import { PROS_READY } from "@/data/pros";
import { subnavFor } from "@/lib/nav";
import { PageShell } from "@/components/ui/page-shell";
import { SubNav } from "@/components/brand/SubNav";
import { DiagnosisClient } from "./DiagnosisClient";

export const metadata: Metadata = { title: "ゲーマータイプ診断(12問・約1分半)" };

export default function DiagnosisPage() {
  return (
    <PageShell title="ゲーマータイプ診断" subnav={<SubNav label="診断" items={subnavFor("diagnosis", PROS_READY)} />}>
      <DiagnosisClient />
    </PageShell>
  );
}
