import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { LegalText } from "@/components/legal/LegalText";

export const metadata: Metadata = { title: "利用規約" };

export default function TermsPage() {
  const text = fs.readFileSync(path.join(process.cwd(), "content/legal/terms.md"), "utf8");
  return <LegalText text={text} />;
}
