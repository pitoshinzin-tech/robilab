import type { SkateSpec } from "@/data/gear-types";
import type { SkateView } from "@/lib/skate-match";

/**
 * マス「このマウスに使えるソール」の計算(アートディレクション:マスの言葉)。1 製品 = 1 マス。
 * 機種専用の形は面(塗り)、汎用のドットは線の四角。マウスを選んだら「そのマウスの専用 → 汎用のドット」、選ばなければブランドの順。
 * マウスを選んだときは汎用のドットを新しい段から始める。絞り込みのあとの数だけ並べる(上の数字と同じ)。単位は px(SVG はこの大きさのまま描く)。
 */
export const SKATE_CELL = { sizePx: 16, gapPx: 8, columns: 10, strokePx: 2 } as const;

export type SkateCellKind = "dedicated" | "universal";

/** 汎用(線)= ドットで、どのマウスにも結び付いていないもの(skateView の汎用と同じ)。ほかは専用(面) */
export function skateCellKind(s: Pick<SkateSpec, "shape" | "mouseIds">): SkateCellKind {
  return s.shape === "dot" && s.mouseIds.length === 0 ? "universal" : "dedicated";
}

export type SkateCell = { id: string; kind: SkateCellKind; x: number; y: number };
export type SkateGridModel = { mode: "mouse" | "all"; cells: SkateCell[]; dedicated: number; universal: number; width: number; height: number };

export function skateGrid(view: SkateView): SkateGridModel {
  const items: { id: string; kind: SkateCellKind }[] = view.kind === "mouse"
    ? [...view.dedicated.map((s) => ({ id: s.id, kind: "dedicated" as const })), ...view.universal.map((s) => ({ id: s.id, kind: "universal" as const }))]
    : view.groups.flatMap((g) => g.items.map((s) => ({ id: s.id, kind: skateCellKind(s) })));
  const step = SKATE_CELL.sizePx + SKATE_CELL.gapPx;
  // マウスを選んだときは、汎用のドットを新しい段から始める(専用の面と線の 2 つのまとまりに見えるように)
  const breakAt = view.kind === "mouse" && view.dedicated.length > 0 ? view.dedicated.length : -1;
  const offset = breakAt > 0 && breakAt % SKATE_CELL.columns !== 0 ? SKATE_CELL.columns - (breakAt % SKATE_CELL.columns) : 0;
  const cells = items.map((c, i) => {
    const slot = breakAt > 0 && i >= breakAt ? i + offset : i;
    return { ...c, x: (slot % SKATE_CELL.columns) * step, y: Math.floor(slot / SKATE_CELL.columns) * step };
  });
  const slots = items.length === 0 ? 0 : (items.length > breakAt && breakAt > 0 ? items.length + offset : items.length);
  const cols = Math.min(slots, SKATE_CELL.columns);
  const rows = Math.ceil(slots / SKATE_CELL.columns);
  return {
    mode: view.kind,
    cells,
    dedicated: items.filter((c) => c.kind === "dedicated").length,
    universal: items.filter((c) => c.kind === "universal").length,
    width: cols === 0 ? 0 : cols * step - SKATE_CELL.gapPx,
    height: rows === 0 ? 0 : rows * step - SKATE_CELL.gapPx,
  };
}

/** マスの意味を言葉で(role="img" の aria-label) */
export function skateGridLabel(g: SkateGridModel, mouseName: string | null): string {
  const total = g.dedicated + g.universal;
  if (g.mode === "mouse") {
    return `${mouseName ?? "選んだマウス"} に使えるソール ${total} 件のマス:このマウス専用 ${g.dedicated} 件(塗りのマス)、汎用のドット ${g.universal} 件(線のマス)`;
  }
  return `載っているソール ${total} 件のマス(ブランドの順):機種専用の形 ${g.dedicated} 件(塗りのマス)、汎用のドット ${g.universal} 件(線のマス)`;
}
