import { HAND_ART_PATHS, fitOverlay } from "@/lib/fit-overlay";

/**
 * 追補 6 章:実寸の重ね図。自分の手(線)と、選んだマウス(パープルの面)を同じ縮尺で重ねる。数字だけより一目で「合う」が分かる。
 * マウスを替えると、面が 200ms で入れ替わる(key を替えて rl-fit-swap)。
 * 動きの参考 012(Stroke-Draw):手の輪郭は、図が出たとき 1 回だけ線として引かれる(rl-stroke-draw。pathLength=1 の stroke-dashoffset)。
 * マウスを替えても手は描き直さない。動きを減らす設定では描き終わった形で出る(globals.css)。
 */
export function FitOverlay({ handLengthCm, handWidthCm, mouse }: {
  handLengthCm: number; handWidthCm: number | null; mouse: { id: string; name: string; lengthMm: number; widthMm: number };
}) {
  const g = fitOverlay(handLengthCm, handWidthCm, mouse.lengthMm, mouse.widthMm);
  const label = `手の長さ ${handLengthCm}cm と、${mouse.name}(長さ ${mouse.lengthMm}mm・幅 ${mouse.widthMm}mm)を同じ縮尺で重ねた図`;
  return (
    <figure className="grid gap-2">
      <svg viewBox={g.viewBox} role="img" aria-label={label} className="mx-auto h-56 w-auto max-w-full">
        <rect key={mouse.id} className="rl-fit-swap" x={g.mouse.x} y={g.mouse.y} width={g.mouse.width} height={g.mouse.height} rx={g.mouse.rx}
          fill="var(--rl-selected-bg)" stroke="var(--rl-secondary-text)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {/* 手の線は面の上に重ねる(マウスに隠れず、指先・手首とマウスの端の位置が比べられる) */}
        <g transform={g.handTransform} fill="none" stroke="var(--rl-muted)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
          {HAND_ART_PATHS.map((d) => <path key={d} d={d} pathLength={1} className="rl-stroke-draw" style={{ animationDuration: "400ms" }} />)}
        </g>
      </svg>
      <figcaption className="text-sm text-rl-muted">
        同じ縮尺で、あなたの手(線)と <span data-long-name className="font-bold text-rl-text wrap-anywhere">{mouse.name}</span>(面)を重ねた図
      </figcaption>
    </figure>
  );
}
