import { FlaskConical } from "lucide-react";
import type { CharGameSetting } from "@/data/char-games";
import type { Game } from "@/data/games";
import type { DexSection } from "@/lib/char-dex";
import { roleFitType, shiftedRows } from "@/lib/char-match";
import { roleSymbol } from "@/lib/role-symbols";
import { PixelArt } from "@/components/brand/PixelArt";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { ButtonLink } from "@/components/ui/button-link";
import { CharRow } from "@/components/chars/CharRow";
import { DexNotices } from "@/components/chars/DexNotices";

/**
 * 一覧のページの中身(設計書 6-2)。ロールの段(自前のロールの記号・ロール名・ロールの理由)+幅いっぱいの行。
 * 合うキャラを出すゲームでは、ロールの段の見出しの横に「このロールに合うタイプ」の絵とコードを 1 回だけ出し、
 * 行には公式の言葉でロールの土台からずれた軸だけを言葉の札で出す(同じ絵を行ごとに並べない。採点 1 回目 P0)。
 * データはページ(src/app)が組み立てて渡す(この部品はキャラのデータを import しない)。主ボタンは診断の 1 つだけ。
 */
export function CharListBody({ game, setting, sections, checkedAt }: {
  game: Game; setting: CharGameSetting; sections: readonly DexSection[]; checkedAt: string;
}) {
  const roleType = (roleId: string | null) => {
    const role = setting.matching && roleId ? game.roles.find((r) => r.id === roleId) : undefined;
    return role ? roleFitType(role) : null;
  };
  return (
    <div className="grid gap-rl-ma-sm">
      {setting.matching && (
        <p className="max-w-prose text-sm text-rl-muted text-pretty">
          合うタイプはロールで決まるので、段の見出しに 1 つだけ出しています。行の札は、{setting.showQuotes ? "公式の言葉" : "公式ページの内容"}の手がかりでロールの土台からずれた軸です(札のないキャラは、ロールのとおり)。
        </p>
      )}
      {sections.map((s) => {
        const type = roleType(s.roleId);
        return (
        <section key={s.key} aria-labelledby={`dex-${s.key}`} className={type ? "rl-role-link grid gap-4" : "grid gap-4"}>
          <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-4 md:grid-cols-[48px_minmax(0,1fr)_auto]">
            <PixelArt grid={roleSymbol(game.id, s.roleId)} size={48} />
            <div className="grid min-w-0 gap-1">
              <h2 id={`dex-${s.key}`} className="text-2xl font-bold wrap-anywhere">{s.title}</h2>
              {s.reason && <p className="text-sm text-rl-muted">{s.reason}</p>}
            </div>
            {type && (
              <p className="col-span-2 flex items-center gap-3 md:col-span-1">
                <span data-role-type className="inline-flex rounded-rl-sm"><TypeIcon code={type.code} size={48} /></span>
                <span className="grid">
                  <span className="text-sm text-rl-muted">このロールに合うタイプ</span>
                  <span className="font-display text-xl font-extrabold text-rl-highlight">{type.code}<span className="sr-only"> {type.name}</span></span>
                </span>
              </p>
            )}
          </div>
          <ul className="border-t border-rl-line">
            {s.chars.map((c) => (
              <CharRow key={c.id} char={c} href={`/games/${c.game}/chars/${c.id}`} showRole={setting.groupByRole}
                shifts={type && c.matchable ? shiftedRows(c) : []} />
            ))}
          </ul>
        </section>
        );
      })}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <ButtonLink href="/diagnosis" variant="primary">
          <FlaskConical aria-hidden />
          {setting.matching ? "診断して、合うキャラを見る" : "診断して、自分のタイプを知る"}
        </ButtonLink>
        <p className="text-sm text-rl-muted">
          {setting.matching ? "12 問・約 1 分半。結果のゲームごとの行に、合うキャラが出ます" : "12 問・約 1 分半で、自分のタイプが分かります"}
        </p>
      </div>
      <DexNotices settings={[setting]} checkedAt={checkedAt} />
    </div>
  );
}
