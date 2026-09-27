import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "仲間を探す" };

export default function LobbyPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--rl-cyan)]">仲間さがし</p>
      <p className="mt-4 leading-relaxed">
        仲間さがしは準備中です(18歳以上・Discord ログイン)。
      </p>
      <Link href="/diagnosis" className="mt-6 inline-block rounded-full bg-[var(--rl-cyan)] px-6 py-3 font-bold text-[#0a0c16]">
        診断してみる
      </Link>
    </main>
  );
}
