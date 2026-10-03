import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * lg 未満の畳んだ絞り込み(/pads・/skates。/mouse と同じふるまい)。summary に今の条件の数。lg 以上は左の列の箱を使うので出さない。
 * 開け閉めはすぐ切り替わる(矢印の回転だけ。自動の動きは足さない)。
 */
export function FilterDisclosure({ count, children }: { count: number; children: ReactNode }) {
  return (
    <details className="group rounded-rl-md border border-rl-line bg-rl-surface lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-bold [&::-webkit-details-marker]:hidden">
        <span>絞り込み<span className="ml-2 font-normal text-rl-muted">{count > 0 ? `${count} つの条件で絞り込み中` : "すべて表示中"}</span></span>
        <ChevronDown aria-hidden className="size-5 shrink-0 transition-transform duration-(--rl-dur-base) group-open:rotate-180" />
      </summary>
      <div className="grid gap-4 p-4 pt-0">{children}</div>
    </details>
  );
}
