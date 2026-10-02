# 規約(`/terms` `/privacy` `/disclosure`)の採点

## 最終(Task 19・794933e)

- 見たもの:`shots/final/terms-{375,1440}.png`。`/privacy` `/disclosure` は同じ `LegalText` の形なので、ソースで同じとみた。
- 合格の線:4 観点すべて 8 以上、重みつき平均 8.2 以上(追補 8-1)。

| 観点 | 重み | 点 | 満たしていない条件 | 根拠 |
|---|---|---|---|---|
| Design | 40% | 7.5 | ①・⑤ | 本文 16px・行間 1.9・640px の列で読みやすい。一番大きい文字は 32px。線かマスの言葉が目次の箱の枠だけ。 |
| Usability | 30% | 8.5 | — | 目次(2 列、44px の高さ)。横スクロールなし。 |
| Creativity | 20% | 7.0 | ①〜③ | このサイトだけの表現がない。 |
| Content | 10% | 8.0 | — | **制定日・最終更新日が出ていない**(`content/legal/terms.md` に日付の行がなく、`LegalText` の `dateLine` が空)。 |
| **重みつき平均** | | **7.75** | | **不合格**(Creativity・Design) |

## 直すこと(優先順)

1. (社長の判断)規約の 3 ページは Creativity と Design ① を「当てはめない」にするか(おすすめ。法律の文に飾りは要らない)。当てはめないなら、Design 8.0・Usability 8.5・Content 8.5(下の 2 のあと)で、3 観点の重みを足し直した平均は約 8.25 で合格。
2. (P0)`content/legal/terms.md` の 1 行目の下に「制定日:2026年○月○日」(日付は社長に確認)。`privacy.md` も同じ。
3. (P1・当てはめるとき)線の言葉と「触ると答える」:`src/components/legal/LegalText.tsx:46` の h2 に `border-b border-rl-line pb-2`、`:target` のときだけ下の線をマゼンタで左から引く CSS(`.rl-legal-h:target::after`、`rl-draw-line` と同じ 200ms・reduced-motion で即)。目次のリンク(`:38`)に `rl-lock`。JS は 0。
