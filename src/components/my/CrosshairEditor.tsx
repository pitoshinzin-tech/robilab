"use client";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { CROSSHAIR_COLORS, CROSSHAIR_LIMITS, CROSSHAIR_SHAPES, drawCrosshair, type Crosshair, type CrosshairShape } from "@/lib/crosshair";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { CheckChip, ChipButton, ChipButtonGroup } from "@/components/ui/chip-button";
import { SectionHeading } from "@/components/ui/section-heading";

const SHAPE_LABEL: Record<CrosshairShape, string> = { cross: "十字", dot: "点", circle: "円", "cross-dot": "十字+点" };
/** 色の丸の読み上げの名前(CROSSHAIR_COLORS と同じ並び) */
const COLOR_NAME: Record<string, string> = {
  "#39f3ff": "シアン", "#ff4fd8": "マゼンタ", "#7b61ff": "パープル", "#b6ff3b": "ライム",
  "#ffffff": "白", "#ffe14d": "黄", "#ff6b6b": "赤", "#4dff88": "緑",
};

function Slider({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold">{label}</label>
        <span aria-hidden className="text-sm font-bold tabular-nums text-rl-highlight">{value}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full cursor-pointer accent-rl-selected" />
    </div>
  );
}

export function CrosshairEditor({ value, onChange }: { value: Crosshair; onChange: (c: Crosshair) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // 色の丸を押したあとだけ Check を線で引く(開いたときに選ばれている色は動かない)
  const [colorTouched, setColorTouched] = useState(false);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--rl-bg-glow").trim() || "#1b1f45";
    ctx.fillRect(0, 0, el.width, el.height);
    drawCrosshair(ctx, value, el.width / 2, el.height / 2);
  }, [value]);
  const L = CROSSHAIR_LIMITS;
  const set = (patch: Partial<Crosshair>) => onChange({ ...value, ...patch });
  const color = value.color.toLowerCase();
  return (
    <Card as="section" aria-labelledby="my-crosshair" className="grid gap-4">
      {/* クロスヘアは初めから値があるので、埋まり具合(Check・まだ)は出さない */}
      <div className="border-b border-rl-line pb-3">
        <SectionHeading id="my-crosshair" title="クロスヘア" />
      </div>
      <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start">
        <canvas ref={canvas} width={160} height={120} className="rounded-rl-sm border border-rl-line" role="img" aria-label="クロスヘアのプレビュー" />
        <div className="grid min-w-0 gap-4">
          <div className="grid gap-2">
            <p aria-hidden className="text-sm font-bold">形</p>
            <ChipButtonGroup label="形">
              {CROSSHAIR_SHAPES.map((s) => (
                <ChipButton key={s} pressed={value.shape === s} onClick={() => set({ shape: s })}>{SHAPE_LABEL[s]}</ChipButton>
              ))}
            </ChipButtonGroup>
          </div>
          <div className="grid gap-2">
            <p aria-hidden className="text-sm font-bold">色</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <ChipButtonGroup label="色" className="gap-1">
                {CROSSHAIR_COLORS.map((c) => {
                  const on = color === c;
                  return (
                    <button key={c} type="button" aria-pressed={on} aria-label={COLOR_NAME[c] ?? c} title={COLOR_NAME[c] ?? c}
                      data-rl-touched={colorTouched || undefined} onClick={() => { setColorTouched(true); set({ color: c }); }}
                      className="group/sw relative grid size-11 cursor-pointer place-items-center rounded-rl-pill border-2 border-transparent transition-[border-color,transform] duration-(--rl-dur-fast) ease-rl-out hover:border-rl-line-strong active:translate-y-px aria-pressed:border-rl-selected">
                      <span aria-hidden className="size-8 rounded-rl-pill border border-rl-line-strong" style={{ background: c }} />
                      {on && <Check aria-hidden strokeWidth={3} className={cn("rl-draw-check absolute size-4", c === "#7b61ff" ? "text-rl-text" : "text-rl-bg")} />}
                    </button>
                  );
                })}
              </ChipButtonGroup>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                <input type="color" value={value.color} className="h-11 w-14 cursor-pointer rounded-rl-sm border border-rl-line-strong bg-rl-surface-2"
                  onChange={(e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) set({ color: e.target.value }); }} />
                自分で選ぶ
              </label>
            </div>
          </div>
        </div>
      </div>
      <Slider id="ch-length" label="線の長さ" value={value.length} min={L.lengthMin} max={L.lengthMax} onChange={(n) => set({ length: n })} />
      <Slider id="ch-thickness" label="太さ" value={value.thickness} min={L.thicknessMin} max={L.thicknessMax} onChange={(n) => set({ thickness: n })} />
      <Slider id="ch-gap" label="中心の隙間" value={value.gap} min={L.gapMin} max={L.gapMax} onChange={(n) => set({ gap: n })} />
      <div className="flex"><CheckChip checked={value.outline} onChange={(e) => set({ outline: e.target.checked })}>縁取り</CheckChip></div>
    </Card>
  );
}
