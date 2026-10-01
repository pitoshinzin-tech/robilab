import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { TYPES } from "@/data/types";
import { GlitchTitle } from "@/components/brand/GlitchTitle";
import { TypeIcon } from "@/components/brand/TypeIcon";

const ENTRANCES = [
  { href: "/diagnosis", emoji: "🧪", title: "自分を知る", sub: "1分半のゲーマータイプ診断" },
  { href: "/tools/sensitivity", emoji: "🎯", title: "感度を合わせる", sub: "振り向き・eDPI・ゲーム間の換算" },
  { href: "/lobby", emoji: "🤝", title: "仲間を探す", sub: "一緒に遊ぶ人を見つける(18歳以上)" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4">
      <section className="py-10">
        <p className="mb-2 font-display text-xs tracking-[.2em] text-[var(--rl-cyan)]">{BRAND.tagline}</p>
        <GlitchTitle className="text-4xl">{BRAND.name}</GlitchTitle>
        <p className="mt-4 text-lg">今日はなにしに来た?</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {ENTRANCES.map((e) => (
          <Link key={e.href} href={e.href} className="rounded-2xl border border-[var(--rl-border)] bg-[var(--rl-surface)] p-5 transition hover:border-[var(--rl-cyan)]">
            <div className="text-3xl">{e.emoji}</div>
            <div className="mt-2 text-xl font-bold">{e.title}</div>
            <div className="mt-1 text-sm text-[var(--rl-muted)]">{e.sub}</div>
          </Link>
        ))}
      </section>
      <section className="mt-12">
        <h2 className="mb-4 text-lg font-bold">16のゲーマータイプ</h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {TYPES.map((t) => (
            <Link key={t.code} href={`/type/${t.code}`} className="grid place-items-center gap-1 text-xs">
              <TypeIcon code={t.code} size={48} />
              <span className="font-display">{t.code}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
