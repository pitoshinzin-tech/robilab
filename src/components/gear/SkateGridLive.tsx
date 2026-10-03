"use client";

import { useEffect, useState } from "react";
import { skateGridFromSource, type SkateGridSource } from "@/lib/skate-grid";
import { SkateGrid } from "@/components/gear/SkateGrid";

/**
 * マス「このマウスに使えるソール」を、選ぶ欄(<select id={selectId}>)を変えたら送る前に描き直す(触ると答える)。
 * 数は source(サーバーで作った数だけ)から作る。最初の描画はサーバーの SkateGrid と同じなので、JS が無いときは今までどおり送れば変わる。
 * 一覧はサーバーで絞るので「このマウスで絞り込む」は残す。動きは付けない(マスは塗り替わるだけ)。
 * ページを読み直したら key で作り直す(選んだ値を捨てて、サーバーの値から始める)。
 */
export function SkateGridLive({ selectId, source, mouseId, mouseName }: {
  selectId: string; source: SkateGridSource; mouseId: string | null; mouseName: string | null;
}) {
  const [pick, setPick] = useState({ id: mouseId, name: mouseName });
  useEffect(() => {
    const onChange = (e: Event) => {
      const t = e.target;
      if (!(t instanceof HTMLSelectElement) || t.id !== selectId) return;
      const o = t.selectedOptions[0];
      const brand = o?.parentElement instanceof HTMLOptGroupElement ? `${o.parentElement.label} ` : "";
      // 選択肢の文字は「名前(N 件)」。件数は読み上げの名前に要らない
      setPick(t.value === "" || !o ? { id: null, name: null } : { id: t.value, name: `${brand}${o.text.replace(/(\d+ 件)$/, "")}` });
    };
    document.addEventListener("change", onChange);
    return () => document.removeEventListener("change", onChange);
  }, [selectId]);
  return <SkateGrid grid={skateGridFromSource(source, pick.id)} mouseName={pick.name} live />;
}
