"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AimChar } from "@/lib/aim/daily";
import { applyMouse, aimPoint, projectPoint, KVG_SIZE, type Point, type View } from "@/lib/aim/view";
import { closestOnStroke, parsePath, pointAtProgress, toStroke } from "@/lib/aim/path";
import { initialTrace, stepTrace, traceResult, EDGE, RESUME_RADIUS, START_RADIUS, type TraceState } from "@/lib/aim/trace";
import { createMoveFilter, filterMovement, pushTrailPoint } from "@/lib/aim/input";
import { AIM_TUNING } from "@/lib/aim/tuning";
import { reduceAim, reducePen, canStepTrace, type AimPhase, type AimEvent, type PenEvent } from "@/lib/aim/game-state";
import { drawCrosshair, type Crosshair } from "@/lib/crosshair";

type Result = { accuracy: number; timeMs: number; perStroke: number[] };
type Props = {
  char: AimChar; degPerCount: number; crosshair: Crosshair; onFinish: (r: Result) => void; onAbort: () => void;
  /** true なら左上に診断(fps・捨てたマウスの飛び・直近 1 秒の最大の動き・生の移動量か)を出す(?debug=1)。 */
  debug?: boolean;
};
type ScreenPoint = { x: number; y: number };

const COUNTDOWN_MS = 3000;
const UNSUPPORTED = "マウスを固定できませんでした。少し待ってから、もう一度クリックしてください(Chrome / Edge / Firefox で遊べます)。";

/** 全画面から戻す(全画面になっているのが el 自身でなければ何もしない。失敗しても遊びには影響しないので無視する)。 */
function leaveFullscreen(el: Element | null) {
  if (typeof document === "undefined" || !el || document.fullscreenElement !== el) return;
  try {
    void document.exitFullscreen().catch(() => {});
  } catch {
    // 無視
  }
}

/**
 * 画面の点を、点と点の中点を通る 2 次曲線でなめらかにつなぐ(折れ線のガタつきを抑える)。
 * 点を 1 つずつ渡す。null はカメラの後ろなどで描けない点で、そこで線を切る。
 */
function smoothPath(ctx: CanvasRenderingContext2D) {
  let prev: ScreenPoint | null = null;
  let count = 0;
  const end = () => {
    if (prev && count > 1) ctx.lineTo(prev.x, prev.y);
    prev = null;
    count = 0;
  };
  const add = (sp: ScreenPoint | null) => {
    if (!sp) { end(); return; }
    if (!prev) { ctx.moveTo(sp.x, sp.y); prev = sp; count = 1; return; }
    const mx = (prev.x + sp.x) / 2, my = (prev.y + sp.y) / 2;
    if (count === 1) ctx.lineTo(mx, my); else ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
    prev = sp;
    count += 1;
  };
  return { add, end };
}

