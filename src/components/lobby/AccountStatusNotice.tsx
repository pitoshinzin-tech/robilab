import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";

/** 一時停止(suspended)・利用停止(banned)中のユーザーに表示する共通メッセージ。/lobby・/lobby/inbox・/lobby/me などで使う。 */
export function AccountStatusNotice({ status }: { status: "suspended" | "banned" }) {
  return (
    <PageShell title={`アカウントが${status === "banned" ? "利用停止" : "一時停止"}中です`}>
      <p className="text-base text-rl-muted">
        お問い合わせは <Link href="/terms" className="text-rl-accent underline underline-offset-4">利用規約</Link> の連絡先からお願いします。
      </p>
    </PageShell>
  );
}
