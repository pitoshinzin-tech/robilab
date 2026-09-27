import type { Metadata } from "next";

export const metadata: Metadata = { title: "広告表記" };

export default function DisclosurePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 text-sm leading-relaxed">
      <h1 className="mb-4 text-2xl font-bold">広告表記</h1>
      <p className="mb-3">当サイトには、アフィリエイトプログラムを利用した広告(PR)が含まれます。広告であるリンクの近くには「PR」と表示しています。</p>
      <p className="mb-3">Amazonのアソシエイトとして、ロビラボは適格販売により収入を得ています。</p>
      <p className="mb-3">当サイトは、楽天アフィリエイトに参加しています。</p>
      <p className="mb-3">紹介している商品のコメントは、運営者が実際に使った体験にもとづいています。価格や在庫は、各ストアのページでご確認ください。</p>
    </main>
  );
}
