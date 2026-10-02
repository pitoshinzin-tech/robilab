# 見せ場の JS の重さ(追補 3 章:全部で 12KB・1 つ 4KB まで。gzip)

測り方は実装計画の Global Constraints のコマンド(`.next/static/chunks` の .js を gzip した合計)。

| タスク | 合計(KB) | 前からの差(KB) | メモ |
|---|---|---|---|
| Task 6A の前(基準) | 470.8 | 0 | |
| Task 6A | 471.7 | +0.9 | 土台(CSS・フック・TypeIcon の行のまとまり)。増えた分はほぼ開発用の `/dev/ui` の見本(ドット絵のデータ) |
| Task 7A の前(9a94711・Task 7 のあと) | 474.3 | +2.6 | Task 7 のトップ作り直しの分(見せ場ではない。`.next` を消してから測り直した値) |
| Task 7A | 476.4 | +2.1 | 見せ場 S1。`HeroKanji`(照準・お試しの 1 画)と `hero-trace`。線を引くのは CSS なので JS は 0。`KanjiStrokes` の `cn` を `@/lib/utils` にそろえた(`cn` パッケージ本体の表 約 14KB がブラウザに入るのを防ぐ。入れたままだと +18.0KB) |
