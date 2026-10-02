import type { Metadata } from "next";
import { PROS_READY } from "@/data/pros";
import { TYPES } from "@/data/types";
import { subnavFor } from "@/lib/nav";
import { PageShell } from "@/components/ui/page-shell";
import { SubNav } from "@/components/brand/SubNav";
import { DiagnosisClient } from "./DiagnosisClient";

export const metadata: Metadata = { title: "ゲーマータイプ診断(12問・約1分半)" };

// 始める画面の「例の絵」に使う、コードと名前だけ(16 タイプの説明文はブラウザに送らない)
const EXAMPLES = TYPES.map((t) => ({ code: t.code, name: t.name }));

export default function DiagnosisPage() {
  return (
    <PageShell width="wide" title="ゲーマータイプ診断" subnav={<SubNav label="診断" items={subnavFor("diagnosis", PROS_READY)} />}>
      <DiagnosisClient examples={EXAMPLES} />
    </PageShell>
  );
}
