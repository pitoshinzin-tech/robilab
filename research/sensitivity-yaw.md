# 感度計算ツール用:ゲームごとの感度係数(yaw)調査

調査日:2026-09-26
目的:ロビラボの感度計算ツール(振り向き cm・ゲーム間の換算・eDPI)で使う係数を決める。

## 前提

- **yaw** = 感度 1.0 で、マウスの 1 カウントあたりに視点が回る角度(度)。
- 振り向き cm = 360 ÷ (DPI × 感度 × yaw) × 2.54
- 換算 = 元の感度 × (元の yaw ÷ 換算先の yaw)
- eDPI = DPI × 感度(yaw がゲームごとに違うため、**eDPI は同じゲームの中でしか比べられない**点を UI で伝えたい)
- v0.1 は腰だめ(hipfire)だけを扱う想定。ADS やスコープは対象外。

### 検証の方法

「情報源の数」は yaw の値を明記しているか、値を逆算できる情報源の数です。
mouse-sensitivity.com(実測で係数を出している、最も有名な換算ツール)は yaw を公開していません。そこで、各ゲームのページにある「DPI ごとのおすすめ感度(20〜80 cm/360 になる範囲)」から逆算しました。

例:VALORANT の 800 DPI の下限は 0.204(= 80 cm)。
yaw = 914.4 ÷ (80 × 800 × 0.204) = 0.0700 で、公表値の 0.07 と一致します。

## 1. ゲームごとの表

| # | ゲーム | yaw(度/カウント) | 感度の範囲(最小〜最大、初期値) | 情報源の数 | 信頼度 | 注意点 |
|---|---|---|---|---|---|---|
| 1 | Overwatch(旧 オーバーウォッチ2) | **0.0066** | 0.01〜100、初期値 15 | 4(xbitlabs、recharge、SensConverter、mouse-sensitivity 逆算) | ◎ | 2026年2月に「2」が外れ、名前が「Overwatch」に戻った。表示名は「オーバーウォッチ」にするのがよい。係数は変わっていない。ヒーロー別の感度やズーム時の相対感度は別の設定(v0.1 では対象外)。 |
| 2 | VALORANT | **0.07** | 0.01〜10、初期値 1 | 4(recharge、SensConverter、検索結果の複数ツール、mouse-sensitivity 逆算) | ◎ | 小数第3位まで入力するのが一般的(例:0.314)。桁数の上限は未確認。スコープ感度は倍率(初期値 1)で別の設定。 |
| 3 | Apex Legends | **0.022** | 0.2〜20、初期値 5(mouse-sensitivity 表記) | 4(recharge、SensConverter、検索結果の複数ツール、mouse-sensitivity 逆算) | ◎ | CS2 と同じ係数なので 1:1 で換算できる。ADS は倍率ごとに別の設定(対象外)。設定ファイルを直接編集すると範囲外の値も使える。 |
| 4 | Counter-Strike 2 | **0.022** | 0.01〜8(メニュー)、初期値 1.25 | 4(recharge、SensConverter、検索結果の複数ツール、mouse-sensitivity 逆算) | ◎ | Source エンジンの `m_yaw 0.022` が既定。コンソールでは 8 を超える値も入力できる。`m_yaw` を変えている人は例外。 |
| 5 | Fortnite | **0.005555**(%の数字1あたり) | 1〜100 %(mouse-sensitivity 表記)、初期値 28 %(同) | 3(recharge、検索結果の複数ツール、mouse-sensitivity 逆算) | ○ | ゲーム内では「X 軸の感度 6.4 %」のように%で表示される。**%の数字をそのまま入力し、yaw 0.005555 を使う**(小数で書く 0.064 を使う場合は yaw 0.5555)。X と Y は別の設定なので、計算には **X(横)** を使う。ターゲット時/スコープ時の感度は X/Y に対する%(対象外)。小数第1位まで(例:6.4 %)が一般的だが、最小・最大は公式の情報では未確認。 |
| 6 | Rainbow Six Siege(Siege X) | **0.00572958**(MouseSensitivityMultiplierUnit が初期値 0.02 のとき) | 1〜100 の整数、初期値 50(Ubisoft 公式)。mouse-sensitivity は最大 200 と表記 | 3(Ubisoft 公式の式、SensConverter、recharge ほか) | ○ | 公式の式は「腰だめの yaw = 入力 yaw × (MouseSensitivityMultiplierUnit × 横の感度)」。**設定ファイル `GameSettings.ini` の倍率(初期値 0.02)を変えていると係数が変わる**ため、プロの間では変えている人が多い。感度は整数なので、換算した結果は丸めて誤差が出る(下の検算を参照)。横と縦は別の設定なので、計算には横を使う。ADS は倍率ごとに別の設定。最大値(100 か 200 か)は未確認。 |
| 7 | Call of Duty(Black Ops 7 / Black Ops 6 / Warzone) | **0.0066** | 0.01〜99(mouse-sensitivity の BO6/7 表記)、初期値 8。別の資料では 0.01〜100 | 4(recharge、SensConverter、検索結果の複数ツール、mouse-sensitivity 逆算) | ◎ | Overwatch と同じ係数(1:1)。ADS は倍率と「モニター距離の係数」で決まる(対象外)。最大値(99 か 100 か)は未確認。 |
| 8 | Marvel Rivals | **0.0175**(推奨) | 0.01〜40、初期値 4(mouse-sensitivity 表記) | 2(xbitlabs が 0.0175 と明記、mouse-sensitivity からの逆算で 0.01742〜0.01748) | △ | **情報源の間で値が一致しない**。SensLab は 0.022、recharge は 0.0066 と書いているが、どちらも根拠が示されていない。実測をしている mouse-sensitivity から逆算した値が xbitlabs の 0.0175 と一致するため、0.0175 を採用するのがよい。公開する前に実機で確認したい。ヒーロー別の設定(ブラックウィドウの ADS など)は対象外。 |
| 9 | PUBG: BATTLEGROUNDS | **未確認** | 0〜100、初期値 50(スライダー) | — | △ | スライダーと実際の感度の関係が**直線ではない**。コミュニティの式では 設定ファイルの値 = 0.002 × 10^(スライダー ÷ 50)。recharge の「0.002222」はスライダーの値に掛けて使うのか、設定ファイルの値に掛けて使うのかが書かれていない。mouse-sensitivity から逆算すると、設定ファイルの値1あたり約 2.48(FOV の初期値のとき)になり、0.002222 とは合わない。FOV によっても変わる。**v0.1 では入れない。** |
| 10a | THE FINALS | **未確認**(0.001 か 0.0066) | 1〜100、初期値 50(mouse-sensitivity 表記) | 2(ただし値が合わない) | △ | SensConverter などは 0.0066 と書いている。一方、mouse-sensitivity のおすすめ表(800 DPI で 14〜57)から逆算すると約 0.001 になる。**v0.1 では入れない。** |
| 10b | Deadlock | 0.044 | 未確認 | 2(recharge、検索結果) | ○ | 日本での人気は限られる。次の版の候補。 |
| 10c | Delta Force | 未確認 | 横の感度 0.1〜6、マウス感度 0.1〜50 など、設定が複数ある | 1 | — | 感度が複数の設定の掛け算で決まる(「モニター距離の係数」もある)。1つの yaw では表せない。**入れない。** |
| 10d | Escape from Tarkov | 約 0.125(概算) | 未確認 | 1 | △ | 1つの資料が概算として書いているだけ。**入れない。** |

