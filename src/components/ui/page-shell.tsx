import * as React from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_BACK, PAGE_VT_CLASSES } from "@/lib/motion/vt-names";

export type PageWidth = "narrow" | "wide";

/** ページの幅(narrow 640 / wide 1120 の中身+左右の余白)と上下の余白。タブバーの分の余白は body が持つ。 */
export function pageContainerClass(width: PageWidth): string {
  return cn("mx-auto w-full px-4 pt-6 pb-12 md:px-6 md:pb-16", width === "narrow" ? "max-w-[688px]" : "max-w-[1168px]");
}

/**
 * ページの枠。h1 は必ずここで出す。
 * (追補 S3)中身だけがスキャンラインで切り替わる。ページごとに置く必要があるので、レイアウトではなくここに置く
 * (レイアウトは入れ替わらないので enter / exit が起きない)。対応しないブラウザでは何も起きない。
 */
export function PageShell({ width = "narrow", title, description, back, subnav, actions, className, children }: {
  width?: PageWidth; title: React.ReactNode; description?: React.ReactNode; back?: { href: string; label: string };
  subnav?: React.ReactNode; actions?: React.ReactNode; className?: string; children: React.ReactNode;
}) {
  return (
    <ViewTransition enter={PAGE_VT_CLASSES} exit={PAGE_VT_CLASSES} default="none">
      <main className={cn(pageContainerClass(width), className)}>
        {subnav}
        {back && (
          <Link href={back.href} transitionTypes={[NAV_BACK]} className="-ml-2 mb-2 inline-flex h-11 items-center gap-1 rounded-rl-sm px-2 text-sm font-bold text-rl-muted hover:text-rl-text">
            <ChevronLeft aria-hidden className="size-5" />
            {back.label}
          </Link>
        )}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4 md:mb-8">
          <div className="grid min-w-0 gap-2">
            <h1 className="text-rl-title font-bold tracking-[0.01em] wrap-anywhere">{title}</h1>
            {description && <p className="max-w-[38em] text-base text-rl-muted text-balance [word-break:auto-phrase]">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
        </header>
        {children}
      </main>
    </ViewTransition>
  );
}
