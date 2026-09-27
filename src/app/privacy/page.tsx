import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "プライバシーポリシー" };

export default function PrivacyPage() {
  const text = fs.readFileSync(path.join(process.cwd(), "content/legal/privacy.md"), "utf8");
  return <LegalText text={text} />;
}

function LegalText({ text }: { text: string }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 leading-relaxed">
      {text.split(/\n{2,}/).map((block, i) =>
        block.startsWith("#") ? (
          <h2 key={i} className="mb-3 mt-6 text-lg font-bold">{block.replace(/^#+\s*/, "")}</h2>
        ) : (
          <p key={i} className="mb-3 whitespace-pre-wrap text-sm">{block}</p>
        ),
      )}
    </main>
  );
}
