# PWA 段 1 の確かめ(コントローラー、2026-10-03)

- 見出し(curl):`/sw.js` は CSP `default-src 'self'; script-src 'self'`・`no-cache, no-store, must-revalidate`・`application/javascript`。`/manifest.webmanifest` は `application/manifest+json`。`/` の CSP に worker-src・manifest-src。`/` の Cache-Control は前のまま(no-store は漏れていない)。
- Application タブ相当(内蔵ブラウザで JS):登録 scope `/`・`/sw.js` が activated。Navigation Preload は enabled: false。Cache Storage は `robilab-offline-v2` に `/offline.html`・`/icons/icon-192.png` の 2 つだけ。manifest は name/short_name「ロビラボ」・start_url `/`・standalone・アイコン 192/512/maskable 512・ショートカット `/aim` `/lobby` `/mouse`。head に manifest・apple-touch-icon(180)・theme-color #0A0C16・viewport-fit=cover。
- 個人のページ(`/lobby` `/my` `/aim` `/mouse` `/pads`)を開いたあともキャッシュは 2 つのまま。
- オフライン:サーバーを止めて `/mouse` を開くと、URL はそのままで「電波が届いていません|ロビラボ」の画面(見出し・説明・「もう一度読み込む」)。
- 未確認(社長の実機):インストールのボタン、iPhone のアプリ表示での Discord ログインの往復(`/auth/callback` が 1 回だけ)、ショートカット。
