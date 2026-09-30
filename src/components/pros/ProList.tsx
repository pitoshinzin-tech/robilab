"use client";
import Link from "next/link";
import type { ProSetting } from "@/data/pros";
import { proCm, proEdpi } from "@/lib/pro-match";
import { mouseLabel } from "./ProCard";

function Mouse({ p }: { p: ProSetting }) {
  const m = mouseLabel(p);
  if (!m) return <span className="text-[var(--rl-muted)]">—</span>;
  return m.href ? <Link href={m.href} className="underline">{m.text}</Link> : <span>{m.text}</span>;
}

function Source({ p }: { p: ProSetting }) {
  return (
    <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
      出典<span className="ml-1 text-xs text-[var(--rl-muted)]">{p.checkedAt.slice(0, 7)} 確認</span>
    </a>
  );
}

/** ゲームごとの一覧。PC は表、スマホはカード。 */
export function ProList({ pros }: { pros: ProSetting[] }) {
  if (pros.length === 0) return <p className="rounded-2xl bg-white/5 p-4 text-sm">準備中です。</p>;
  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-[var(--rl-muted)]">
            <tr><th className="py-2">選手</th><th>チーム</th><th>DPI</th><th>感度</th><th>eDPI</th><th>振り向き</th><th>マウス</th><th></th></tr>
          </thead>
          <tbody>
            {pros.map((p) => (
              <tr key={p.id} className="border-t border-white/10">
                <td className="py-2 font-bold">{p.name}</td>
                <td>{p.team ?? "—"}</td>
                <td>{p.dpi}</td>
                <td>{p.sens}</td>
                <td>{proEdpi(p)}</td>
                <td className="text-[var(--rl-highlight)]">{proCm(p)}cm</td>
                <td><Mouse p={p} /></td>
                <td><Source p={p} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-2 sm:hidden">
        {pros.map((p) => (
          <li key={p.id} className="grid gap-1 rounded-xl border border-white/10 bg-[var(--rl-card)] p-3 text-sm">
            <div className="flex justify-between"><span className="font-bold">{p.name}</span><span className="text-xs text-[var(--rl-muted)]">{p.team ?? ""}</span></div>
            <div>振り向き <span className="text-[var(--rl-highlight)]">{proCm(p)}cm</span> ・ DPI {p.dpi} ・ 感度 {p.sens} ・ eDPI {proEdpi(p)}</div>
            <div className="text-xs">マウス:<Mouse p={p} /></div>
            <div className="text-xs"><Source p={p} /></div>
          </li>
        ))}
      </ul>
    </>
  );
}
