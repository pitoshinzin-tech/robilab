import type { ReactNode } from "react";
import { AppWindow, CirclePlus, EllipsisVertical, MonitorDown, Share, SquarePlus, type LucideIcon } from "lucide-react";

/**
 * 番号(数字はマゼンタ)+アイコン+文。番号・アイコン・文の 1 行目は同じ行の高さ(24px)にそろえる。
 * 見える番号は読み上げず、代わりに「手順 n:」を読み上げる(list-style のない ol は、Safari の読み上げで番号が消えるため)。
 * サーバーで描くので、文はブラウザの JS に入らない
 */
function Step({ n, icon: Icon, children }: { n: number; icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-start gap-3">
      <span aria-hidden className="w-4 shrink-0 text-sm leading-6 font-bold tabular-nums text-rl-highlight">{n}</span>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-rl-muted" />
      <span className="min-w-0 text-sm leading-6 text-rl-text">
        <span className="sr-only">手順 {n}:</span>
        {children}
      </span>
    </li>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="grid max-w-[40em] gap-3">{children}</ol>;
}

/** iPhone・iPad(Safari 以外のブラウザも同じ共有メニューから追加できる。iOS 16.4 以上) */
export function IosSteps() {
  return (
    <Steps>
      <Step n={1} icon={Share}>共有ボタン(四角から上向きの矢印)を押す。見当たらないときは、下か右上の「…」の中にあります。</Step>
      <Step n={2} icon={SquarePlus}>「ホーム画面に追加」を選ぶ(なければ下にスクロール)。</Step>
      <Step n={3} icon={CirclePlus}>右上の「追加」を押す。</Step>
    </Steps>
  );
}

export function AndroidSteps() {
  return (
    <Steps>
      <Step n={1} icon={EllipsisVertical}>右上の︙メニューを押す。</Step>
      <Step n={2} icon={SquarePlus}>「ホーム画面に追加」か「アプリをインストール」を選ぶ。</Step>
      <Step n={3} icon={CirclePlus}>「インストール」か「追加」を押す。</Step>
    </Steps>
  );
}

export function DesktopSteps() {
  return (
    <Steps>
      <Step n={1} icon={MonitorDown}>アドレスバーの右の、インストールのアイコンを押す。見当たらないときは、右上のメニューの「アプリ」や「保存して共有」の中にあります。</Step>
      <Step n={2} icon={AppWindow}>「インストール」を押す。タスクバーやドックから、別のウインドウで開けます。</Step>
    </Steps>
  );
}

export function OtherBrowserNote() {
  return <p className="text-sm text-rl-muted">このブラウザでは追加できないことがあります。iPhone は Safari、Android と PC は Chrome か Edge で開くと追加できます。</p>;
}
