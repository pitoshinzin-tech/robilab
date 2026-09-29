# SDD ledger — plan: docs/superpowers/plans/2026-09-29-my-settings.md

Spec: docs/superpowers/specs/2026-09-29-my-settings-design.md
Branch: feat/my-settings (from feat/v0.1-part2 @ b669fc3)
Task 0: complete (branch created by controller; no code)

## Pre-flight scan

| Tasks | Produces → consumes | Finding |
|---|---|---|
| T1→T2,T3,T4,T5,T7 | MySettings, ItemRef, DeviceSlot, CATALOG_ID_RE, MY_SETTINGS_LIMITS, validate/parse, normalizeText | consistent |
| T1→T4 | MY_SETTINGS_LIMITS vs SQL c_* constants (parity test in T4) | consistent (50/64000/10/25/5/15/40/20/6) |
| T2→T5,T7 | deviceOptions, gameOptions, itemLabel, Option | consistent; label = `${brand} ${name}` matches T5 test |
| T3→T7,T8 | pickNewer returns "local"/"server"/"none"; browserStorage/loadLocal/saveLocal | consistent with hook |
| T4→T7,T9 | save_my_settings/delete_my_settings/set_card_public/get_public_card | consistent; get_public_card keys = PublicCardData keys (T5) |
| T5→T6,T7,T9 | PublicCardData, buildCardView, parseCardRequest, toPublicCardData | consistent |
| T6→T9 | renderCardImage, CARD_SIZE | consistent |
| T7→T8 | useIsClient | T8 after T7, ok |
| T8 self | sensDefaults test vs impl | consistent |
| T1 self | tests vs impl (errors keys list; valid object) | consistent |
| T4 self | test "anonymous visitors cannot save" asserts errorCode(...) not undefined | CONFLICT: anon lacks EXECUTE → PostgREST "permission denied for function" has no [A-Z_]{4,} code → errorCode undefined → test fails though behavior correct |
| T5 self | cm360 expectation 46.65 | verified arithmetic |
| T7 self | ItemPicker listId per slot | fixed in plan before execution |

