# 表示速度(スマホの LCP 2.5 秒以内)

目標:スマホの LCP 2.5 秒以内(Lighthouse に近い条件)。見た目は変えない。

## 測り方

本番のビルド(`next start`)を、画面なしの Edge で測る(CDP:375×812・DPR 2・スマホ+タッチ、回線 約 1.6Mbps・RTT 150ms、CPU 4 倍遅延、キャッシュなし)。
測る道具は CEO の作業フォルダの `perf.mjs`(`node perf.mjs <url>`)。

## 直す前(2026-10-03)

| ページ | LCP | LCP の要素 | CLS | TBT |
|---|---|---|---|---|
| `/` | 4,136ms | `SECTION.rl-hero-ground` | 0.069 | 6ms |
| `/diagnosis` | 3,128ms | `H1` | 0 | — |
| `/type/ARCH` | 3,844ms | タイプのコード(`P.font-display`) | 0.004 | — |
| `/aim` | 3,456ms | `P.text-sm` | 0.002 | — |
| `/mouse` | 2,980ms | `P.text-xs` | 0.001 | — |

TBT は小さい。遅いのは「最初の描画」そのもの。

## 原因:日本語のフォントの先読みが 240 ファイル(約 2.8MB)

- `next/font/google` の Zen Kaku Gothic New(500・700・900)は、Google の日本語の CSS のとおり 1 つの太さが約 120 のファイル(文字の範囲ごと)に分かれる。
- next/font は「CSS の中のコメントで、どの subset のファイルか」を見て先読み(`<link rel="preload">`)を決める(`node_modules/next/dist/compiled/@next/font/dist/google/find-font-files-in-css.js`)。日本語のフォントではこの判定がずれ、**700 と 900 の全部のファイル(240 本・2,824,952 バイト)を、全ページの `<head>` で先読み**していた(`subsets: ["latin"]` を書いても)。
- 遅い回線では、この 2.8MB が CSS・HTML と回線を取り合い(localhost は HTTP/1.1 で同時 6 本)、描画に要る CSS が後回しになって最初の描画が遅れていた。LCP の要素が何であっても、最初の描画が遅いので全部のページが遅かった。
- そのうえ `/` の HTML は先読みの行だけで約 60KB 増えていた(747KB → 685KB、gzip 49KB → 37KB)。

## 直したこと

### 1. Zen Kaku Gothic New を先読みしない(`src/app/layout.tsx` の `preload: false`)

- 先読みは Orbitron(英字・可変の 1 ファイル)だけになる。各ページの先読みのフォントは 240 本 → 1 本。
- 日本語のフォントは、CSS の `unicode-range` で、そのページで実際に使う字のファイルだけを描画のあとに読む(今までもそうだったが、先読みの 2.8MB が先に回線を埋めていた)。
- `display: "swap"` はそのまま。文字は代わりの書体で先に出て、届いたら Zen Kaku に入れ替わる。テキストの LCP は最初に描けた時刻で決まるので、フォントの到着を待たない。
- 太さ(500・700・900)は変えない(見た目を変えないため)。

**見込み**:全ページで最初の描画が速くなる。描画に要るのは HTML(`/` で gzip 約 37KB)+ CSS 2 本(gzip 約 96KB + 15KB)だけになり、1.6Mbps で 0.7 秒前後+往復の時間。`/` 4.1 秒 → 2 秒前後、`/type/ARCH` 3.8 秒 → 2 秒前後、`/aim` `/diagnosis` `/mouse` も 2 秒台前半以下の見込み(測り直しで確かめる)。

### 2. フォントが届くまでの日本語の書体を、かなが全角の幅のものにする(`src/app/globals.css` の `--rl-font-ja-fallback`)

