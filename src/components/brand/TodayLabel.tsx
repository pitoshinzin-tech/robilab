import { cn } from "@/lib/utils";

/**
 * 追補 4-4:漢字の右に縦組みで「今日の文字」と日付・画数(書道の落款の位置)。縦組みはサイトでここだけ。
 * 数字は縦の中の横組み(text-combine-upright)。読み上げには今日の字も伝える。
 */
export function TodayLabel({ as: Tag = "p", id, glyph, date, strokes, className }: {
  as?: "h1" | "h2" | "p"; id?: string; glyph: string; date: string; strokes: number; className?: string;
}) {
  const [, month, day] = date.split("-").map(Number);
  const tcy = (n: number) => <span className="[text-combine-upright:all]">{n}</span>;
  return (
    <Tag id={id} className={cn("flex shrink-0 gap-2 [writing-mode:vertical-rl]", className)}>
      <span className="text-xl font-black leading-none">今日の文字<span className="sr-only">「{glyph}」</span></span>
      <span className="text-sm font-bold text-rl-muted">
        <time dateTime={date}>{tcy(month)}月{tcy(day)}日</time>・{tcy(strokes)}画
      </span>
    </Tag>
  );
}