### 2026年時点の変更について

- 調べた範囲では、2025〜2026年のアップデートで**係数(yaw)が変わったという報告は見つからなかった**。
- Overwatch は 2026年2月10日から名前が「Overwatch」(「2」なし)になったが、感度の仕組みは変わっていない。
- Rainbow Six Siege は 2025年の Siege X 以降も、Ubisoft 公式の式(倍率 0.02、スライダー 1〜100)が使われている。ただし、Siege X での細かい変更は ProSettings の記事でも「まだ反映されていない」とされており、未確認。

## 2. v0.1 に入れるおすすめのゲーム

**入れる(信頼度 ◎、係数が1つで決まる)**

1. Overwatch(オーバーウォッチ):0.0066
2. VALORANT:0.07
3. Apex Legends:0.022
4. Counter-Strike 2:0.022
5. Call of Duty(BO7 / BO6 / Warzone):0.0066

**条件付きで入れる(○、UI で補足が必要)**

6. Fortnite:0.005555。入力欄を「X 軸の感度(%)」にし、「%の数字をそのまま入力」と書く。
7. Rainbow Six Siege:0.00572958。「GameSettings.ini の MouseSensitivityMultiplierUnit が 0.02(初期値)の場合」と書く。換算先に選んだときは、整数に丸めた値と、そのときの実際の振り向き cm を並べて表示する。

**実機で確認してから入れる(△)**

8. Marvel Rivals:0.0175。日本での人気が高いので優先度は高いが、情報源の間で値が一致しない。実機で 360° の距離を測ってから公開する。

**v0.1 では入れない**

- PUBG、THE FINALS、Delta Force、Escape from Tarkov(係数を確定できない、または仕組みが複雑)
- Deadlock(値はほぼ確かだが、日本での需要が小さい。次の版で検討)

