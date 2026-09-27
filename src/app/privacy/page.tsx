import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { LegalText } from "@/components/legal/LegalText";

export const metadata: Metadata = { title: "プライバシーポリシー" };

export default function PrivacyPage() {
  const text = fs.readFileSync(path.join(process.cwd(), "content/legal/privacy.md"), "utf8");
  return <LegalText text={text} />;
}
