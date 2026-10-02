# 感度計算(`/tools/sensitivity`)の採点

## 最終(Task 19・794933e)

- 見たもの:`shots/final/sens-{375,1440}.png`(初めの値 800 / 0.35 の答えが出た状態)。範囲外・振り向きが画面より長い状態は写真なし(ソースの `isInGameRange`・`turnTextClass`・`TurnRuler` の「あと 35.7cm」で確認)。
- 合格の線:4 観点すべて 8 以上、重みつき平均 8.2 以上(追補 8-1)。

| 観点 | 重み | 点 | 満たしていない条件 | 根拠 |
|---|---|---|---|---|
| Design | 40% | 8.0 | ②(小) | 振り向き「46.65cm」は display-1、実寸の定規(線の言葉)。ほかのゲームの 6 行は同じ種類の一覧なので箱でよい。ただ、6 行の数字が白(`font-display` だけ)で、数字はマゼンタの決まりから外れる。 |
| Usability | 30% | 7.5 | ① | シアンの主ボタンが 0 個。この画面でただ 1 つの操作「マイ設定に保存」が secondary。 |
| Creativity | 20% | 8.5 | — | 実寸の定規(伸び縮み 012)、入力を変えたときだけ回る数(070)。 |
| Content | 10% | 8.0 | ② | ほかのゲームの数字に「何の数か」がない(感度か、eDPI か)。 |
| **重みつき平均** | | **7.95** | | **不合格**(Usability 7.5) |

## 直すこと(優先順)

1. (P0)`src/app/tools/sensitivity/SensitivityClient.tsx:102` の `PlainButton variant="secondary"` を `variant="primary"`。
2. (P0)`SensitivityClient.tsx:118` の数字を `font-display text-base tabular-nums text-rl-highlight` にし、見出し(`:111`)の `SectionHeading` に `description="同じ振り向き(46.65cm)になるゲーム内の感度"`(数は `results.cm` から作る)。
3. (P2)範囲外・とても長い振り向きの写真(375)。

- 見込み:1・2 で Usability 8.5・Content 8.5・Design 8.0 → 平均 8.3。合格。

---

## 最終 2 回目(c3d5036・bde9381 のあと)

- 見たもの:`shots/final2/` の 375・1440(本番ビルド、CDP の端末の真似、全体、reduced-motion オン、横のはみ出しなし)。 `sens-filled` は `sens` と同じ写真(保存した設定が入らなかった)。範囲外の形はソースで見た。

| 観点 | 点 | 最終 1 回目 | 根拠 |
|---|---|---|---|
| Design | 8.0 | 8.0 | ほかのゲームの数字がマゼンタになり、色の役割の違反は 0。 |
| Usability | 8.5 | 7.5 | 「マイ設定に保存」がシアンの主ボタン 1 つ。 |
| Creativity | 8.5 | 8.5 | 変わらず。 |
| Content | 8.5 | 8.0 | 見出しの下に「同じ振り向き(46.65cm)になるゲーム内の感度」。 |
| **平均** | **8.30** | 7.95 | **合格** |

- 残り:なし(P2 で範囲外・とても長い振り向きの写真)。
