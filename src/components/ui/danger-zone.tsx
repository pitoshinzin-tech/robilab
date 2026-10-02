import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import { FieldError } from "./field";

/**
 * 消す操作のまとまり(ページの一番下、赤い枠のカード 1 つ)。/lobby/me と /my で同じものを使う。
 * 中に置いた操作(DangerAction)が 2 つ以上なら、間に border-rl-line の線が入る(カードの中にカードを入れない)。
 */
export function DangerZone({ headingId, title = "消す操作", className, children }: {
  headingId: string; title?: React.ReactNode; className?: string; children: React.ReactNode;
}) {
  return (
    <Card as="section" variant="danger" aria-labelledby={headingId} className={cn("grid gap-6", className)}>
      <h2 id={headingId} className="text-xl font-bold text-balance [word-break:auto-phrase]">{title}</h2>
      <div className="grid gap-6 [&>*+*]:border-t [&>*+*]:border-rl-line [&>*+*]:pt-6">{children}</div>
    </Card>
  );
}

/** 消す操作の 1 つ:ボタン(variant="danger" size="sm")・何が消えるかの説明・失敗したときのエラー。 */
export function DangerAction({ description, error, children }: {
  description: React.ReactNode; error?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="justify-self-start">{children}</div>
      <p className="text-sm text-rl-muted [word-break:auto-phrase]">{description}</p>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
