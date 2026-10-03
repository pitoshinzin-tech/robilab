import type { ReactNode } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { chipClassName } from "./chip-style";

/**
 * 絞り込みのチップをリンクで(URL の ?… を変える。サーバーで絞るので JS を足さない)。選んでいるものは aria-current="true" とチェック。
 * チェックを線で引く動き(rl-draw-check)は付けない(押すとページが入れ替わるので、自動で動くものを足さない)。
 */
export function ChipLink({ href, current, children, className }: { href: string; current: boolean; children: ReactNode; className?: string }) {
  return (
    <Link href={href} scroll={false} aria-current={current ? "true" : undefined}
      className={cn(chipClassName, "aria-[current=true]:border-rl-selected aria-[current=true]:bg-rl-selected-bg", className)}>
      {current && <Check aria-hidden className="size-4 shrink-0" />}
      {children}
    </Link>
  );
}
