"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crosshair, FlaskConical, Mouse, UserRound, Users, type LucideIcon } from "lucide-react";
import { NAV_TABS, activeTabId, type NavTabId } from "@/lib/nav";
import { isTextEntry } from "@/lib/text-entry";
import { VT_TAB_BAR } from "@/lib/motion/vt-names";

const ICONS: Record<NavTabId, LucideIcon> = { aim: Crosshair, diagnosis: FlaskConical, mouse: Mouse, lobby: Users, my: UserRound };

// 入力中(キーボードが開く)と全画面のあいだは隠す。focusout の直後は activeElement がまだ変わっていないので、次の番で読み直す。
function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const later = () => { clearTimeout(timer); timer = setTimeout(onChange, 0); };
  document.addEventListener("focusin", onChange);
  document.addEventListener("focusout", later);
  document.addEventListener("fullscreenchange", onChange);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("focusin", onChange);
    document.removeEventListener("focusout", later);
    document.removeEventListener("fullscreenchange", onChange);
  };
}

function hiddenNow(): boolean {
  const el = document.activeElement;
  const entry = el instanceof HTMLElement ? { tagName: el.tagName, type: el.getAttribute("type"), isContentEditable: el.isContentEditable } : null;
  return document.fullscreenElement !== null || isTextEntry(entry);
}

/** 768px 未満の下のタブバー。今いるタブはパープルの線(シアンにしない)。トップ(/)ではどれにも印を付けない。 */
export function BottomTabBar() {
  const active = activeTabId(usePathname());
  const hidden = useSyncExternalStore(subscribe, hiddenNow, () => false);
  return (
    <nav
      aria-label="メイン"
      inert={hidden}
      data-hidden={hidden || undefined}
      // (追補 S3)ページが切り替わる間もタブバーは動かない(場所の目印を残す)
      style={{ viewTransitionName: VT_TAB_BAR }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rl-line bg-rl-surface pb-[env(safe-area-inset-bottom)] shadow-rl-float transition-transform duration-(--rl-dur-base) ease-rl-out data-[hidden]:translate-y-full md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {NAV_TABS.map((t) => {
          const Icon = ICONS[t.id];
          return (
            <li key={t.id}>
              <Link
                href={t.href}
                aria-current={active === t.id ? "page" : undefined}
                className="relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-bold text-rl-muted before:absolute before:inset-x-3 before:top-0 before:h-[3px] before:bg-transparent aria-[current=page]:text-rl-text aria-[current=page]:before:bg-rl-selected"
              >
                <Icon aria-hidden className="size-6" />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
