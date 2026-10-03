import { SKATE_CELL, skateGridLabel, type SkateCellKind, type SkateGridModel } from "@/lib/skate-grid";
import { cn } from "@/lib/utils";

const S = SKATE_CELL.sizePx;
const W = SKATE_CELL.strokePx;

/** 1 マス(16px)。専用 = 面(--rl-selected)、汎用 = 線の四角(--rl-line-strong。線の太さの分だけ内側に描いて 16px にそろえる) */
function Cell({ kind, x = 0, y = 0 }: { kind: SkateCellKind; x?: number; y?: number }) {
  return kind === "dedicated"
    ? <rect x={x} y={y} width={S} height={S} fill="var(--rl-selected)" />
    : <rect x={x + W / 2} y={y + W / 2} width={S - W} height={S - W} fill="none" stroke="var(--rl-line-strong)" strokeWidth={W} />;
}

/** 行の印・凡例のマス 1 つ(飾り。意味は隣の文字で伝える) */
export function SkateCellMark({ kind, className }: { kind: SkateCellKind; className?: string }) {
  return (
    <svg aria-hidden="true" width={S} height={S} viewBox={`0 0 ${S} ${S}`} className={cn("inline-block shrink-0", className)}>
      <Cell kind={kind} />
    </svg>
  );
}

/**
 * マス「このマウスに使えるソール」(サーバーの部品・JS 0)。1 製品 = 1 マス。
 * 選んだマウスの専用は面、どのマウスにも使える汎用のドットは線。選ばないときは全製品をブランドの順に。
 * マウスを選び直す・絞り込むと、マスの数と塗りが変わる。/skates では SkateGridLive が包み、選ぶ欄を変えたら送る前に描き直す。
 * live:描き直す所で使うとき true(下の「専用 N・汎用 M」を aria-live で読み上げる)。
 */
export function SkateGrid({ grid, mouseName, live = false }: { grid: SkateGridModel; mouseName: string | null; live?: boolean }) {
  return (
    <figure className="grid content-start gap-3">
      {grid.cells.length > 0 && (
        <svg role="img" aria-label={skateGridLabel(grid, mouseName)} width={grid.width} height={grid.height} viewBox={`0 0 ${grid.width} ${grid.height}`} className="block max-w-full">
          {grid.cells.map((c) => <Cell key={c.id} kind={c.kind} x={c.x} y={c.y} />)}
        </svg>
      )}
      <figcaption aria-live={live ? "polite" : undefined} className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-2">
          <SkateCellMark kind="dedicated" />{grid.mode === "mouse" ? "専用" : "機種専用の形"}
          <span className="text-base font-bold tabular-nums text-rl-highlight">{grid.dedicated}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <SkateCellMark kind="universal" />汎用のドット
          <span className="text-base font-bold tabular-nums text-rl-highlight">{grid.universal}</span>
        </span>
      </figcaption>
    </figure>
  );
}
