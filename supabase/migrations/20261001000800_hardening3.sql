-- 監査 run-1 の強化メモへの対応(脆弱性ではないが、公開前に塞いでおくもの)
--   1. ゲーム・ランク・時間帯・プラットフォームの ID を、画面の選択肢と同じ一覧で検証する
--      (未知の ID は画面にそのまま表示されるため、NG ワードの抜け道になっていた)
--   2. NG ワードの判定前に、空白・記号・ゼロ幅文字などを取り除く(「d i s c o r d . g g」などのすり抜け対策)
--   3. send_approach:相互に同時に声をかけたときも確実に成立させる。成立の更新は pending のときだけ
--   4. register_profile:Discord の identity の選び方を決定的にし、自由に決められる表示名(global_name)は使わない
--   5. banned_discord_ids に追加したら、そのアカウントの status も banned にそろえる

-- === 1. 選択肢の一覧(src/data の一覧と同じ。tests/data/lobby-options-sql.test.ts で一致を確認) ===
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
  if p_axes is not null and (jsonb_typeof(p_axes) <> 'object' or pg_column_size(p_axes) > 512) then raise exception 'INVALID_INPUT'; end if;
  if public._has_ng_word(p_nickname || ' ' || coalesce(p_bio, '')) then raise exception 'NG_WORD'; end if;
end $$;
revoke all on function public._validate_profile_input from public, anon, authenticated;

-- === 2. NG ワード:正規化してから、空白・記号・見えない文字を取り除いて比べる ===
create or replace function public._ng_normalize(p_text text) returns text
language sql immutable set search_path = public as $$
  select regexp_replace(
    lower(normalize(coalesce(p_text, ''), NFKC)),
    -- 空白・記号、ソフトハイフン、ゼロ幅文字、双方向制御、異体字セレクタ、全角の句読点・中黒
    '[[:space:][:punct:]­͏؜ᅟᅠ឴឵᠋-᠎​-‏‪-‮⁠-⁯　-〿・︀-️﻿･ㅤ]',
    '', 'g')
$$;
revoke all on function public._ng_normalize from public, anon, authenticated;

create or replace function public._has_ng_word(p_text text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.ng_words w
    where public._ng_normalize(w.word) <> ''
      and position(public._ng_normalize(w.word) in public._ng_normalize(p_text)) > 0
  )
$$;
revoke all on function public._has_ng_word from public, anon, authenticated;

-- === 3. send_approach:2人の組でもロックし、成立の更新は pending のときだけ ===
create or replace function public.send_approach(p_to uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_reverse uuid;
begin
  if v_me is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not exists (select 1 from public.profiles where id = v_me and status = 'active') then raise exception 'NOT_ACTIVE'; end if;
  perform pg_advisory_xact_lock(hashtext('approach:' || v_me::text));
  -- A→B と B→A が同時に来ても、後の方が先の声かけを見つけて成立させられるように、組でも順番を守る
  perform pg_advisory_xact_lock(hashtext('pair:' || least(v_me::text, p_to::text) || ':' || greatest(v_me::text, p_to::text)));
  if not public._visible(v_me, p_to) then raise exception 'NOT_FOUND'; end if;
  perform public._expire_old(v_me);
  if exists (select 1 from public.approaches where status = 'accepted'
             and ((from_id = v_me and to_id = p_to) or (from_id = p_to and to_id = v_me))) then
    raise exception 'ALREADY_MATCHED';
  end if;
  if exists (select 1 from public.approaches where from_id = v_me and to_id = p_to
             and (status = 'pending' or (status = 'passed' and created_at >= now() - interval '7 days'))) then
    raise exception 'ALREADY_PENDING';
  end if;
  -- 相手からすでに声かけが来ていれば、そのまま成立させる(同時にブロック・パスされた分は成立させない)
  update public.approaches set status = 'accepted', responded_at = now(), seen_by_from = false, seen_by_to = true
  where id = (select id from public.approaches where from_id = p_to and to_id = v_me and status = 'pending' limit 1)
    and status = 'pending'
  returning id into v_reverse;
  if v_reverse is not null then
    return 'matched';
  end if;
  if (select count(*) from public.approaches where from_id = v_me and created_at >= public.jst_day_start(now())) >= 10 then
    raise exception 'DAILY_LIMIT';
  end if;
  insert into public.approaches (from_id, to_id) values (v_me, p_to);
  return 'sent';
exception
  when unique_violation then raise exception 'ALREADY_PENDING';
end $$;
revoke all on function public.send_approach from public, anon;
grant execute on function public.send_approach to authenticated;

-- === 4. register_profile:最初に連携した Discord を使い、ユーザー名が取れなければ登録しない ===
create or replace function public.register_profile(
  p_birthdate date, p_nickname text, p_type_code text, p_axes jsonb, p_games jsonb,
  p_platforms text[], p_voice_ok boolean, p_time_slots text[], p_bio text
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_identity jsonb;
  v_discord_id text;
  v_discord_name text;
begin
  if v_uid is null then raise exception 'NOT_LOGGED_IN'; end if;
  select identity_data into v_identity from auth.identities
    where user_id = v_uid and provider = 'discord' order by created_at, id limit 1;
  if v_identity is null then raise exception 'NO_DISCORD'; end if;
  v_discord_id := coalesce(v_identity ->> 'provider_id', v_identity ->> 'sub');
  -- global_name(表示名)は他の人と重なることがあり、連絡先として使えないので使わない
  v_discord_name := regexp_replace(coalesce(v_identity ->> 'name', v_identity ->> 'full_name'), '#0$', '');
  if v_discord_id is null or v_discord_name is null or v_discord_name = '' then raise exception 'NO_DISCORD'; end if;
  perform public._register_profile(
    v_uid, v_discord_id, v_discord_name,
    p_birthdate, p_nickname, p_type_code, p_axes, p_games, p_platforms, p_voice_ok, p_time_slots, p_bio
  );
end $$;
revoke all on function public.register_profile from public, anon;
grant execute on function public.register_profile to authenticated;

-- === 5. BAN の一覧とアカウントの状態をそろえる ===
create or replace function public._sync_banned_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set status = 'banned'
  where id in (select user_id from public.private_info where discord_user_id = new.discord_user_id);
  return new;
end $$;
revoke all on function public._sync_banned_status from public, anon, authenticated;

drop trigger if exists banned_discord_ids_sync_status on public.banned_discord_ids;
create trigger banned_discord_ids_sync_status
after insert on public.banned_discord_ids
for each row execute function public._sync_banned_status();
