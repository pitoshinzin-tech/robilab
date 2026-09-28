import Link from "next/link";

/**
 * 一時停止(suspended)・利用停止(banned)中のユーザーに表示する共通メッセージ。
 * /lobby, /lobby/inbox, /lobby/me で使う。
 */
export function AccountStatusNotice({ status }: { status: "suspended" | "banned" }) {
  return (
    <main className="mx-auto max-w-md px-4 py-10 text-center">
      <p>現在、アカウントが{status === "banned" ? "利用停止" : "一時停止"}中です。</p>
      <p className="mt-2 text-sm text-[var(--rl-muted)]">
        お問い合わせは <Link href="/terms" className="underline">利用規約</Link> の連絡先からお願いします。
      </p>
    </main>
  );
}