Ruling: T4 anon-save test asserts `error` is not null instead of errorCode — anon has no EXECUTE so PostgREST returns a permission error without a code; the intent (anon cannot save) is unchanged — if wrong, the test is merely weaker (still fails if anon could save).
Task 1: ⚠️ resolved by controller — migration/SQL parity test are created in Task 4; valorant max=10 in src/data/sensitivity.ts (verified).
Task 1: minor (deferred): updatedAt accepts loose Date.parse strings (not strict ISO)
Task 1: minor (deferred): redundant `v <= 0` sens check
Task 1: minor (deferred): device error message says only 「N字以内」 for any invalid ref
Task 1: minor (deferred): no tests for axes errors / unknown sens id / 40-char boundary
Task 1: complete (commits b669fc3..4490b02, review clean)
Task 2: ⚠️ name verification partial — carry to final report 「本人に確認してほしい候補」: CORSAIR M75 WIRELESS, HS80 RGB WIRELESS (maybe HS80 MAX), K70 RGB TKL; unsearched VAXEE XE/PA, Wooting 60HE+, Razer Viper Mini/DeathAdder V3, many JP game names. Changed: overwatch → 「オーバーウォッチ」, lgg-jupiter → Jupiter Pro.
Task 2: minor (deferred): id benq-zowie-u2 inconsistent with other zowie-* ids — rename to zowie-u2 before users save (should fix before merge)
Task 2: minor (deferred): no assertion on option label format
Task 2: complete (commits 4490b02..ebc661f, review clean)
Task 3: ⚠️ resolved — Task 1 validator checks typeCode regex and per-game sens range (verified in Task 1 review).
Task 3: minor (deferred): updateLocal ignores saveLocal failure (returns settings even if not persisted) — UI must not treat non-null as persisted
Task 3: minor (deferred): pickNewer has no NaN guard (safe while updatedAt validated)
Task 3: complete (commits ebc661f..98cb3ed, review clean)
Ruling: commit trailers name the model that actually wrote each commit (Haiku/Sonnet) instead of the plan's "Opus 5.5" — accurate attribution; cost if wrong: cosmetic history text only.
Task 4: ⚠️ resolved by controller — dev set_card_public replaced with the committed file's exact text (empty handler) via execute_sql: compiles, prosecdef ok; my-settings RLS 5/5 pass. PublicCardData shape check deferred to Task 5 (same key list).
Task 4: minor (deferred): wrong-typed values inside valid objects (e.g. sens "0.35", dpi "800") may raise a cast error instead of INVALID_INPUT (still rejected); no test
Task 4: minor (deferred): slug modulo bias (~59 bits, fine); INVALID_INPUT after 5 collisions
Task 4: minor (deferred): size check before jsonb_set updatedAt → near-4096 payload may hit table CHECK (23514) instead of INVALID_INPUT
Task 4: minor (deferred): tests lack dpi 800.5 / duplicate favorites / anon 42501 code
Task 4: minor (deferred): {id:"valorant"} and {name:"valorant"} both allowed as favorites; unknown ids pass regex (client hides them)
Task 4: complete (commits 98cb3ed..1fc8b24, review clean)
Task 5: ⚠️ resolved — cardName 20-char limit re-checked in card-view itself (safe).
Ruling: Task 5 plan-mandated finding accepted — validatePublicCardData must enforce dpi integer in [DPI_MIN,DPI_MAX] and mainSens > 0 within the main game's [min,max] (spec/global constraint binds; /api/card-image is public) — cost if wrong: slightly stricter validation only.
Task 5: minor (deferred): body.length counts UTF-16 units, not bytes (fixed in round 1 if cheap)
Task 5: minor (deferred): typeCode regex-only (unknown code shows no name)
Task 5: fix round 1/5 (2 addressed, 0 open — dpi/mainSens bounds, byte count; commits 025ddb0..9baca1a)
Task 5: complete (commits 1fc8b24..9baca1a, review clean)
Ruling: Task 6 plan-mandated finding accepted — fallback strings ("????", "タイプ未診断") must be included in the font-subset text (clear rendering bug when typeCode is null) — cost if wrong: none.
Task 6: minor (deferred): request.text() read before size cap (platform body limit bounds it)
Task 6: minor (deferred): public POST has no rate limit; outbound font fetch per call — for pre-deploy security gate
Task 6: ⚠️ resolved — manual check evidence in report (200 png / 400 / fallback glyphs screenshot).
Task 6: fix round 1/5 (2 addressed, 0 open — font subset fallbacks, try/catch 500; commits 2020550..25b3f59)
Task 6: complete (commits 9baca1a..25b3f59, review clean)
Ruling: Task 7 minor #4 (plan-mandated: toggle disabled when invalid also blocks unpublishing) fixed in round 1 — turning public off must always be possible — cost if wrong: none.
Ruling: Task 7 minors #5 (publish before first server save / wrong message) and #6 (adopt server-returned updatedAt when no newer edit) folded into round 1 — they are on the same sync path as the Important findings — cost if wrong: small extra diff.
Task 7: minor (deferred): unordered debounced save responses; timer not cleared on unmount; status line says saved while draft invalid; CardPreview last blob URL not revoked; no automated tests for hook merge/save/delete
Task 7: fix round 1/5 (6 addressed, 0 open — favorites slots, revision remount, removeAll order, unpublish, save-before-publish, adopt server updatedAt; commits ea3eb78..074b9cf)
Task 7: minor (deferred): in-flight save can recreate row after delete (narrow race); failed delete leaves last edit unsent to server; toggle during login fetch may push older local draft; latestStamp null in "none" branch
Task 7: ⚠️ logged-in paths (revision remount, removeAll, publish, adoption) not run — owner check on launch day (Task 10 adds to launch.md)
Task 7: complete (commits 25b3f59..074b9cf, review clean)
Task 8: minor (deferred, should fix before merge): mobile header labels wrap inside links → whitespace-nowrap + flex-wrap on nav
Task 8: minor (deferred): 「マイ設定に保存しました。」 stays after editing inputs; SensitivityTool reads storage each render; import placement; failure message wording
Task 8: complete (commits 074b9cf..068502f, review clean)
Task 9: ⚠️ resolved — og:image localhost base is local-only (getSiteUrl uses VERCEL_PROJECT_PRODUCTION_URL on Vercel); /c/[slug] not in prerender-manifest (dynamic, unpublish takes effect immediately).
Task 9: minor (deferred): missing env → silent 404; OG PNG lacks X-Robots-Tag noindex; duplicate fetchPublicCard calls (React cache()); no fetchPublicCard error-path test
Task 9: complete (commits 068502f..71823f1, review clean)
Ruling: Task 10 plan-mandated finding accepted — privacy text must say logged-out settings are stored only in the browser, and card-image generation sends the public fields to the server transiently without storing; also list 診断の各軸の値 among stored items — accuracy of the privacy policy — cost if wrong: none.
Task 10: fix round 1/5 (3 addressed, 0 open — privacy wording; commits 12e4d83..322ef7f)
Task 10: complete (commits 71823f1..322ef7f, review clean)
Ruling: run the final whole-branch review + fix wave BEFORE Task 11 (full checks, security audit run-3, plan.md, push) — the audit must see the final code — cost if wrong: none.
Final review (b669fc3..322ef7f, opus): With fixes. Must-fix: #1 whole-document newer-wins wipes server data after diagnosis/sens save on a new device; #2 select error treated as no row; #3 OG image immutable 1y cache; #5 invalid field blocks all saves while status says saved; #6 benq-zowie-u2 id; #7 mobile header wrap. Strongly recommended: #4 font subset text leaks ordered user text into cache key. Nice: #8 serialize saves, #11 clearLocal after account delete.
Ruling: sync changes from whole-document newer-wins (spec 4.5) to field-level merge — server row as base + top-level keys changed locally since last successful sync (tracked in a dirty-key list) — spec's intent (「新しい方を採用」) was to keep the latest edits; whole-document replacement destroys unrelated server fields in the spec's own success flow (診断→マイ設定) — cost if wrong: more sync code; spec 4.5 wording must be updated.
Ruling: final fix wave includes #1-#8 and #11 in ONE dispatch; #9 (rate limit) goes to the Task 11 security gate; #10, #12 deferred.
Final fix wave: commits 322ef7f..cf64960 (8458327 merge, f95a87d sync/status/delete, 06691c9 OG cache+font, cf64960 zowie-u2+header). Tests 135/135, RLS 41/41, tsc/lint 0, build OK.
Ruling: merge granularity is top-level field — a new device saving one game's sens replaces the server sens map — acceptable: sens/devices/hand are edited as units on one screen; cost if wrong: occasional loss of other games' sens values on first login from a new device.
Ruling: #11 clearLocal runs on delete confirmation (no reliable success signal before redirect) — if the server delete fails, only the local copy is gone and the server copy remains — cost if wrong: user re-syncs from server on next login.
Final fix wave re-review: all 9 addressed, no new Critical/Important.
Final: parked — clearThisDevice doesn't cancel pending/in-flight save (narrow window, may rewrite local after delete confirm) — Ruling: real, narrow, deferred.
Final: parked — pendingKeys not reset on merge (extra dirty keys only) — Ruling: harmless, deferred.
Final: parked — removeAll doesn't await saveChain (in-flight save may recreate row) — Ruling: real, narrow, deferred.
Final: parked — another account on same browser inherits dirty keys — Ruling: same as prior behavior; deferred (consider clearing dirty on logout later).
Final: note — plan Review Focus #1 text is stale (pickNewer) — docs only.
