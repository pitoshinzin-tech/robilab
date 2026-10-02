# 見せ場の JS の重さ(追補 3 章:全部で 12KB・1 つ 4KB まで。gzip)

測り方は実装計画の Global Constraints のコマンド(`.next/static/chunks` の .js を gzip した合計)。

| タスク | 合計(KB) | 前からの差(KB) | メモ |
|---|---|---|---|
| Task 6A の前(基準) | 470.8 | 0 | |
| Task 6A | 471.7 | +0.9 | 土台(CSS・フック・TypeIcon の行のまとまり)。増えた分はほぼ開発用の `/dev/ui` の見本(ドット絵のデータ) |
