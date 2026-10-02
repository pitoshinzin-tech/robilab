import type { Metadata } from "next";
import { TYPES } from "@/data/types";
import { PROS_READY } from "@/data/pros";
import { subnavFor } from "@/lib/nav";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { TypeRoster } from "@/components/brand/TypeRoster";
import { TypeAxisFilter } from "@/components/brand/TypeAxisFilter";
import { SubNav } from "@/components/brand/SubNav";
import { PageShell } from "@/components/ui/page-shell";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = { title: "16のゲーマータイプ一覧" };

/** 4 軸の読み方(src/lib/type-sprite.ts の絵の規則と同じ。AXES の順) */
const AXIS_RULES = [
  "A はとがった頭、G は平らな兜",
  "R は斜めの目と稲妻、B はゴーグル",
  "C は両わきの仲間の点、L は右だけのマント",
  "H はマゼンタと炎、Z は淡いパープルと雪",
] as const;

/** 追補 4-4:「16」を display-1 の数字(Orbitron・マゼンタ)、「のゲーマータイプ」を見出しの 32px(スマホは 24px)で */
const title = (
  <span className="inline-flex flex-wrap items-baseline gap-x-2">
    <span className="font-display text-rl-display-1 font-extrabold tabular-nums text-rl-highlight">16</span>
    <span className="text-2xl sm:text-rl-title">のゲーマータイプ</span>
  </span>
);

export default function TypesPage() {
  return (
    <PageShell width="wide" title={title} description="4 つの軸の組み合わせで 16 タイプ。絵の形と色で、どの軸かが分かります。"
      subnav={<SubNav label="診断" items={subnavFor("diagnosis", PROS_READY)} />}>
      <div className="grid gap-rl-ma-sm">
        <TypeAxisFilter codes={TYPES.map((t) => t.code)} rules={AXIS_RULES}>
          {/* 追補 S5:箱なしの名簿(絵 + コード + 名前)。画面に入ったとき 1 回だけ集まる。
              スマホは 2 列にして名前を 14px の 1 行で読ませる(この画面は名前を読む所)。
              見出しが「16 のゲーマータイプ」なので、名前は「タイプ」を外して短くする(読み上げは正式な名前。トップの名簿と同じ)。
              絵はホバー・フォーカスで上から塗り替わる(動きの参考 025。li が .rl-dissolve-host) */}
          <TypeRoster
            showName
            nameSize="sm"
            className="grid-cols-2 sm:grid-cols-4 md:grid-cols-8"
            items={TYPES.map((t) => ({ code: t.code, name: t.name.replace(/タイプ$/, ""), label: t.name, icon: <TypeIcon code={t.code} size={64} dissolve /> }))}
          />
        </TypeAxisFilter>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <ButtonLink href="/diagnosis" variant="primary">診断して自分のタイプを知る</ButtonLink>
          <p className="text-sm text-rl-muted">12 問・約 1 分半で、あなたがどれか分かります</p>
        </div>
      </div>
    </PageShell>
  );
}
