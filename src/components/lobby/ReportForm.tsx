"use client";
import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { reportAction } from "@/app/lobby/actions";
import { PlainButton } from "@/components/ui/plain-button";
import { Card } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/input";

const REASONS = [
  { id: "harassment", label: "迷惑行為・暴言" },
  { id: "age_fake", label: "年齢を偽っている" },
  { id: "dating", label: "出会い目的" },
  { id: "spam", label: "勧誘・宣伝" },
  { id: "other", label: "その他" },
];

export function ReportForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("harassment");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  if (!open) return <PlainButton variant="ghost" size="sm" onClick={() => setOpen(true)}><Flag aria-hidden />通報する</PlainButton>;
  return (
    <Card className="grid w-full gap-4">
      <Field id="report-reason" label="通報の理由">
        <NativeSelect id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </NativeSelect>
      </Field>
      <Field id="report-detail" label="くわしい内容(任意・200文字まで)">
        <Textarea id="report-detail" value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={200} />
      </Field>
      <p className="text-sm text-rl-muted">通報すると、この人はあなたには表示されなくなり(ブロック)、運営が内容を確認します。年齢詐称の通報は、確認が終わるまで相手が利用停止になります。嫌がらせ目的の通報はご遠慮ください。</p>
      {error && <FieldError>{error}</FieldError>}
      <PlainButton variant="secondary" className="justify-self-start" loading={pending} loadingText="送信中…"
        onClick={() => start(async () => setError((await reportAction(id, reason, detail)).error))}>通報を送る</PlainButton>
    </Card>
  );
}
