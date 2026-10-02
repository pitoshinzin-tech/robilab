import type { Metadata } from "next";
import { TYPES } from "@/data/types";
import { PROS_READY } from "@/data/pros";
import { subnavFor } from "@/lib/nav";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { TypeRoster } from "@/components/brand/TypeRoster";
import { SubNav } from "@/components/brand/SubNav";
import { PageShell } from "@/components/ui/page-shell";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = { title: "16のゲーマータイプ一覧" };

/** 4 軸の読み方(src/lib/type-sprite.ts の絵の規則と同じ) */
const AXIS_RULES = [
  ["A 攻め/G 守り", "A はとがった頭、G は平らな兜"],
  ["R 直感/B 戦略", "R は斜めの目と稲妻、B はゴーグル"],
  ["C チーム/L ソロ", "C は両わきの仲間の点、L は右だけのマント"],
  ["H 熱血/Z 冷静", "H はマゼンタと炎、Z は淡いパープルと雪"],
] as const;

export default function TypesPage() {
  return (
    <PageShell width="wide" title="16 のゲーマータイプ" description="4 つの軸の組み合わせで 16 タイプ。絵の形と色で、どの軸かが分かります。"
      subnav={<SubNav label="診断" items={subnavFor("diagnosis", PROS_READY)} />}>
      <div className="grid gap-8">
        {/* 追補 5-3:箱にせず、上下の線だけ */}
        <section aria-label="4 つの軸の読み方" className="border-y border-rl-line py-6">
          <dl className="grid gap-3 md:grid-cols-2">
            {AXIS_RULES.map(([axis, rule]) => (
              <div key={axis} className="grid">
                <dt className="text-sm font-bold">{axis}</dt>
                <dd className="text-sm text-rl-muted">{rule}</dd>
              </div>
            ))}
          </dl>
        </section>
        {/* 追補 S5:箱なしの名簿(絵 + コード + 名前)。画面に入ったとき 1 回だけ集まる。
            見出しが「16 のゲーマータイプ」なので、名前は「タイプ」を外して短くする(読み上げは正式な名前。トップの名簿と同じ)。
            絵はホバー・フォーカスで上から塗り替わる(動きの参考 025。li が .rl-dissolve-host) */}
        <TypeRoster
          showName
          items={TYPES.map((t) => ({ code: t.code, name: t.name.replace(/タイプ$/, ""), label: t.name, icon: <TypeIcon code={t.code} size={64} dissolve /> }))}
        />
        <ButtonLink href="/diagnosis" variant="primary" className="justify-self-start">診断して自分のタイプを知る</ButtonLink>
      </div>
    </PageShell>
  );
}
