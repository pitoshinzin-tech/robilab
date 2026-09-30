-- ロビーのプロフィール文字の強化(監査 run-9 の強化メモ 4)
--   1. _validate_profile_input:ニックネーム・自己紹介で、制御文字と向きを変える文字(U+202E など)を弾く
--      (0900 の定義をそのまま写し、この検査だけを足したもの)
--   2. BAN 一覧(banned_discord_ids)にある Discord ID のアカウントの status を一回だけ banned にそろえる
--      (0800 のトリガーは、このあとの BAN の追加でしか動かないため)。何度流しても同じ結果になる

-- === 1. _validate_profile_input(0900 の定義に、見えない文字・向きを変える文字の検査を足したもの) ===
create or replace function public._validate_profile_input(
  p_nickname text, p_bio text, p_type_code text, p_games jsonb, p_time_slots text[],
  p_platforms text[], p_axes jsonb
) returns void language plpgsql stable set search_path = public as $$
declare
  v_game jsonb;
  -- src/data/games.ts の GAMES
  v_games text[] := array['overwatch', 'valorant', 'apex', 'sf6', 'dbd'];
  -- src/data/lobby-options.ts の RANK_BANDS
  v_ranks text[] := array['unranked', 'beginner', 'middle', 'upper', 'top'];
  -- src/data/lobby-options.ts の TIME_SLOTS
  v_slots text[] := array['weekday-morning', 'weekday-day', 'weekday-night', 'weekday-late', 'holiday-morning', 'holiday-day', 'holiday-night', 'holiday-late'];
  -- src/data/lobby-options.ts の PLATFORMS
  v_platforms text[] := array['pc', 'ps', 'switch', 'xbox', 'mobile'];
  -- 制御文字(U+0001-U+001F、U+007F-U+009F)と、見えない文字・向きを変える文字
  -- (ゼロ幅・LRM/RLM U+200B-U+200F、埋め込み/上書き U+202A-U+202E、U+2060-U+2069、BOM U+FEFF)。
  -- U+0000 は Postgres の text に入らない(chr(0) はエラー)ので含めない。
  -- 文字のエスケープを途中のツールが別の文字に変えないよう、chr() で組み立てる。
  v_bad_chars text := '['
    || chr(1) || '-' || chr(31)          -- U+0001-U+001F
    || chr(127) || '-' || chr(159)       -- U+007F-U+009F
    || chr(8203) || '-' || chr(8207)     -- U+200B-U+200F
    || chr(8234) || '-' || chr(8238)     -- U+202A-U+202E
    || chr(8288) || '-' || chr(8297)     -- U+2060-U+2069
    || chr(65279)                        -- U+FEFF
    || ']';
begin
  if p_nickname is null or char_length(trim(p_nickname)) = 0 or char_length(p_nickname) > 20 then raise exception 'INVALID_INPUT'; end if;
  if char_length(coalesce(p_bio, '')) > 50 then raise exception 'INVALID_INPUT'; end if;
  -- マイ設定(カード名・機材名の [[:cntrl:]])と同じく、制御文字や向きを変える文字は受け付けない
  if p_nickname ~ v_bad_chars or coalesce(p_bio, '') ~ v_bad_chars then raise exception 'INVALID_INPUT'; end if;
  if p_type_code is not null and p_type_code !~ '^[AG][RB][CL][HZ]$' then raise exception 'INVALID_INPUT'; end if;
  if jsonb_typeof(p_games) <> 'array' or jsonb_array_length(p_games) = 0 or jsonb_array_length(p_games) > 10 then
    raise exception 'INVALID_INPUT';
  end if;
  for v_game in select * from jsonb_array_elements(p_games) loop
    if jsonb_typeof(v_game) <> 'object' then raise exception 'INVALID_INPUT'; end if;
    if exists (select 1 from jsonb_object_keys(v_game) k where k not in ('id', 'rank')) then raise exception 'INVALID_INPUT'; end if;
    if v_game ->> 'id' is null or not (v_game ->> 'id' = any (v_games)) then raise exception 'INVALID_INPUT'; end if;
    if (v_game ? 'rank') and v_game ->> 'rank' is not null and not (v_game ->> 'rank' = any (v_ranks)) then
      raise exception 'INVALID_INPUT';
    end if;
  end loop;
  if (select count(distinct g ->> 'id') from jsonb_array_elements(p_games) g) <> jsonb_array_length(p_games) then
    raise exception 'INVALID_INPUT';
  end if;
  if coalesce(array_length(p_time_slots, 1), 0) = 0 or array_length(p_time_slots, 1) > 10 then raise exception 'INVALID_INPUT'; end if;
  if exists (select 1 from unnest(p_time_slots) s where s is null or not (s = any (v_slots))) then raise exception 'INVALID_INPUT'; end if;
  if coalesce(array_length(p_platforms, 1), 0) > 10 then raise exception 'INVALID_INPUT'; end if;
  if p_platforms is not null and exists (select 1 from unnest(p_platforms) s where s is null or not (s = any (v_platforms))) then
    raise exception 'INVALID_INPUT';
  end if;
  -- axes は診断の4軸だけ。値は -1〜1 の数値(相性の計算に使うため、極端な値を入れさせない)
  if p_axes is not null then
    if jsonb_typeof(p_axes) <> 'object' or pg_column_size(p_axes) > 512 then raise exception 'INVALID_INPUT'; end if;
    if (select array_agg(k order by k) from jsonb_object_keys(p_axes) k) is distinct from array['attack', 'heat', 'instinct', 'team'] then
      raise exception 'INVALID_INPUT';
    end if;
    if exists (select 1 from jsonb_each(p_axes) e
               where jsonb_typeof(e.value) <> 'number' or (e.value)::numeric < -1 or (e.value)::numeric > 1) then
      raise exception 'INVALID_INPUT';
    end if;
  end if;
  if public._has_ng_word(p_nickname || ' ' || coalesce(p_bio, '')) then raise exception 'NG_WORD'; end if;
end $$;
revoke all on function public._validate_profile_input from public, anon, authenticated;

-- === 2. BAN 一覧と status を一回だけそろえる ===
-- 0800 の _sync_banned_status と同じく private_info.discord_user_id で突き合わせる。
-- すでに banned の行は触らないので、何度流しても結果は変わらない。
update public.profiles p
set status = 'banned'
where p.status <> 'banned'
  and exists (
    select 1
    from public.private_info pi
    join public.banned_discord_ids b on b.discord_user_id = pi.discord_user_id
    where pi.user_id = p.id
  );
