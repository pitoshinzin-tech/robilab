import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { ProSetting } from "@/data/pros";
import { DEVICES } from "@/data/devices";
import { MICE_IDS } from "@/data/mice-ids";
import { getSensGame } from "@/data/sensitivity";
import { diffText, type NearPro } from "@/lib/pro-match";

/** プロのマウスの表示。マウス探しのデータにあれば /mouse へのリンク。 */
export function mouseLabel(p: ProSetting): { text: string; href: string | null } | null {
  if (p.mouse) {
    const d = DEVICES.find((x) => x.id === p.mouse);
    if (!d) return null;
    return { text: `${d.brand} ${d.name}`, href: MICE_IDS.includes(p.mouse) ? "/mouse" : null };
  }
  return p.mouseName ? { text: p.mouseName, href: null } : null;
}

/**
 * 近いプロの行。箱(Card)にはしない:/pros では「あなたに近いプロ」のカードの中に並ぶので、カードの中にカードを入れない
 * (区切りは上の border-rl-line の線)。感度計算の「この感度に近いプロ」でも同じ形。
 */
export function ProCard({ item, userCm }: { item: NearPro; userCm: number }) {
  const { pro, cm } = item;
  const mouse = mouseLabel(pro);
  return (
    <li className="grid min-w-0 content-start gap-1 border-t border-rl-line pt-4">
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2">
        <p className="min-w-0 font-bold wrap-anywhere">{pro.name}</p>
        <p className="text-sm text-rl-muted">{getSensGame(pro.game)!.name}{pro.team && ` ・ ${pro.team}`}</p>
      </div>
      <p className="text-sm">
        振り向き <span className="font-display tabular-nums text-rl-highlight">{cm}cm</span>
        <span className="ml-2 text-sm text-rl-secondary-text">{diffText(cm, userCm)}</span>
      </p>
      <p className="text-sm text-rl-muted">DPI {pro.dpi} ・ 感度 {pro.sens}</p>
      {mouse && (
        <p className="text-sm text-rl-muted wrap-anywhere">
          マウス:{mouse.href ? <Link href={mouse.href} className="text-rl-accent underline">{mouse.text}</Link> : mouse.text}
        </p>
      )}
      <a href={pro.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 justify-self-start text-sm text-rl-accent underline">
        出典({pro.checkedAt.slice(0, 7)} 確認)
        <ExternalLink aria-hidden className="size-4 shrink-0" />
      </a>
    </li>
  );
}
