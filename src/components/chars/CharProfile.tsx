import Link from "next/link";
import { ChevronRight, FlaskConical } from "lucide-react";
import type { Char } from "@/data/char-types";
import type { CharGameSetting } from "@/data/char-games";
import type { Game, Role } from "@/data/games";
import type { GamerType } from "@/data/types";
import type { CharAxisRow } from "@/lib/char-match";
import type { CharLink, CharSource } from "@/lib/char-dex";
import { TAG_LABEL } from "@/lib/char-reason";
import { isLatinText } from "@/lib/char-seo";
import { roleSymbol } from "@/lib/role-symbols";
import { PixelArt } from "@/components/brand/PixelArt";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { DexNotices } from "@/components/chars/DexNotices";

const OUT = "inline-flex min-h-11 items-center text-rl-accent underline underline-offset-4 wrap-anywhere";
const outLink = { target: "_blank", rel: "noopener noreferrer" } as const;

/** 根拠の表の 1 つ(数字を出さない。DbD は引用を出さず、公式ページへのリンクだけ) */
function Basis({ row, showQuotes }: { row: CharAxisRow; showQuotes: boolean }) {
  if (row.basis.kind === "role") return <>ロール「{row.basis.roleName}」の土台から</>;
  const { tag, quote, url } = row.basis;
  if (!showQuotes) {
    return <>公式の紹介に「{TAG_LABEL[tag]}」の手がかりがあるため(<a href={url} {...outLink} className={OUT}>公式ページ<span className="sr-only">(新しいタブで開きます)</span></a>)</>;
  }
  return (
    <>
      公式の言葉「<span lang={isLatinText(quote) ? "en" : undefined}>{quote}</span>」から(札:{TAG_LABEL[tag]}・
      <a href={url} {...outLink} className={OUT}>出典<span className="sr-only">(新しいタブで開きます)</span></a>)
    </>
  );
}

/**
 * 1 体のページの中身(設計書 2-3・6-3)。PC は結果ページと同じ 12 列(左 5 列にロールの記号と合うタイプ、右 7 列に本文)、スマホは 1 列で
 * 「ロール → 公式の言葉 → 傾向 → 合うタイプ → 同じロール → 主ボタン → 出典と権利」の順。4 軸は数字のバー(AxisBars)を使わず言葉の札と根拠の表。
 * データはページが組み立てて渡す(この部品はキャラのデータを import しない)。
 * PC の行は auto・1fr・auto:右の本文が 2 行ぶんにまたがっても、左のロールと合うタイプの間が空かないように 1 行目を詰める。
 */