/** CSS の役割の色を読む(Canvas では var() が使えないため)。 */
function roleColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function AimGame({ char, degPerCount, crosshair, onFinish, onAbort, debug = false }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // 全画面にする要素(canvas と開始ボタンを包む)
  const stage = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [phase, setPhase] = useState<AimPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const phaseRef = useRef<AimPhase>("idle");
  const view = useRef<View>({ yaw: 0, pitch: 0 });
  const trace = useRef<TraceState>(initialTrace());
  // なぞった軌跡(筆を下ろしている間ごとに分ける。筆を上げたところを線でつながないため)
  const trail = useRef<Point[][]>([]);
  // 左ボタンを押しているか(筆が下りているか)
  const pen = useRef(false);
  // マウスの飛びを捨てるフィルター
  const moveFilter = useRef(createMoveFilter());
  // 生の移動量(unadjustedMovement)でロックできたか
  const unadjusted = useRef(false);
  // 診断(?debug=1)の数字。maxDelta は今の 1 秒、maxDeltaShown は直前の 1 秒の最大の動き
  const diag = useRef({ frames: 0, fps: 0, since: 0, maxDelta: 0, maxDeltaShown: 0 });
  const countdownEnd = useRef(0);
  // ロック要求の状態:first = unadjustedMovement つき(失敗しても通常の要求に続く)、second = 通常の要求、final = 要求が済んだ後
  const attempt = useRef<"first" | "second" | "final">("final");
  const starting = useRef(false);
  const mounted = useRef(true);
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

  useEffect(() => {
    mounted.current = true;
    const st = stage.current;
    const onFsChange = () => setFullscreen(document.fullscreenElement === st);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      mounted.current = false;
      document.removeEventListener("fullscreenchange", onFsChange);
      // アンマウントのときは全画面から戻す
      leaveFullscreen(st);
    };
  }, []);

  // ポインターロックの出入りとマウスの動き
  useEffect(() => {
    const el = canvas.current!;
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      // 1 回の mousemove につき 1 回だけ視点に足す(描画は requestAnimationFrame の側で 1 フレームに 1 回)
      const mag = Math.hypot(e.movementX, e.movementY);
      if (mag > diag.current.maxDelta) diag.current.maxDelta = mag;
      const m = filterMovement(moveFilter.current, e.movementX, e.movementY);
      if (m.dx === 0 && m.dy === 0) return;
      view.current = applyMouse(view.current, m.dx, m.dy, degPerCount);
    };
    const penEvent = (ev: PenEvent) => {
      pen.current = reducePen(pen.current, ev, phaseRef.current);
    };
    const onDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      penEvent({ kind: "down", button: e.button });
    };
    const onUp = (e: MouseEvent) => penEvent({ kind: "up", button: e.button });
    const onBlur = () => penEvent({ kind: "blur" });
    const onLockChange = () => {
      if (document.pointerLockElement !== el) penEvent({ kind: "lost" });
      if (document.pointerLockElement === el) {
        // ロックが取れたので、1 回目の失敗で出たエラーは消す
        setError(null);
      } else if (latest.current.dispatch("lost") === "aborted") {
        // Esc ならブラウザが全画面も抜けているが、念のため戻す。全画面だけが外れた場合は中断しない(ここには来ない)
        leaveFullscreen(stage.current);
        latest.current.onAbort();
      }
    };
    const onLockError = () => {
      // 1 回目(unadjustedMovement つき)の失敗は、通常の要求に続くので無視する
      if (attempt.current === "first") return;
      setError(UNSUPPORTED);
      // promise を返さない古いブラウザで、始まったあとにロックが失敗したときは中断にする
      if (latest.current.dispatch("lost") === "aborted") {
        leaveFullscreen(stage.current);
        latest.current.onAbort();
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("pointerlockerror", onLockError);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", onBlur);
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
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const v = view.current;
      const p = aimPoint(v);
      const ph = phaseRef.current;
      if (ph === "countdown" && now >= countdownEnd.current) latest.current.dispatch("go");
      // 視点が板の後ろ側に回っているフレームは判定を進めない
      if (phaseRef.current === "playing" && canStepTrace(v)) {
        const wasDrawing = trace.current.drawing;
        trace.current = stepTrace(trace.current, strokes, p, now, pen.current);
        if (trace.current.phase === "tracing" && trace.current.drawing) {
          // 筆を下ろし直したら新しい線にする
          if (!wasDrawing) trail.current.push([]);
          pushTrailPoint(trail.current[trail.current.length - 1], p);
        }
        if (trace.current.phase === "done") {
          const r = traceResult(trace.current);
          latest.current.dispatch("done");
          document.exitPointerLock();
          leaveFullscreen(stage.current);
          if (r) latest.current.onFinish(r);
        }
      }
      // 板の 1 単位が画面で何ピクセルか(板の中央で測る)。線の太さを板の単位で決めるため
      const c0 = projectPoint({ x: KVG_SIZE / 2, y: KVG_SIZE / 2 }, v, w, h);
      const c1 = projectPoint({ x: KVG_SIZE / 2 + 1, y: KVG_SIZE / 2 }, v, w, h);
      const unitPx = c0 && c1 ? Math.hypot(c1.x - c0.x, c1.y - c0.y) : 0;
      // 線を描く(太さは板の単位で AIM_TUNING.lineWidth)
      const t = trace.current;
      ctx.lineWidth = Math.max(1, AIM_TUNING.lineWidth * unitPx);
      for (let i = 0; i < strokes.length; i++) {
        const isCur = i === t.stroke && t.phase !== "done";
        ctx.strokeStyle = isCur ? colors.current : colors.pending;
        ctx.globalAlpha = i < t.stroke || t.phase === "done" ? 0.35 : 1;
        ctx.beginPath();
        let down = false;
        for (const q of strokes[i].points) {
          const sp = projectPoint(q, v, w, h);
          if (!sp) { down = false; continue; }
          if (down) ctx.lineTo(sp.x, sp.y); else ctx.moveTo(sp.x, sp.y);
          down = true;
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // なぞった軌跡(点と点の中点を通る曲線でなめらかに。全部の線を 1 回の stroke で描く)
      ctx.strokeStyle = colors.trail;
      ctx.lineWidth = Math.max(1.5, AIM_TUNING.trailWidth * unitPx);
      ctx.beginPath();
      const path = smoothPath(ctx);
      for (const seg of trail.current) {
        for (const q of seg) path.add(projectPoint(q, v, w, h));
        path.end();
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
      // 筆を上げて止めている画は、続きを書き始める位置(今の進み具合)を丸で示す(線より大きい丸)
      if (t.phase === "tracing" && !t.drawing && strokes[t.stroke]) {
        const c = pointAtProgress(strokes[t.stroke], t.progress);
        const a = projectPoint(c, v, w, h);
        const edge = projectPoint({ x: c.x + RESUME_RADIUS, y: c.y }, v, w, h);
        if (a && edge) {
          ctx.strokeStyle = colors.text;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(a.x, a.y, Math.abs(edge.x - a.x), 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      // 外れているときは中央を赤く縁取る(判定と同じく線分までの距離で見る。筆を上げている間と判定を止めている角度では出さない)
      if (t.phase === "tracing" && t.drawing && strokes[t.stroke] && canStepTrace(v)) {
        const off = closestOnStroke(strokes[t.stroke], p).dist > EDGE;
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
      // 診断(?debug=1):fps と、直前の 1 秒の最大の動き
      const d = diag.current;
      d.frames += 1;
      if (now - d.since >= 1000) {
        d.fps = Math.round((d.frames * 1000) / Math.max(1, now - d.since));
        d.frames = 0;
        d.since = now;
        d.maxDeltaShown = d.maxDelta;
        d.maxDelta = 0;
      }
      if (debug) {
        const lines = [
          `fps ${d.fps}`,
          `dropped ${moveFilter.current.dropped}`,
          `max |delta| 1s ${Math.round(d.maxDeltaShown)}`,
          `unadjustedMovement ${unadjusted.current ? "on" : "off"}`,
        ];
        ctx.font = "12px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = colors.bg;
        ctx.fillRect(8, 8, 220, lines.length * 16 + 8);
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors.text;
        for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], 12, 12 + i * 16);
        ctx.textBaseline = "alphabetic";
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [crosshair, strokes, debug]);

  const start = async () => {
    if (phaseRef.current !== "idle" || starting.current) return;
    starting.current = true;
    setError(null);
    const el = canvas.current!;
    view.current = { yaw: 0, pitch: 0 };
    trace.current = initialTrace();
    trail.current = [];
    pen.current = false;
    moveFilter.current = createMoveFilter();
    unadjusted.current = false;
    attempt.current = "first";
    // 全画面を先に要求し、完了は待たずにロックも同じクリックの中で要求する(失敗しても全画面なしで遊べる)
    try {
      void stage.current?.requestFullscreen?.({ navigationUI: "hide" })?.catch(() => {});
    } catch {
      // 無視
    }
    let locked = true;
    try {
      // 生の移動量(OS の加速なし)を優先する
      const req = (el.requestPointerLock as (o?: { unadjustedMovement?: boolean }) => Promise<void> | void)({ unadjustedMovement: true });
      await req;
      // promise を返すブラウザで成功したときだけ、生の移動量が使えている
      unadjusted.current = req instanceof Promise;
    } catch {
      attempt.current = "second";
      try {
        await (el.requestPointerLock as () => Promise<void> | void)();
      } catch {
        locked = false;
      }
    }
    attempt.current = "final";
    starting.current = false;
    if (!mounted.current) return;
    if (!locked) {
      leaveFullscreen(stage.current);
      setError(UNSUPPORTED);
      return;
    }
    countdownEnd.current = performance.now() + COUNTDOWN_MS;
    dispatch("start");
  };

  return (
    <div className="grid gap-3">
      <div ref={stage} className={fullscreen ? "relative h-full w-full bg-[var(--rl-bg)]" : "relative"}>
        <canvas ref={canvas}
          className={`block w-full cursor-crosshair ${fullscreen ? "h-full" : "h-[min(70vh,640px)] rounded-xl border border-[var(--rl-border)]"}`}
          onClick={() => void start()} />
        {phase === "idle" && (
          <button type="button" onClick={() => void start()}
            className="absolute inset-0 m-auto h-14 w-56 rounded-full bg-[var(--rl-accent)] font-bold text-[var(--rl-on-accent)]">
            クリックでスタート
          </button>
        )}
      </div>
      <p className="text-sm">クリックしている間だけ筆が書けます。画と画の間はクリックを離して移動してください。</p>
      <p className="text-xs text-[var(--rl-muted)]">Esc で中断できます。OS のポインター速度やマウスの加速の設定によっては、ゲームと少しずれることがあります。</p>
      {error && <p role="alert" className="text-sm text-[var(--rl-danger)]">{error}</p>}
    </div>
  );
}
