"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AimChar } from "@/lib/aim/daily";
import { applyMouse, aimPoint, projectPoint, type Point, type View } from "@/lib/aim/view";
import { parsePath, toStroke } from "@/lib/aim/path";
import { initialTrace, stepTrace, traceResult, START_RADIUS, TOLERANCE, type TraceState } from "@/lib/aim/trace";
import { reduceAim, canStepTrace, type AimPhase, type AimEvent } from "@/lib/aim/game-state";
import { drawCrosshair, type Crosshair } from "@/lib/crosshair";

type Result = { accuracy: number; timeMs: number; perStroke: number[] };
type Props = { char: AimChar; degPerCount: number; crosshair: Crosshair; onFinish: (r: Result) => void; onAbort: () => void };

const COUNTDOWN_MS = 3000;
const UNSUPPORTED = "このブラウザでは遊べません。Chrome / Edge / Firefox をお使いください。";

/** CSS の役割の色を読む(Canvas では var() が使えないため)。 */
function roleColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function AimGame({ char, degPerCount, crosshair, onFinish, onAbort }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<AimPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const phaseRef = useRef<AimPhase>("idle");
  const view = useRef<View>({ yaw: 0, pitch: 0 });
  const trace = useRef<TraceState>(initialTrace());
  const trail = useRef<Point[]>([]);
  const countdownEnd = useRef(0);
  const strokes = useMemo(() => char.strokes.map((d) => toStroke(parsePath(d))), [char]);

  const dispatch = (e: AimEvent): AimPhase => {
    const next = reduceAim(phaseRef.current, e);
    phaseRef.current = next;
    setPhase(next);
    return next;
  };
  // コールバックと dispatch は effect の中で最新を読む(ref は effect 内でだけ更新・参照する)
  const latest = useRef({ dispatch, onFinish, onAbort });
  useEffect(() => {
    latest.current = { dispatch, onFinish, onAbort };
  });

  // ポインターロックの出入りとマウスの動き
  useEffect(() => {
    const el = canvas.current!;
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      view.current = applyMouse(view.current, e.movementX, e.movementY, degPerCount);
    };
    const onLockChange = () => {
      if (document.pointerLockElement !== el && latest.current.dispatch("lost") === "aborted") latest.current.onAbort();
    };
    const onLockError = () => setError(UNSUPPORTED);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("pointerlockerror", onLockError);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("pointerlockerror", onLockError);
    };
  }, [degPerCount]);

  // 描画と判定のループ
  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext("2d")!;
    const colors = {
      bg: roleColor("--rl-bg", "#0a0c16"),
      pending: roleColor("--rl-secondary", "#7b61ff"),
      current: roleColor("--rl-accent", "#39f3ff"),
      trail: roleColor("--rl-tertiary", "#b6ff3b"),
      miss: roleColor("--rl-danger", "#ff6b6b"),
      text: roleColor("--rl-text", "#eaf6ff"),
    };
    let raf = 0;
    const frame = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = el.clientWidth, h = el.clientHeight;
      if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, w, h);
      const v = view.current;
      const p = aimPoint(v);
      const ph = phaseRef.current;
      if (ph === "countdown" && now >= countdownEnd.current) latest.current.dispatch("go");
      // 視点が板の後ろ側に回っているフレームは判定を進めない
      if (phaseRef.current === "playing" && canStepTrace(v)) {
        trace.current = stepTrace(trace.current, strokes, p, now);
        if (trace.current.phase === "tracing") trail.current.push(p);
        if (trace.current.phase === "done") {
          const r = traceResult(trace.current);
          latest.current.dispatch("done");
          document.exitPointerLock();
          if (r) latest.current.onFinish(r);
        }
      }
      // 線を描く
      const t = trace.current;
      strokes.forEach((s, i) => {
        const isCur = i === t.stroke && t.phase !== "done";
        ctx.lineWidth = isCur ? 6 : 4;
        ctx.strokeStyle = isCur ? colors.current : colors.pending;
        ctx.globalAlpha = i < t.stroke || t.phase === "done" ? 0.35 : 1;
        ctx.beginPath();
        let pen = false;
        for (const q of s.points) {
          const sp = projectPoint(q, v, w, h);
          if (!sp) { pen = false; continue; }
          if (pen) ctx.lineTo(sp.x, sp.y); else ctx.moveTo(sp.x, sp.y);
          pen = true;
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // なぞった軌跡
      ctx.strokeStyle = colors.trail;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let pen = false;
      for (const q of trail.current) {
        const sp = projectPoint(q, v, w, h);
        if (!sp) { pen = false; continue; }
        if (pen) ctx.lineTo(sp.x, sp.y); else ctx.moveTo(sp.x, sp.y);
        pen = true;
      }
      ctx.stroke();
      // 次の画の始点の丸
      if (t.phase === "await-start" && ph !== "idle" && strokes[t.stroke]) {
        const p0 = strokes[t.stroke].points[0];
        const a = projectPoint(p0, v, w, h);
        const edge = projectPoint({ x: p0.x + START_RADIUS, y: p0.y }, v, w, h);
        if (a && edge) {
          ctx.strokeStyle = colors.current;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(a.x, a.y, Math.abs(edge.x - a.x), 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      // 外れているときは中央を赤く縁取る
      if (t.phase === "tracing" && strokes[t.stroke]) {
        const off = Math.min(...strokes[t.stroke].points.map((q) => Math.hypot(q.x - p.x, q.y - p.y))) > TOLERANCE;
        if (off) {
          ctx.strokeStyle = colors.miss;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, 18, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      if (ph === "countdown") {
        ctx.fillStyle = colors.text;
        ctx.font = "bold 64px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(Math.max(1, Math.ceil((countdownEnd.current - now) / 1000))), w / 2, h / 2 - 60);
      }
      drawCrosshair(ctx, crosshair, Math.round(w / 2), Math.round(h / 2));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [crosshair, strokes]);

  const start = async () => {
    if (phaseRef.current !== "idle") return;
    setError(null);
    const el = canvas.current!;
    view.current = { yaw: 0, pitch: 0 };
    trace.current = initialTrace();
    trail.current = [];
    try {
      // 生の移動量(OS の加速なし)を優先する
      await (el.requestPointerLock as (o?: { unadjustedMovement?: boolean }) => Promise<void> | void)({ unadjustedMovement: true });
    } catch {
      try {
        await (el.requestPointerLock as () => Promise<void> | void)();
      } catch {
        setError(UNSUPPORTED);
        return;
      }
    }
    countdownEnd.current = performance.now() + COUNTDOWN_MS;
    dispatch("start");
  };

  return (
    <div className="grid gap-3">
      <div className="relative">
        <canvas ref={canvas} className="aspect-video w-full cursor-crosshair rounded-xl border border-[var(--rl-border)]" onClick={() => void start()} />
        {phase === "idle" && (
          <button type="button" onClick={() => void start()}
            className="absolute inset-0 m-auto h-14 w-56 rounded-full bg-[var(--rl-accent)] font-bold text-[var(--rl-on-accent)]">
            クリックでスタート
          </button>
        )}
      </div>
      <p className="text-xs text-[var(--rl-muted)]">Esc で中断できます。OS のポインター速度やマウスの加速の設定によっては、ゲームと少しずれることがあります。</p>
      {error && <p role="alert" className="text-sm text-[var(--rl-danger)]">{error}</p>}
    </div>
  );
}
