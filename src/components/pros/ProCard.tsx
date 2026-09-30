import Link from "next/link";
import type { ProSetting } from "@/data/pros";
import { DEVICES } from "@/data/devices";
import { mouseById } from "@/data/mice";
import { getSensGame } from "@/data/sensitivity";
import { diffText, type NearPro } from "@/lib/pro-match";

/** プロのマウスの表示。マウス探しのデータにあれば /mouse へのリンク。 */
export function mouseLabel(p: ProSetting): { text: string; href: string | null } | null {
  if (p.mouse) {
    const d = DEVICES.find((x) => x.id === p.mouse);
    if (!d) return null;
    return { text: `${d.brand} ${d.name}`, href: mouseById(p.mouse) ? "/mouse" : null };
  }
  return p.mouseName ? { text: p.mouseName, href: null } : null;
}

/** 近いプロのカード。 */
export function ProCard({ item, userCm }: { item: NearPro; userCm: number }) {
  const { pro, cm } = item;
  const mouse = mouseLabel(pro);
  return (
    <li className="grid gap-1 rounded-2xl border border-white/10 bg-[var(--rl-card)] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-bold">{pro.name}</p>
        <p className="text-xs text-[var(--rl-muted)]">{getSensGame(pro.game)!.name}{pro.team && ` ・ ${pro.team}`}</p>
      </div>
      <p className="text-sm">
        振り向き <span className="font-bold text-[var(--rl-highlight)]">{cm}cm</span>
        <span className="ml-2 text-xs text-[var(--rl-secondary)]">{diffText(cm, userCm)}</span>
      </p>
      <p className="text-xs text-[var(--rl-muted)]">DPI {pro.dpi} ・ 感度 {pro.sens}</p>
      {mouse && (
        <p className="text-xs text-[var(--rl-muted)]">
          マウス:{mouse.href ? <Link href={mouse.href} className="underline">{mouse.text}</Link> : mouse.text}
        </p>
      )}
      <a href={pro.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline text-[var(--rl-muted)]">出典({pro.checkedAt.slice(0, 7)} 確認)</a>
    </li>
  );
}
