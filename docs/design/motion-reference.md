# 動きの参考(MOTION LIBRARY から選んだもの)

- 出どころ:社長が 2026-10-02 に共有した MOTION LIBRARY(https://medal-link.pages.dev/motion/、205 種・無料)。
- 使い方:**考え方だけを参考にし、コードは自分たちで書く**(ライセンスの記載がないため写さない)。新しいライブラリは足さない(CSS・SVG・Canvas 2D・Web Animations API・View Transitions だけ)。
- 選び方:コンセプト「なぞって、組み上がる。」の「線」と「マス」に合うものだけ。ガラス・オーロラ・グラデの流れ・紙吹雪・ぷるぷる系は使わない(コンセプトから外れ、安っぽく見える)。
- どれも `prefers-reduced-motion` で止める・置き換える。押した手応えは 120ms、開閉は 200ms の決まりを守る。

| 参考 | 番号 | ロビラボでの使い道 | 担当のタスク |
|---|---|---|---|
| HUD Crosshair Cursor / Corner Brackets Focus | 061 / 028 | 押せるものに照準の角が合う(`rl-lock`、済み)。照準の中の座標の小さな数字は `/aim` の遊ぶ画面だけ | 済み(6A)・Task 8 |
| Pixel Dissolve Hover | 025 | マスの部品(名簿・タイプの絵・入口の行)のホバーで色がマス単位に塗り替わる。1 回 200ms 以内 | Task 10・11・17 |
| Decode Scramble Text | 064 | タイプのコード(ARCH など)が結果で決まる瞬間に、英字がランダムから決まる(Orbitron、400ms 以内) | Task 10A |
| Rolling Odometer Counter | 070 | `/aim` の点数・結果の %・ランキングの点の数え上げ | Task 8・10 |
| Split-Flap Board | 086 | ランキングの順位・名前が入れ替わるとき(更新のときだけ) | Task 8 |
| Stroke-Draw Outline / Handwritten Stroke Draw | 012 / 088 | 漢字が書かれる(S1、済み)。カードの枠・定規・マウスの重ね図の線が引かれて出る | Task 11・16 |
| Copy → Copied | 017 | `CopyButton` のアイコンが変わる(済みの部品を強化) | Task 13・18 |
| Submit → Loading → Success | 009 | `/my` の保存・ロビーの送信ボタンの状態の変化(幅は変えない) | Task 14・15 |
| Hold to Confirm | 015 | 退会など取り消せない操作は長押しで確定(`window.confirm` の代わりにするかは社長に確認) | 保留 |
| Chromatic Aberration Text | 045 | 色ズレの縁(D29、済み)。動きの速さで少し広がる表現はトップの漢字だけ | 済み(7A) |
| Marker Highlight Sweep | 074 | 結果の説明文の大事な 1 か所だけにマゼンタの下線が引かれる | Task 10 |
| Masked Line Reveal | 082 | 長い見出しの行ごとの出し方(1 画面 1 か所まで) | Task 10・11 |
