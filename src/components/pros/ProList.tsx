"use client";
import Link from "next/link";
import { ExternalLink, Users } from "lucide-react";
import type { ProSetting } from "@/data/pros";
import { proCm, proEdpi } from "@/lib/pro-match";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { mouseLabel } from "./ProCard";

function Mouse({ p }: { p: ProSetting }) {
  const m = mouseLabel(p);
  if (!m) return <span className="text-rl-muted">—</span>;
  return m.href ? <Link href={m.href} className="text-rl-accent underline">{m.text}</Link> : <span>{m.text}</span>;
}

function Source({ p }: { p: ProSetting }) {
  return (
    <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-rl-accent underline">
      出典<span className="text-sm text-rl-muted">{p.checkedAt.slice(0, 7)} 確認</span>
      <ExternalLink aria-hidden className="size-4 shrink-0" />
    </a>
  );
}

/** ゲームごとの一覧。PC は表、スマホはカード。 */
export function ProList({ pros }: { pros: ProSetting[] }) {
  if (pros.length === 0) return <EmptyState icon={Users} title="準備中です。" description="ほかのゲームを選ぶか、しばらくしてから見てください。" />;
  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead className="text-sm text-rl-muted">
            <tr><th className="py-2">選手</th><th>チーム</th><th>DPI</th><th>感度</th><th>eDPI</th><th>振り向き</th><th>マウス</th><th><span className="sr-only">出典</span></th></tr>
          </thead>
          <tbody>
            {pros.map((p) => (
              <tr key={p.id} className="border-t border-rl-line">
                <td className="py-2 font-bold">{p.name}</td>
                <td>{p.team ?? "—"}</td>
                <td className="tabular-nums">{p.dpi}</td>
                <td className="tabular-nums">{p.sens}</td>
                <td className="tabular-nums">{proEdpi(p)}</td>
                <td className="font-display tabular-nums text-rl-highlight">{proCm(p)}cm</td>
                <td><Mouse p={p} /></td>
                <td><Source p={p} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-2 sm:hidden">
        {pros.map((p) => (
          <Card as="li" key={p.id} className="grid gap-1 text-sm">
            <div className="flex min-w-0 flex-wrap justify-between gap-x-2"><span className="min-w-0 font-bold wrap-anywhere">{p.name}</span><span className="text-sm text-rl-muted">{p.team ?? ""}</span></div>
            <div>振り向き <span className="font-display tabular-nums text-rl-highlight">{proCm(p)}cm</span> ・ DPI {p.dpi} ・ 感度 {p.sens} ・ eDPI {proEdpi(p)}</div>
            <div className="wrap-anywhere">マウス:<Mouse p={p} /></div>
            <div><Source p={p} /></div>
          </Card>
        ))}
      </ul>
    </>
  );
}
