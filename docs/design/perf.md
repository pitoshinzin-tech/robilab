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

## 1 回目の測り直し(2d881fb のあと・同じ条件)

| ページ | LCP | CLS |
|---|---|---|
| `/` | 3,528ms(`SECTION.rl-hero-ground`・FCP = LCP = 3,560) | 0 |
| `/diagnosis` | 3,016ms | 0 |
| `/type/ARCH` | 3,120ms | 0 |
| `/type/ARCH?axes=…` | 3,152ms | 0 |
| `/aim` | 3,880ms | 0.018 |
| `/mouse` | 2,820ms | 0 |

CLS はほぼ 0 になったが、LCP はあまり縮まなかった。`/` の読み込みの順(ナビゲーションの開始からの ms):

- フォントの CSS(gzip 95KB)190 → 2,278。描画を止める CSS の最後。
- 本文の CSS(16KB)192 → 745、Orbitron の先読み(12KB)190 → 667。
- JS のチャンク(約 300KB)が 193 → 2,237 で、CSS と同時に回線を取り合っていた。
- Zen Kaku の字のファイル 11 本(6〜18KB)が 2,709 → 3,530。FCP は 3,560。

## 2 回目の直し

### 確かめたこと:フォントの読み込みは描画を止めていない

- ビルドした CSS の `@font-face` は、Zen Kaku・Orbitron ともすべて `font-display: swap`(363 個すべて)。swap は「待たずに代わりの書体で描く」なので、フォントの到着を待って描画が止まることはない。
- FCP が字のファイルの届いた直後になったのは、その間(CSS が届いた 2,278 → 3,560)に、先に届いていた JS(約 300KB)の解析・実行・ハイドレーションが CPU 4 倍遅延で続き、描画の機会がなかったためとみる(FCP の前の長い処理は TBT に数えられないので、TBT は小さく出る)。
- このため「フォントを待たない」ための変更(`display: "optional"` など)はしない。`optional` は初めて来た人にはずっと代わりの書体で出す(ブランドの見た目が変わる)うえ、FCP は縮まない。CLS は 1 回目の直しで 0 になったので、swap のままにする。

### 1. Supabase のクライアントを、使う時に読む(`src/lib/supabase/lazy.ts`)

- ヘッダーの通知(`Bell`、レイアウトにあるので全ページ)が `@supabase/ssr` を静的に import していて、**gzip 約 67KB(元の大きさ 258KB)の Supabase の JS が全ページの最初の JS に入っていた**。CSS と回線を取り合い、最初の描画の前に解析・実行されていた。
- `loadSupabaseBrowser()`(`import("./client")` で読んでから `createSupabaseBrowser()` と同じクライアントを返す)を足し、`Bell`・`AimClient`・`MouseClient`・`LoginButton` をこれに替えた。どれも effect の中か押したときに使うので、動き・データの流れは同じ(読むのがハイドレーションのあとになるだけ)。`useMySettings`(`/my` だけ)はそのまま。
- `/` の最初の JS(gzip・`noModule` の polyfill を除く):251KB → 179KB(下の 2・3 と合わせて)。

### 2. トップのボタンを base-ui なしに

- `HeroKanji` の「1 画なぞってみる」を `ui/button` の `Button`(base-ui の `useButton`)から、同じ見た目の `PlainButton`(ふつうの `<button>`)へ。
- `src/app/page.tsx` の `ButtonLink` を `ui/button` ではなく `ui/button-link` から読む(`ui/button` を import するだけで base-ui のボタンがブラウザの JS に入るため。js-budget.md の Task 10 と同じ)。
- `/` から base-ui のボタンのチャンク(gzip 約 9KB)がなくなった。

### 3. Zen Kaku の 900 を読まない(描画を止める CSS を 1/3 減らす)

- `weight: ["500", "700"]` にした。フォントの CSS:273KB(gzip 96KB)→ 183KB(gzip 64KB)。`/` で読む 900 の字のファイルもなくなる。
- 日本語を 900 で出していたのは、ヘッダーの「ロビラボ」(20px)とトップの縦組みの「今日の文字」(20px)の 2 か所だけ。ここは `.rl-black`(700 + 同じ色の縁 `-webkit-text-stroke: 0.03em`)にした。
  - 900・700・700+縁(0.02/0.03/0.04em)を Zen Kaku で並べて描いて比べた(`docs/design/perf-zen-900-vs-700-stroke.png`)。0.03em が 900 とほぼ同じ太さ。字の形のわずかな違い(900 は角の内側の空きが少し狭い)は 20px では見分けにくい。
  - 縁は字の幅を変えないので、行の長さ・位置は変わらない。
  - 戻すときは `layout.tsx` の weight に "900" を足し、2 か所を `font-black` に戻す。
- 英字の Orbitron の `font-black` `font-extrabold`(タイプのコード・数字)は可変のフォントなので、今までどおり。
- 本文の 500 はやめない(500 がないと、太さを書いていない本文(400)が 700 で出てしまう)。

### 見込み

- 描画の前に要るもの:HTML(gzip 37KB)+ CSS(64KB + 16KB)+ Orbitron(12KB)。回線を取り合う JS は 251KB → 179KB。最初の描画の前に実行する JS も Supabase の分(元の大きさ 258KB)減る。
- `/`:FCP・LCP 3.5 秒 → 2.3〜2.6 秒の見込み。`/type/ARCH`・`/diagnosis` も同じくらい縮む(フォントの CSS と Supabase はレイアウトの分なので全ページ共通)。`/aim`(3.9 秒)は `AimClient` の Supabase も外れるので縮む。`/mouse` は 2.5 秒前後。
- まだ 2.5 秒を超えるページがあれば、次の候補:
  - クライアントの `cn`(`cn` パッケージの表。gzip 約 28KB のチャンクの大半)を、トップのクライアントの部品だけ clsx 相当にする(クラスの上書きの確かめが要る)。
  - `/` のドット絵の `<rect>` 2,820 個(HTML と RSC の両方に入る)を行ごとの `<path>` にまとめる(S2 の行ごとの動きに合わせる必要がある)。

### `/` の LCP が `SECTION.rl-hero-ground` のままでよい理由

- ノイズは `data:` の SVG で回線を使わず、最初の描画と同時に描かれる(1 回目の測り直しでも FCP = LCP)。地を文字に替えても LCP は FCP より早くならないので、見た目を守ってそのままにする。最初の描画を早めることが LCP を早めることと同じ。

## 2 回目の測り直しの結果

(コントローラーが測り直して、ここに書く)
