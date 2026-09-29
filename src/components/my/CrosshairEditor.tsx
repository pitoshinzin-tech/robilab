"use client";
import { useEffect, useRef } from "react";
import { CROSSHAIR_COLORS, CROSSHAIR_LIMITS, CROSSHAIR_SHAPES, drawCrosshair, type Crosshair, type CrosshairShape } from "@/lib/crosshair";

const SHAPE_LABEL: Record<CrosshairShape, string> = { cross: "十字", dot: "点", circle: "円", "cross-dot": "十字+点" };

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="flex justify-between">{label}<b>{value}</b></span>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function CrosshairEditor({ value, onChange }: { value: Crosshair; onChange: (c: Crosshair) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.fillStyle = "#1b1f45";
    ctx.fillRect(0, 0, el.width, el.height);
    drawCrosshair(ctx, value, el.width / 2, el.height / 2);
  }, [value]);
  const L = CROSSHAIR_LIMITS;
  const set = (patch: Partial<Crosshair>) => onChange({ ...value, ...patch });
  return (
    <section className="grid gap-3 rounded-xl border border-white/10 bg-[var(--rl-surface)] p-4">
      <h2 className="font-bold">クロスヘア</h2>
      <canvas ref={canvas} width={160} height={120} className="justify-self-start rounded-lg" role="img" aria-label="クロスヘアのプレビュー" />
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="形">
        {CROSSHAIR_SHAPES.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={value.shape === s} onClick={() => set({ shape: s })}
            className={`h-10 rounded-full px-4 ${value.shape === s ? "bg-[var(--rl-accent)] text-[var(--rl-on-accent)]" : "bg-white/10"}`}>
            {SHAPE_LABEL[s]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="色">
        {CROSSHAIR_COLORS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={value.color.toLowerCase() === c} aria-label={c} onClick={() => set({ color: c })}
            className={`h-8 w-8 rounded-full border-2 ${value.color.toLowerCase() === c ? "border-white" : "border-transparent"}`} style={{ background: c }} />
        ))}
        <input type="color" value={value.color} aria-label="色を自分で選ぶ"
          onChange={(e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) set({ color: e.target.value }); }} />
      </div>
      <Slider label="線の長さ" value={value.length} min={L.lengthMin} max={L.lengthMax} onChange={(n) => set({ length: n })} />
      <Slider label="太さ" value={value.thickness} min={L.thicknessMin} max={L.thicknessMax} onChange={(n) => set({ thickness: n })} />
      <Slider label="中心の隙間" value={value.gap} min={L.gapMin} max={L.gapMax} onChange={(n) => set({ gap: n })} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value.outline} onChange={(e) => set({ outline: e.target.checked })} /> 縁取り
      </label>
    </section>
  );
}
