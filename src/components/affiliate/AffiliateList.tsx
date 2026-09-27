import Link from "next/link";
import { affiliatesFor } from "@/data/affiliates";

export function AffiliateList({ typeCode }: { typeCode: string }) {
  const items = affiliatesFor(typeCode);
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-bold">このタイプのあなたに</h2>
        <span className="rounded bg-white/15 px-2 py-0.5 text-xs">PR</span>
      </div>
      <ul className="grid gap-3">
        {items.map((a) => (
          <li key={a.id} className="rounded-xl border border-white/10 bg-[var(--rl-surface)] p-4">
            <a href={a.url} target="_blank" rel="sponsored noopener" className="font-bold underline">{a.name}</a>
            <p className="mt-1 text-sm text-[var(--rl-muted)]">{a.comment}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--rl-muted)]">当サイトはアフィリエイトプログラムに参加しています。<Link href="/disclosure" className="underline">広告表記</Link></p>
    </section>
  );
}
