"use client";
import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { blockAction } from "@/app/lobby/actions";
import { PlainButton } from "@/components/ui/plain-button";
import { FieldError } from "@/components/ui/field";

export function BlockButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-1">
      <PlainButton variant="ghost" size="sm" loading={pending} loadingText="ブロック中…"
        onClick={() => {
          if (confirm("この人をブロックしますか?おたがいに表示されなくなります。")) {
            start(async () => {
              const res = await blockAction(id);
              if (res?.error) setError(res.error);
            });
          }
        }}>
        <Ban aria-hidden />ブロックする
      </PlainButton>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
