"use client";
import type { ReactNode } from "react";
import { useAssemble } from "@/lib/motion/use-assemble";

/**
 * 結果の大きな絵の箱。直接開いたとき・View Transition がないブラウザだけ rl-assemble で組み上がる。
 * 絵(TypeIcon)はサーバーで作って children で渡す(16 タイプの文章をブラウザの JS に入れない)。
 */
export function ResultTypeIcon({ children }: { children: ReactNode }) {
  const assemble = useAssemble();
  return <div className={assemble ? "rl-assemble w-fit" : "w-fit"}>{children}</div>;
}
