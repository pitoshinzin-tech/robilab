"use client";
import { LoginButton } from "@/components/lobby/LoginButton";
import { DeleteAccount } from "@/app/lobby/me/DeleteAccount";
import { buildXShareUrl } from "@/lib/share";
import type { SyncStatus } from "./useMySettings";

type Props = {
  loggedIn: boolean;
  slug: string | null;
  status: SyncStatus;
  serverError: string | null;
  canPublish: boolean;
  onPublic: (on: boolean) => void;
  onRemove: () => void;
};

const STATUS_TEXT: Record<SyncStatus, string> = {
  local: "この端末に保存しています。",
  memory: "この端末には保存されません(ブラウザの設定で保存が止められています)。",
  saving: "サーバーに保存中…",
  synced: "スマホと PC で共有しています。",
  "server-error": "",
};

export function SyncPanel({ loggedIn, slug, status, serverError, canPublish, onPublic, onRemove }: Props) {
  const pageUrl = slug && typeof window !== "undefined" ? `${window.location.origin}/c/${slug}` : null;
  return (
    <section className="grid gap-3 rounded-xl border border-[var(--rl-border)] bg-[var(--rl-surface)] p-4 text-sm">
      <p>{serverError ?? STATUS_TEXT[status]}</p>
      {!loggedIn ? (
        <div className="grid gap-2">
          <p className="text-[var(--rl-muted)]">Discord でログインすると、スマホと PC で共有でき、名刺を URL で公開できます。</p>
          <div><LoginButton next="/my" /></div>
        </div>
      ) : (
        <div className="grid gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={Boolean(slug)} disabled={!canPublish} onChange={(e) => onPublic(e.target.checked)} />
            名刺を公開する(URL を知っている人が見られます)
          </label>
          {pageUrl && (
            <div className="grid gap-2">
              <a href={pageUrl} className="break-all text-[var(--rl-cyan)] underline">{pageUrl}</a>
              <a href={buildXShareUrl("わたしのゲーム設定 #ロビラボ", pageUrl)} target="_blank" rel="noopener" className="justify-self-start rounded-full bg-[var(--rl-cyan)] px-6 py-3 font-bold text-[#0a0c16]">
                X でシェア
              </a>
            </div>
          )}
          <DeleteAccount />
        </div>
      )}
      <button type="button" onClick={() => { if (confirm("マイ設定を消します(この端末とサーバーの両方)。よろしいですか?")) onRemove(); }}
        className="justify-self-start text-[var(--rl-muted)] underline">
        設定を消す
      </button>
    </section>
  );
}