- 今までは `var(--font-zen), system-ui` で、Zen Kaku が届くまでの日本語は system-ui。Windows では Yu Gothic UI(かなが詰まった UI 用の書体)になり、Zen Kaku(かなが全角)に入れ替わるときに行が折り直されて、下の段が動く(`/` の CLS 0.069 の主な原因とみる)。
- `--font-sans` `--font-heading` `--font-display` の Zen Kaku のすぐあとに、かなが全角の日本語の書体(Hiragino Sans・Hiragino Kaku Gothic ProN・Yu Gothic・Noto Sans JP・Noto Sans CJK JP・Meiryo)を置いた。どれもない端末は今までどおり system-ui。
- 英数字は、next/font が作る寸法合わせ済みの代わり(`Zen Kaku Gothic New Fallback` = Arial を Zen Kaku の寸法に合わせたもの)が `--font-zen` の中で先に効くので、そのまま。
  - next/font の `fallback` で書くと、この寸法合わせの代わりが消えて英数字がずれやすくなるので、`globals.css` の変数にした。
- Zen Kaku が届いたあとの見た目は変わらない。変わるのは、届くまでの短い間の日本語の書体だけ。

**見込み**:`/` の CLS 0.069 → 0.02 前後(行の折り直しが減る分。測り直しで確かめる)。

## 直さなかったことと理由

### `/` の LCP が `SECTION.rl-hero-ground` になること

- ヒーローの地の粒状のノイズは、`globals.css` の `.rl-hero-ground` の `data:` の SVG(feTurbulence・160px のタイル)。CSS の `url()` の背景は「画像」なので LCP の候補になり、ヒーロー全体の大きさで数えられる。
- ただし `data:` なので回線を使わず、最初の描画と同じ時刻に描かれる。つまりこの場合の LCP ≒ 最初の描画で、文字を LCP にしても LCP は早くならない(文字も同じ最初の描画で出る)。遅かったのは最初の描画そのもの(上の原因)。
- 見た目を変えないため、ノイズはそのまま。もし測り直しで「最初の描画より明らかに遅い」と分かったら、ノイズを `::before` に移すか、地の面積を小さくする案を考える。

### `/type/[code]` のコードの `.rl-mask-rise`

- このせり上がりは `?axes=` が正しいとき(診断から来たとき)だけ付く。測った `/type/ARCH`(`?axes=` なし)では動きは付いておらず、LCP 3.8 秒はフォントの先読みが原因。
- 診断から来るときは画面の中の移動(ソフトナビゲーション)なので、LCP は測られない。`?axes=` 付きの URL を直接開いたとき(再読み込みなど)だけ、コードが最大 520ms(待ち 120ms+動き 400ms)遅れて見える。Chrome の LCP は文字が「見える大きさで最初に描かれた時」に記録するので、隠れている間は候補にならず、ほかの要素(名前・キャッチコピー)が LCP になる見込み。
- S2 の芯の動き(マスクの中からせり上がる)を変えないため、今回はそのまま。測り直しで `?axes=` 付きを直接開いたときに LCP が 2.5 秒を超えるなら、「最初から見えていて transform だけ動かす」に変える(見た目が少し変わるので社長の確認が要る)。

### CSS の大きさ

- フォントの CSS(`@font-face` 364 個)が 273KB(gzip 約 96KB)で、描画を止める CSS の大半。Zen Kaku の 1 つの太さが gzip 約 32KB。
- 減らすには太さを減らすしかない。900 を使っているのはヘッダーの「ロビラボ」と、トップの縦組みの「今日の文字」だけ(ほかの `font-black` `font-extrabold` は英字の Orbitron)。900 をやめると約 32KB(1.6Mbps で約 0.16 秒)減るが、ロゴの文字が細くなるので、今回はやめない(社長の判断が要る)。
- 本文の CSS は 77KB(gzip 15KB)で問題ない。

### そのほか確かめたこと

- `<img>` はすべて `width` `height` 付き(`TypeIcon` `MouseCard` `CardPreview` `/type` のシェア画像)。
- 描画を止める JS はない(Next の JS は async)。
- `/` の HTML は gzip 37KB。半分以上はドット絵の `<rect>`(16 タイプ+入口の 3 つ、塗り替えの重ねを含めて 2,820 個)。gzip でよく縮むので、今回はそのまま。CPU が遅い端末で重いと分かったら、ドット絵を行ごとの 1 本の `<path>` にまとめる案(見た目は同じ)。

## 測り直しの結果

(コントローラーが測り直して、ここに書く)