### 実装上のメモ

- 感度の入力は小数第3位までを想定する(VALORANT の 0.314 など)。換算結果は、ゲームごとに表示する桁数を決めておく(R6 は整数、Fortnite は小数第1位など)。
- 係数はコードに直接書かず、データ(ゲームの ID、yaw、範囲、桁数、注意書き)としてまとめて持つ。こうしておけば、アップデートで係数が変わったときに1か所を直せば済む。

## 3. 検算の例

**条件:VALORANT 感度 0.35、800 DPI**

- eDPI = 800 × 0.35 = **280**
- 振り向き = 360 ÷ (800 × 0.35 × 0.07) × 2.54 = 360 ÷ 19.6 × 2.54 = **46.65 cm**

**他のゲームへの換算**(元の yaw 0.07 を換算先の yaw で割る)

| 換算先 | 計算 | 換算後の感度 | 振り向きの確認 |
|---|---|---|---|
| Overwatch | 0.35 × 0.07 ÷ 0.0066 | **3.7121**(表示 3.71) | 3.71 で 46.68 cm |
| Call of Duty | 同上 | 3.7121 | 46.65 cm |
| CS2 / Apex | 0.35 × 0.07 ÷ 0.022 | 1.1136 | 46.65 cm |
| Fortnite | 0.35 × 0.07 ÷ 0.005555 | 4.41 % | 46.65 cm |
| Marvel Rivals | 0.35 × 0.07 ÷ 0.0175 | 1.40 | 46.65 cm |
| Rainbow Six Siege | 0.35 × 0.07 ÷ 0.00572958 | 4.276 → 整数にすると **4** | 4 で 49.87 cm(5 なら 39.90 cm) |

(参考)CS2 の初期値:感度 1.25、800 DPI で振り向き 41.56 cm。

いずれも Node.js で計算して確かめました。R6 は整数でしか入力できないため、DPI を変えるか倍率を変えないと同じ距離にできません。この点は UI で伝える必要があります。

## 4. 出典 URL

- mouse-sensitivity.com(範囲、初期値、おすすめ表から yaw を逆算)
  - https://www.mouse-sensitivity.com/n/overwatch/
  - https://www.mouse-sensitivity.com/n/valorant/
  - https://www.mouse-sensitivity.com/n/apex-legends/
  - https://www.mouse-sensitivity.com/n/cs2/
  - https://www.mouse-sensitivity.com/n/fortnite/
  - https://www.mouse-sensitivity.com/n/rainbow-6-siege/
  - https://www.mouse-sensitivity.com/n/call-of-duty-black-ops-6/
  - https://www.mouse-sensitivity.com/n/marvel-rivals/
  - https://www.mouse-sensitivity.com/n/pubg-battlegrounds/
  - https://www.mouse-sensitivity.com/n/the-finals/
  - https://www.mouse-sensitivity.com/n/delta-force/
  - PUBG のスライダーの式:https://www.mouse-sensitivity.com/forums/topic/8889-i-am-a-game-dev-and-i-cant-for-the-life-of-me-figure-out-the-correlation-between-lastconvertedsensitivity-in-game-sensitivity-in-pubg/
- Ubisoft 公式(R6 の感度の式):https://www.ubisoft.com/en-gb/game/rainbow-six/siege/news-updates/6kY6b5JByBY3P6vQWWinla/fov-and-input-sensitivity
- ProSettings(R6 の倍率、Siege X):https://prosettings.net/guides/rainbow-six-options/
- SensConverter(yaw の一覧):https://sensconverter.vercel.app/guides/what-is-mouse-yaw
- recharge.com(23 本のゲームの yaw):https://www.recharge.com/blog/en-gb/mouse-sensitivity-converter-calculator-for-23-fps-games
- xbitlabs
  - Marvel Rivals:https://www.xbitlabs.com/sensitivity-converter/marvel-rivals/
  - Overwatch 2:https://www.xbitlabs.com/sensitivity-converter/overwatch-2/
- SensLab(Marvel Rivals は 0.022 と記載。ほかと一致しない):https://senslab.pro/guides/marvel-rivals-sensitivity
- SensConverter(Black Ops の yaw):https://sensconverter.vercel.app/games/cod-bo
- Overwatch の名前の変更
  - https://dotesports.com/overwatch/news/blizzard-overwatch-2-rename
  - https://videocardz.com/newz/overwatch-2-is-now-just-overwatch
- SensLab(THE FINALS は 0.0066 と記載):https://senslab.pro/guides/the-finals-sensitivity
