"use client";
import { useState, useTransition } from "react";
import { deleteMeAction } from "@/app/lobby/actions";

export function DeleteAccount() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      <button type="button" disabled={pending}
        onClick={() => {
          if (confirm("退会すると、プロフィールと声かけの記録がすべて消えます。退会から7日間は、同じ Discord アカウントで再登録できません。よろしいですか?")) {
            start(async () => {
              const res = await deleteMeAction();
              if (res?.error) setError(res.error);
            });
          }
        }}
        className="text-sm text-[var(--rl-muted)] underline">
        退会する
      </button>
      {error && <p role="alert" className="text-sm text-[var(--rl-danger)]">{error}</p>}
    </div>
  );
}