export function CharProfile({ char, game, role, setting, axisRows, fits, sameRole, sources }: {
  char: Char; game: Game; role: Role | undefined; setting: CharGameSetting;
  /** 相性に入らない(または合うキャラを出さないゲーム)なら null */
  axisRows: readonly CharAxisRow[] | null;
  fits: readonly GamerType[];
  sameRole: readonly CharLink[];
  sources: readonly CharSource[];
}) {
  const matched = axisRows !== null;
  return (
    <div className="grid gap-rl-ma-sm lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] lg:gap-x-6">
      <section aria-label="ロール" className="flex items-center gap-4 lg:col-span-5 lg:row-start-1 lg:self-start">
        <PixelArt grid={roleSymbol(game.id, setting.groupByRole && char.matchable ? char.roleId : null)} size={96} className="size-12 lg:size-24" />
        <div className="grid min-w-0 gap-1">
          <p className="text-sm text-rl-muted">{game.name}{setting.nameMark}</p>
          {setting.groupByRole && <p className="text-xl font-bold wrap-anywhere">{char.officialRole}</p>}
          {setting.groupByRole && setting.styleNote && role && char.matchable && <p className="text-sm text-rl-muted">ロビラボの分け方:{role.name}</p>}
        </div>
      </section>

      <div className="grid min-w-0 content-start gap-rl-ma-sm lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
        {setting.showQuotes ? (
          <figure className="grid gap-2">
            <figcaption className="text-sm font-bold text-rl-muted">公式の言葉</figcaption>
            <blockquote cite={char.quote.url} lang={isLatinText(char.quote.text) ? "en" : undefined} className="border-l-2 border-rl-line-strong pl-4 text-xl text-pretty [word-break:auto-phrase]">
              「{char.quote.text}」
            </blockquote>
            <p className="text-sm text-rl-muted">
              <a href={char.quote.url} {...outLink} className={OUT}>出典:公式サイト<span className="sr-only">(新しいタブで開きます)</span></a>・確認日 {char.checkedAt}
            </p>
          </figure>
        ) : (
          <p className="text-base text-rl-muted">
            公式の紹介は、<a href={char.sourceUrl} {...outLink} className={OUT}>公式のキャラページ<span className="sr-only">(新しいタブで開きます)</span></a>で読めます。
          </p>
        )}

        {axisRows ? (
          <section aria-labelledby="char-lean" className="grid gap-4">
            <SectionHeading id="char-lean" title="このキャラの傾向" description="4 つの軸を、数字でなく言葉で。土台はロールで、公式の言葉に手がかりがある軸だけ少しずらしています。" />
            <ul className="flex flex-wrap gap-2">
              {axisRows.map((r) => (
                <li key={r.axis} className="inline-flex h-11 items-center gap-2 rounded-rl-sm border border-rl-line px-3 text-sm">
                  <span className="text-rl-muted">{r.left}/{r.right}</span>
                  <span className="font-bold">{r.word}</span>
                </li>
              ))}
            </ul>
            <table className="w-full text-sm">
              <caption className="sr-only">傾向の根拠</caption>
              <thead className="text-left text-rl-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-bold">軸</th>
                  <th scope="col" className="py-2 pr-3 font-bold">傾向</th>
                  <th scope="col" className="py-2 font-bold">根拠</th>
                </tr>
              </thead>
              <tbody>
                {axisRows.map((r) => (
                  <tr key={r.axis} className="border-t border-rl-line align-top">
                    <th scope="row" className="py-2 pr-3 text-left font-normal whitespace-nowrap text-rl-muted">{r.left}/{r.right}</th>
                    <td className="py-2 pr-3 font-bold whitespace-nowrap">{r.word}</td>
                    <td className="py-2 wrap-anywhere"><Basis row={r} showQuotes={setting.showQuotes} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <p className="text-base">{setting.unmatchableNote}</p>
        )}
      </div>

      {matched && (
        <section aria-labelledby="char-fit" className="grid content-start gap-4 lg:col-span-5 lg:col-start-1 lg:row-start-2">
          <SectionHeading id="char-fit" title="このキャラが合うタイプ" description="16 タイプのうち、近い順に 3 つ" />
          <ol className="border-t border-rl-line">
            {fits.map((t) => (
              <li key={t.code} className="border-b border-rl-line">
                <Link href={`/type/${t.code}`} className="rl-lock group grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 py-4">
                  <TypeIcon code={t.code} size={48} />
                  <span className="grid min-w-0">
                    <span className="font-display text-sm text-rl-muted">{t.code}</span>
                    <span className="text-xl font-bold wrap-anywhere">{t.name}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-6 text-rl-muted transition-colors group-hover:text-rl-text" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid min-w-0 gap-rl-ma-sm lg:col-span-7 lg:col-start-6">
        {sameRole.length > 0 && (
          <section aria-labelledby="char-same" className="grid gap-2">
            <SectionHeading id="char-same" title={<>同じ「{role?.name ?? "ロール"}」の<span className="inline-block">代表キャラ</span></>} />
            <ul className="flex flex-wrap gap-x-4">
              {sameRole.map((c) => (
                <li key={c.href}><Link href={c.href} className="inline-flex min-h-11 items-center font-bold text-rl-accent underline-offset-4 hover:underline">{c.name}</Link></li>
              ))}
            </ul>
          </section>
        )}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <ButtonLink href="/diagnosis" variant="primary">
            <FlaskConical aria-hidden />
            {matched ? "診断して、自分に合うか見る" : "診断して、自分のタイプを知る"}
          </ButtonLink>
          <ButtonLink href={`/games/${game.id}/chars`} variant="ghost">{game.shortName} のキャラ一覧へ</ButtonLink>
        </div>
        <DexNotices settings={[setting]} checkedAt={char.checkedAt} sources={sources} />
      </div>
    </div>
  );
}
