/** 手の測り方の図。長さ=手首のしわから中指の先まで、幅=親指を除いた4本の付け根の幅。 */
export function HandGuide() {
  return (
    <figure className="grid gap-2">
      <svg viewBox="0 0 220 260" role="img" aria-label="手の長さと幅の測り方" className="mx-auto h-56 w-auto">
        <g fill="none" stroke="var(--rl-muted)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          {/* 手のひらと指 */}
          <path d="M70 240 L70 150 Q70 130 80 125 L80 60 Q80 48 90 48 Q100 48 100 60 L100 120 L102 40 Q102 28 112 28 Q122 28 122 40 L122 118 L126 48 Q126 36 136 36 Q146 36 146 48 L146 122 L150 72 Q150 60 160 60 Q170 60 170 72 L170 170 Q170 215 140 240 Z" />
          {/* 親指 */}
          <path d="M70 175 Q48 160 38 135 Q32 122 42 118 Q52 114 58 128 L70 150" />
        </g>
        {/* 長さ:手首から中指の先 */}
        <g stroke="var(--rl-accent)" strokeWidth="3" fill="var(--rl-accent)">
          <line x1="190" y1="28" x2="190" y2="240" />
          <path d="M184 38 L190 28 L196 38 Z M184 230 L190 240 L196 230 Z" />
        </g>
        <text x="200" y="140" fill="var(--rl-accent)" fontSize="14" writingMode="vertical-rl">長さ</text>
        {/* 幅:4本の付け根 */}
        <g stroke="var(--rl-highlight)" strokeWidth="3" fill="var(--rl-highlight)">
          <line x1="80" y1="135" x2="170" y2="135" />
          <path d="M90 129 L80 135 L90 141 Z M160 129 L170 135 L160 141 Z" />
        </g>
        <text x="112" y="158" fill="var(--rl-highlight)" fontSize="14">幅</text>
      </svg>
      <figcaption className="text-xs text-[var(--rl-muted)]">
        長さ:手首のしわから中指の先まで。幅:親指を除いた4本の指の付け根のいちばん広いところ。定規やメジャーで測ってください。
      </figcaption>
    </figure>
  );
}
