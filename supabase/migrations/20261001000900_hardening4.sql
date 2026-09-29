-- 監査 run-2 の強化メモへの対応
--   1. プロフィールの axes を、診断の4軸(attack / instinct / team / heat)と -1〜1 の数値に限る
--   2. NG ワードの判定前に、結合文字・タグ文字・異体字セレクタ(補助)も取り除く

-- === 1. _validate_profile_input(0800 の定義に axes の検証を足したもの) ===
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
begin
  if p_nickname is null or char_length(trim(p_nickname)) = 0 or char_length(p_nickname) > 20 then raise exception 'INVALID_INPUT'; end if;
  if char_length(coalesce(p_bio, '')) > 50 then raise exception 'INVALID_INPUT'; end if;
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

-- === 2. NG ワードの正規化で取り除く文字を増やす ===
create or replace function public._ng_normalize(p_text text) returns text
language sql immutable set search_path = public as $$
  select regexp_replace(
    lower(normalize(coalesce(p_text, ''), NFKC)),
    -- 空白・記号、ソフトハイフン、ゼロ幅文字、双方向制御、異体字セレクタ、全角の句読点・中黒、
    -- 結合文字(ダイアクリティカルマークなど)、タグ文字、異体字セレクタ補助
    '[[:space:][:punct:]\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3000-\u303F\u30FB\uFE00-\uFE0F\uFEFF\uFF65\u3164\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F\U000E0000-\U000E007F\U000E0100-\U000E01EF]',
    '', 'g')
$$;
revoke all on function public._ng_normalize from public, anon, authenticated;
