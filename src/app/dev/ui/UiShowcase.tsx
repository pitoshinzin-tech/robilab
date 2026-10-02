"use client";
import { useState } from "react";
import { Inbox, Share2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardLink, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Badge, RankBadge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { NumberField } from "@/components/my/NumberField";
import { Chip, CheckChip } from "@/components/ui/chip";
import { ChipGroup } from "@/components/ui/chip-group";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton, LoadingRegion } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/ui/copy-button";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { PixelArt } from "@/components/brand/PixelArt";
import { NumUnit } from "@/components/ui/num-unit";
import { PIXEL_GRIDS } from "@/lib/pixel-art";
import { TYPES } from "@/data/types";

export function UiShowcase() {
  const [loading, setLoading] = useState(false);
  const [num, setNum] = useState<number | null>(800);
  const [grip, setGrip] = useState<("palm" | "claw" | "fingertip")[]>(["palm"]);
  const [multi, setMulti] = useState<string[]>([]);
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
      <section className="grid gap-3">
        <SectionHeading title="Chip" description="1 つ選ぶ(矢印キーで移動)/いくつでも/フォーム" count={3} />
        <ChipGroup label="持ち方" value={grip} onValueChange={setGrip}>
          <Chip value="palm">かぶせ</Chip><Chip value="claw">つかみ</Chip><Chip value="fingertip">つまみ</Chip>
        </ChipGroup>
        <ChipGroup label="ゲーム" multiple allowEmpty value={multi} onValueChange={setMulti}>
          <Chip value="valorant">VALORANT</Chip><Chip value="apex">Apex</Chip><Chip value="ow" disabled>OW(無効)</Chip>
        </ChipGroup>
        <div className="flex flex-wrap gap-2"><CheckChip name="voice" value="1">VC 可</CheckChip></div>
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        <EmptyState icon={Inbox} title="条件に合う人がまだいません" description="時間帯を増やすと見つかりやすくなります。" action={<Button>条件をゆるめる</Button>} />
        <ErrorState message="通信状態を確認して、もう一度お試しください。" onRetry={() => {}} showHome />
        <LoadingRegion className="grid gap-2"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-24 w-full rounded-rl-md" /><Skeleton pixel className="h-8 w-full" /></LoadingRegion>
        <div className="flex flex-wrap items-center gap-3"><CopyButton path="/aim" label="PC で遊ぶリンクをコピー" /></div>
      </section>
      <section className="flex flex-wrap gap-2">
        {TYPES.map((t) => <TypeIcon key={t.code} code={t.code} size={64} />)}
        <TypeIcon code="ARCH" size={160} labelled glow animate />
      </section>
      <section className="rl-hero-ground grid gap-3 rounded-rl-md p-4">
        <p className="font-display text-rl-display-1 font-extrabold text-rl-highlight">ARCH</p>
        <NumUnit value="34.6" unit="cm" className="text-rl-display-1" />
        <p className="font-display text-rl-display-2 font-black">404</p>
        <div className="flex flex-wrap items-end gap-4">
          {PIXEL_GRIDS.map((g) => <PixelArt key={g.id} grid={g} size={48} label={g.title} />)}
        </div>
        <div className="flex flex-wrap gap-3">
          <TypeIcon code="ARCH" size={96} />
          <TypeIcon code="GBLZ" size={240} labelled />
        </div>
      </section>
    </main>
  );
}
