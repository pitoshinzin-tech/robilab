import { HAND_ART_PATHS } from "@/lib/fit-overlay";

/** 手の測り方の図。長さ=手首のしわから中指の先まで、幅=親指を除いた4本の付け根の幅。 */
export function HandGuide() {
  return (
    <figure className="grid gap-2">
      <svg viewBox="0 0 220 260" role="img" aria-label="手の長さと幅の測り方" className="mx-auto h-56 w-auto">
        <g fill="none" stroke="var(--rl-muted)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          {/* 手のひらと指・親指(実寸の重ね図と同じ線。src/lib/fit-overlay.ts) */}
          {HAND_ART_PATHS.map((d) => <path key={d} d={d} />)}
        </g>
        {/* 長さ:手首から中指の先 */}
        <g stroke="var(--rl-secondary)" strokeWidth="3" fill="var(--rl-secondary)">
          <line x1="190" y1="28" x2="190" y2="240" />
          <path d="M184 38 L190 28 L196 38 Z M184 230 L190 240 L196 230 Z" />
        </g>
        <text x="200" y="140" fill="var(--rl-secondary-text)" fontSize="14" writingMode="vertical-rl">長さ</text>
        {/* 幅:4本の付け根 */}
        <g stroke="var(--rl-highlight)" strokeWidth="3" fill="var(--rl-highlight)">
          <line x1="80" y1="135" x2="170" y2="135" />
          <path d="M90 129 L80 135 L90 141 Z M160 129 L170 135 L160 141 Z" />
        </g>
        <text x="112" y="158" fill="var(--rl-highlight)" fontSize="14">幅</text>
      </svg>
      <figcaption className="text-sm text-rl-muted">
        長さ:手首のしわから中指の先まで。幅:親指を除いた4本の指の付け根のいちばん広いところ。定規やメジャーで測ってください。
      </figcaption>
    </figure>
  );
}
