import { cn } from "@/lib/utils";

export function GlitchTitle({ as: Tag = "h1", className, children }: { as?: "h1" | "h2" | "p"; className?: string; children: React.ReactNode }) {
  return <Tag className={cn("rl-glitch font-bold", className)}>{children}</Tag>;
}
