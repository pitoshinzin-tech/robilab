import { PROS, PROS_READY } from "@/data/pros";
import { nearPros } from "@/lib/pro-match";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProCard } from "./ProCard";

/** 感度計算の結果の下に出す「この感度に近いプロ」3 人。 */
export function NearPros({ cm, gameId }: { cm: number; gameId: string }) {
  if (!PROS_READY) return null;
  const list = nearPros(cm, gameId, PROS, 3);
  if (list.length === 0) return null;
  return (
    <section className="grid gap-4">
      <SectionHeading title="この感度に近いプロ" />
      <ul className="grid gap-4 sm:grid-cols-3">
        {list.map((item) => <ProCard key={item.pro.id} item={item} userCm={cm} />)}
      </ul>
      <ButtonLink href="/pros" variant="ghost" size="sm" className="justify-self-start">プロ設定をもっと見る</ButtonLink>
    </section>
  );
}
