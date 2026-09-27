import type { Metadata } from "next";
import Link from "next/link";
import { TYPES } from "@/data/types";
import { PixelIcon } from "@/components/brand/PixelIcon";

export const metadata: Metadata = { title: "16のゲーマータイプ一覧" };

export default function TypesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">16のゲーマータイプ</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {TYPES.map((t) => (
          <li key={t.code}>
            <Link href={`/type/${t.code}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[var(--rl-surface)] p-3">
              <PixelIcon code={t.code} size={48} />
              <div>
                <div className="font-[family-name:var(--font-display)] text-sm text-[var(--rl-magenta)]">{t.code}</div>
                <div className="font-bold">{t.name}</div>
                <div className="text-xs text-[var(--rl-muted)]">{t.catchcopy}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/diagnosis" className="mt-8 inline-block rounded-full bg-[var(--rl-cyan)] px-6 py-3 font-bold text-[#0a0c16]">自分のタイプを診断する</Link>
    </main>
  );
}
