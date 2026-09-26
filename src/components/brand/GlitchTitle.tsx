export function GlitchTitle({ as: Tag = "h1", className = "", children }: { as?: "h1" | "h2" | "p"; className?: string; children: React.ReactNode }) {
  return <Tag className={`rl-glitch font-bold ${className}`}>{children}</Tag>;
}
