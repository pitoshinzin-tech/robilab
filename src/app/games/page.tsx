import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChevronRight, FlaskConical } from "lucide-react";
import { PROS_READY } from "@/data/pros";
import { dexChars, latestCheckedAt, publishedGames, settingOf } from "@/lib/char-dex";
import { dexIndexMeta } from "@/lib/char-seo";
import { subnavFor } from "@/lib/nav";
import { gameSymbol } from "@/lib/role-symbols";
import { PixelArt } from "@/components/brand/PixelArt";
import { SubNav } from "@/components/brand/SubNav";
import { DexNotices } from "@/components/chars/DexNotices";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { DexCount } from "@/components/chars/DexCount";
import { PageShell } from "@/components/ui/page-shell";

const meta = dexIndexMeta(publishedGames().length);

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: "/games" },
  openGraph: { title: meta.title, description: meta.description },
};

/** キャラ図鑑の目次(設計書 6-1)。公開しているゲームだけ。図鑑のページは無広告 */
export default function GamesPage() {
  const games = publishedGames();
  const rows = games.map((game) => {
    const setting = settingOf(game.id)!;
    const list = dexChars(game.id);
    return { game, setting, count: list.length, checkedAt: latestCheckedAt(list) };
  });
  const total = rows.reduce((n, r) => n + r.count, 0);
  return (
    <PageShell width="wide" title="キャラ図鑑" description={meta.description}
      actions={rows.length > 0 ? <DexCount value={total} caption={`${rows.length} 本のゲームの代表キャラ`} /> : undefined}
      subnav={<SubNav label="診断" items={subnavFor("diagnosis", PROS_READY)} />}>
      <div className="grid gap-rl-ma-sm">
        {rows.length === 0 ? (
          <EmptyState icon={BookOpen} title="公開中の図鑑はまだありません" description="先に診断で、自分のタイプを知れます。" />
        ) : (
          <ul className="border-t border-rl-line">
            {rows.map(({ game, setting, count, checkedAt }) => (
              <li key={game.id} className="border-b border-rl-line">
                <Link href={`/games/${game.id}/chars`} className="rl-lock group grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 py-6">
                  <PixelArt grid={gameSymbol(game.id)} size={48} />
                  <span className="grid min-w-0 gap-1">
                    <span data-long-name className="text-2xl font-bold wrap-anywhere">{game.name}{setting.nameMark}</span>
                    <span className="text-sm text-rl-muted">
                      {setting.groupByRole && <>ロール <b className="text-rl-highlight">{game.roles.length}</b>・</>}
                      代表 <b className="text-rl-highlight">{count}</b> 体・<span className="whitespace-nowrap">確認日 {checkedAt}</span>
                    </span>
                    {!setting.matching && <span className="text-sm text-rl-muted">図鑑だけ(合うキャラは出していません)</span>}
                  </span>
                  <ChevronRight aria-hidden className="size-6 text-rl-muted transition-colors group-hover:text-rl-text" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <ButtonLink href="/diagnosis" variant="primary"><FlaskConical aria-hidden />診断して、合うキャラを見る</ButtonLink>
          <p className="text-sm text-rl-muted">12 問・約 1 分半。結果のゲームごとの行に、合うキャラが出ます</p>
        </div>
        <DexNotices settings={rows.map((r) => r.setting)} />
      </div>
    </PageShell>
  );
}
