# マウスパッド探し(`/pads`)の採点

## デバイスの広がり 1 回目(b72cefa・2026-10-03)

- 見たもの:`shots/gear/pads-normal-{375,1440}.png`(全体)・`-first.png`(最初の画面)・`pads-normal-375-list.png`(一覧の行)・`pads-filter-375*.png`(`?surface=glass&size=XL`、2 件)・`pads-zero-375*.png`(`?size=S&thickness=thick`、0 件)・`pads-focus-1440.png`(Tab でチップにフォーカス、Enter のあと)。本番の形、reduced-motion オン、横のはみ出しなし。
- 合格の線:4 観点すべて 8 以上、重みつき平均 8.2 以上。

| 観点 | 重み | 点 | 満たしていない条件 | 根拠 |
|---|---|---|---|---|
| Design | 40% | 7.0 | ②・③ | ① 1440 の「41」120px ÷ 本文 16px = 7.5 倍。② サイズ表の数字(幅×奥行き・厚さ)が白。見出しの件数の Orbitron の「0」が ⊠ に見える。③ サイズ表の列の位置が行ごとに違う(「幅×奥行き」の列が 645〜687px で揺れる)。375 で「公式ページ」が折り返して 16px 下がる。チップを選ぶと並びが入れ替わる。④ 箱は絞り込みだけ(行は線で区切る)。⑤ 引用の左の線・見出しの四角。⑥ 段の外のサイズなし。 |
| Usability | 30% | 7.5 | ①(⑤ 仮) | ① 絞り込んでも一番大きい数字が「41 枚」のまま(2 件・0 件でも)。結果の数は 375 で約 1,240px 下の見出しの横だけ。375 は絞り込みの箱が約 1.5 画面、一覧は 1,190px から、全体 27,174px。② 44px・フォーカスの線は Tab で確認(すべて 44px、2px シアン)。③ 0 件は `EmptyState`+「絞り込みを外す」、データなしの空も用意。④ はみ出しなし。⑥ 自動の動きなし。 |
| Creativity | 20% | 6.5 | ①・②・③ | 「このサイトだけの表現」がない。サイズは文字の表だけで、アートディレクション 2 章の「数字は物の大きさで見せる」(`/mouse` の実寸の重ね図・感度の定規)になっていない。触って答えるのはチップの印だけ。 |
| Content | 10% | 8.0 | — | ① 人気の順の根拠・公式の言葉で速さを点にしない理由。② mm の単位、大きさの目安(S〜XXL の幅の境目)。③ 謝らない・→ なし。④ 0 件で「絞り込みを 1 つ外す」+ボタン。 |
| **重みつき平均** | | **7.15** | | **不合格**(Design 7.0・Usability 7.5・Creativity 6.5) |

### 直すこと(優先順)

1. (P0・Creativity ①〜③・Content)**実寸の縮尺図「パッドの上のマウス」**:新しいサーバーの部品 `src/components/gear/PadScale.tsx`(SVG、JS 0)。そのパッドの全サイズの外形を同じ縮尺(1px = 4mm、最大 1600mm → 400px)で左下をそろえて重ねた**線**(`--rl-line-strong`、1.5px)と、真ん中に平均のマウス(120×63mm の角丸、**面**は `--rl-selected-bg`)を置き、各外形の右上に名前(12px)。大きさ・厚さで絞っているときは合うサイズの線だけ `--rl-selected`、ほかは `--rl-line`。`PadRow.tsx:34-54` の「サイズ(公式)」を `grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,400px)]` にして表の右に置く(375 は表の下、幅いっぱい・高さ `h-32`)。公式の数字がないサイズは描かない(作った数字を出さない)。チップで絞ると線の色が変わる = 触ると答える。
2. (P0・Usability ①)**上の数字を絞り込みに合わせる**:`src/app/pads/page.tsx:51` を `value={matches.length}`、説明を `isPadFilterEmpty(filter) ? "公式の数字で比べられる数" : `絞り込みに合う数(全 ${all.length} 枚)`` に(`/skates` と同じふるまい)。
3. (P1・Usability ①)**375 で絞り込みを畳む**:`page.tsx:54` の `Card` を、`lg` 未満では `<details>`(summary「絞り込み」+今の条件のチップの数、44px)にし、`lg` 以上は開いたまま。一覧が最初の画面から約 1 画面上がる。
4. (P1・Design ③)**表の列をそろえる**:`src/components/gear/PadRow.tsx:39` の `table` に `table-fixed` と `<colgroup>`(名前 35%・幅×奥行き 40%・厚さ 25%)。
5. (P1・Design ②)**表の数字をマゼンタ**:`PadRow.tsx:47-48` の数字のセルを `font-display tabular-nums text-rl-highlight`(「公式の記載なし」は `text-rl-muted` のまま。`padSizeText` / `withUnit` が NO_DATA を返したときだけ分ける)。
6. (P1・全画面)**件数の 0 と 8**:`src/components/ui/section-heading.tsx:15-17` の `sr-only` の「件」を見える `ml-1 text-sm text-rl-muted` にする(数字と単位の組みにすれば記号に見えない)。
7. (P2)「公式ページ」の左の下がり:`src/components/gear/ShopButtons.tsx:21` の ghost を `px-0`(高さ 44px はそのまま)。
8. (P2)チップの並びの入れ替わり:`src/components/ui/chip-link.tsx:15` のチェックを、選んでいないときも `invisible` で場所を取る(`current ? "" : "invisible"`)。
9. (P2)空の説明の 1 文字の行:`src/components/ui/empty-state.tsx:15` に `text-balance [word-break:auto-phrase]`。

- 見込み:1・2 で Creativity 8.0・Usability 8.0、4〜6 で Design 8.0 → 平均 8.0。3 と 7〜9 まで入れて Design 8.5・Usability 8.5 → **約 8.35**。
