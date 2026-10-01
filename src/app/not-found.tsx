import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="font-display text-5xl text-[var(--rl-magenta)]">404</p>
      <p className="mt-4">ページが見つかりませんでした。</p>
      <Link href="/diagnosis" className="mt-6 inline-block rounded-full bg-[var(--rl-accent)] px-6 py-3 font-bold text-[var(--rl-on-accent)]">診断してみる</Link>
    </main>
  );
}
