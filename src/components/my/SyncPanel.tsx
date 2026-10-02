"use client";
import { Check, Share2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginButton } from "@/components/lobby/LoginButton";
import { buildXShareUrl } from "@/lib/share";
import { ButtonAnchor } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import type { SyncStatus } from "./useMySettings";

type Props = {
  loggedIn: boolean;
  slug: string | null;
  status: SyncStatus;
  serverError: string | null;
  canPublish: boolean;
  /** 入力に誤りがある欄があるか(あるあいだは保存していない) */
  hasErrors: boolean;
  onPublic: (on: boolean) => void;
};

const STATUS_TEXT: Record<SyncStatus, string> = {
  local: "この端末に保存しています。",
  memory: "この端末には保存されません(ブラウザの設定で保存が止められています)。",
  saving: "サーバーに保存中…",
  synced: "スマホと PC で共有しています。",
  "server-error": "",
};

const INVALID_TEXT = "入力に誤りがある欄があるため、保存していません。赤い表示の欄を直してください。";

/** 保存の状態・ログイン・名刺の公開。消す操作は持たない(ページの一番下の DangerZone)。 */
export function SyncPanel({ loggedIn, slug, status, serverError, canPublish, hasErrors, onPublic }: Props) {
  const pageUrl = slug && typeof window !== "undefined" ? `${window.location.origin}/c/${slug}` : null;
  const text = hasErrors ? INVALID_TEXT : (serverError ?? STATUS_TEXT[status]);
  const warn = hasErrors || Boolean(serverError) || status === "memory";
  const ok = !warn && status === "synced";
  const tone = hasErrors ? "text-rl-danger" : warn ? "text-rl-warning" : ok ? "text-rl-success" : "text-rl-text";
  const Icon = ok ? Check : warn ? TriangleAlert : null;
  return (
    <Card as="section" aria-labelledby="my-sync" className="grid gap-4">
      <h2 id="my-sync" className="text-xl font-bold">保存と公開</h2>
      <p role="status" className={cn("flex items-start gap-2 text-sm [word-break:auto-phrase]", tone)}>
        {Icon && <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />}
        <span className="min-w-0">{text}</span>
      </p>
      {!loggedIn ? (
        <div className="grid gap-4 border-t border-rl-line pt-4">
          <p className="text-sm text-rl-muted [word-break:auto-phrase]">Discord でログインすると、スマホと PC で共有でき、名刺を URL で公開できます。</p>
          <LoginButton next="/my" className="justify-self-start" />
        </div>
      ) : (
        <div className="grid gap-4 border-t border-rl-line pt-4">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-45">
            <input type="checkbox" className="size-5 shrink-0 cursor-pointer accent-rl-selected disabled:cursor-not-allowed" checked={Boolean(slug)} disabled={!slug && !canPublish} onChange={(e) => onPublic(e.target.checked)} />
            <span className="min-w-0 [word-break:auto-phrase]">名刺を公開する(URL を知っている人が見られます)</span>
          </label>
          {pageUrl && (
            <div className="grid gap-4">
              <a href={pageUrl} className="min-w-0 break-all text-sm text-rl-accent underline underline-offset-4">{pageUrl}</a>
              <ButtonAnchor href={buildXShareUrl("わたしのゲーム設定 #ロビラボ", pageUrl)} target="_blank" rel="noopener" variant="secondary" size="sm" className="justify-self-start">
                <Share2 aria-hidden />X でシェア
              </ButtonAnchor>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
