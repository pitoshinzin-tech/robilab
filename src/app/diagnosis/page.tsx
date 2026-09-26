import type { Metadata } from "next";
import { DiagnosisClient } from "./DiagnosisClient";

export const metadata: Metadata = { title: "ゲーマータイプ診断(12問・約1分半)" };

export default function DiagnosisPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <DiagnosisClient />
    </main>
  );
}
