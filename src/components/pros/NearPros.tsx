import Link from "next/link";
import { PROS } from "@/data/pros";
import { nearPros } from "@/lib/pro-match";
import { ProCard } from "./ProCard";

/** 感度計算の結果の下に出す「この感度に近いプロ」3 人。 */
export function NearPros({ cm, gameId }: { cm: number; gameId: string }) {
  const list = nearPros(cm, gameId, PROS, 3);
  if (list.length === 0) return null;
  return (
    <section className="grid gap-2">
      <h2 className="font-bold">この感度に近いプロ</h2>
      <ul className="grid gap-2 sm:grid-cols-3">
        {list.map((item) => <ProCard key={item.pro.id} item={item} userCm={cm} />)}
      </ul>
      <Link href="/pros" className="justify-self-start text-sm underline">プロ設定をもっと見る</Link>
    </section>
  );
}
