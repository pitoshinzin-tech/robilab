"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardLink, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Badge, RankBadge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { NumberField } from "@/components/my/NumberField";

export function UiShowcase() {
  const [loading, setLoading] = useState(false);
  const [num, setNum] = useState<number | null>(800);
  return (
    <main className="mx-auto grid w-full max-w-[1168px] gap-8 px-4 py-6 md:px-6">
      <h1 className="text-[32px] font-bold">部品の確認</h1>
      <section className="grid gap-3">
        <h2 className="text-2xl font-bold">Button</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">主ボタン</Button>
          <Button variant="secondary"><Share2 aria-hidden />シェア</Button>
          <Button variant="ghost">もう一度診断する</Button>
          <Button variant="danger">退会する</Button>
          <Button variant="discord">Discord でログイン</Button>
          <Button variant="primary" disabled>無効</Button>
          <Button variant="secondary" loading={loading} loadingText="保存中…" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }}>保存する</Button>
          <ButtonLink href="/" variant="secondary" size="sm">リンクのボタン</ButtonLink>
        </div>
        <Card className="flex flex-wrap gap-3"><Button variant="primary" size="lg">カードの中の主ボタン</Button><Button size="sm">小さい</Button></Card>
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        <h2 className="text-2xl font-bold md:col-span-2">Card</h2>
        <Card><CardTitle>default</CardTitle><CardDescription>補足の文</CardDescription></Card>
        <Card variant="selected"><CardTitle>selected</CardTitle></Card>
        <Card variant="feature"><CardTitle>feature</CardTitle></Card>
        <Card variant="danger"><CardTitle>danger</CardTitle></Card>
        <CardLink href="/types"><CardTitle>interactive(CardLink)</CardTitle><CardDescription>全体がリンク</CardDescription></CardLink>
      </section>
      <section className="grid max-w-[640px] gap-4">
        <h2 className="text-2xl font-bold">入力欄</h2>
        <Field id="dev-a" label="ふつう" hint="補足の文"><Input id="dev-a" aria-describedby={fieldDescribedBy("dev-a", { hint: true })} placeholder="入力" /></Field>
        <Field id="dev-b" label="エラー" required error="50〜64000 の整数で入力してください。"><Input id="dev-b" invalid aria-describedby={fieldDescribedBy("dev-b", { error: true })} defaultValue="abc" /></Field>
        <Field id="dev-c" label="無効"><Input id="dev-c" disabled defaultValue="押せない" /></Field>
        <Field id="dev-d" label="選ぶ(NativeSelect)"><NativeSelect id="dev-d"><option>VALORANT</option><option>Apex Legends</option></NativeSelect></Field>
        <Field id="dev-e" label="長い文章"><Textarea id="dev-e" placeholder="ひとこと" /></Field>
        <NumberField label="DPI(NumberField)" value={num} onValue={setNum} suffix="DPI" hint="全角で入れると注意が出ます" />
        <div className="grid gap-2">
          <span className="text-sm font-bold">Select(base-ui)</span>
          <Select defaultValue="valorant">
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="valorant">VALORANT</SelectItem>
              <SelectItem value="apex">Apex Legends</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Progress value={60}>
          <ProgressLabel>進み具合</ProgressLabel>
          <ProgressValue />
        </Progress>
      </section>
      <section className="flex flex-wrap items-center gap-3">
        <h2 className="w-full text-2xl font-bold">Badge</h2>
        <Badge variant="pr">PR</Badge><Badge variant="count">3</Badge><Badge variant="success">成立</Badge><Badge variant="code">ARCH</Badge><RankBadge rank={1} /><RankBadge rank={8} />
      </section>
    </main>
  );
}
