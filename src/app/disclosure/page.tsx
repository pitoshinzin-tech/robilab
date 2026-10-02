import type { Metadata } from "next";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = { title: "広告表記" };

export default function DisclosurePage() {
  return (
    <PageShell title="広告表記">
      <div className="grid gap-4 text-base leading-[1.9]">
        <p>当サイトには、アフィリエイトプログラムを利用した広告(PR)が含まれます。広告であるリンクの近くには「PR」と表示しています。</p>
        <p>Amazonのアソシエイトとして、ロビラボは適格販売により収入を得ています。</p>
        <p>当サイトは、楽天アフィリエイトに参加しています。</p>
        <p>紹介している商品のコメントは、運営者が実際に使った体験にもとづいています。価格や在庫は、各ストアのページでご確認ください。</p>
      </div>
    </PageShell>
  );
}
