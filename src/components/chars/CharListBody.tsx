import { FlaskConical } from "lucide-react";
import type { CharGameSetting } from "@/data/char-games";
import type { Game } from "@/data/games";
import type { GamerType } from "@/data/types";
import type { DexSection } from "@/lib/char-dex";
import { roleSymbol } from "@/lib/role-symbols";
import { PixelArt } from "@/components/brand/PixelArt";
import { ButtonLink } from "@/components/ui/button-link";
import { CharRow } from "@/components/chars/CharRow";
import { DexNotices } from "@/components/chars/DexNotices";

/**
 * 一覧のページの中身(設計書 6-2)。ロールの段(自前のロールの記号・ロール名・ロールの理由)+幅いっぱいの行。
 * データはページ(src/app)が組み立てて渡す(この部品はキャラのデータを import しない)。主ボタンは診断の 1 つだけ。
 */
export function CharListBody({ game, setting, sections, fits, checkedAt }: {
  game: Game; setting: CharGameSetting; sections: readonly DexSection[];
  /** キャラの id → 一覧に出す合うタイプ(相性に入らないキャラ・合うキャラを出さないゲームは null) */
  fits: Readonly<Record<string, GamerType | null>>;
  checkedAt: string;
}) {
  return (
    <div className="grid gap-rl-ma-sm">
      {sections.map((s) => (
        <section key={s.key} aria-labelledby={`dex-${s.key}`} className="grid gap-4">
          <div className="flex items-center gap-4">
            <PixelArt grid={roleSymbol(game.id, s.roleId)} size={48} />
            <div className="grid min-w-0 gap-1">
              <h2 id={`dex-${s.key}`} className="text-2xl font-bold wrap-anywhere">{s.title}</h2>
              {s.reason && <p className="text-sm text-rl-muted">{s.reason}</p>}
            </div>
          </div>
          <ul className="border-t border-rl-line">
            {s.chars.map((c) => (
              <CharRow key={c.id} char={c} href={`/games/${c.game}/chars/${c.id}`} showRole={setting.groupByRole} fit={fits[c.id] ?? null} />
            ))}
          </ul>
        </section>
      ))}
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
