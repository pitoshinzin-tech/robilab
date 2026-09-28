-- Fix round 1: 日次上限の競合、パスの再送秘匿、退会の抜け道、通報の乱用、
-- Discord 表示名の取得、入力検証の強化、NGワードの正規化、未読数の可視性フィルタ、
-- 生年月日の不変性、diagnosis_results の入力サイズ制限

-- === reports: 削除された相手でも証跡を残す ===
alter table public.reports add column if not exists target_discord_id text;
alter table public.reports alter column target_id drop not null;
alter table public.reports drop constraint reports_target_id_fkey;
alter table public.reports add constraint reports_target_id_fkey
  foreign key (target_id) references public.profiles (id) on delete set null;

-- === diagnosis_results: axes のサイズと形を制限する ===
alter table public.diagnosis_results
  add constraint diagnosis_results_axes_is_object check (jsonb_typeof(axes) = 'object'),
  add constraint diagnosis_results_axes_size check (pg_column_size(axes) <= 512);

-- === private_info: 生年月日は登録後変更できない ===
create or replace function public._prevent_birthdate_change() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.birthdate is distinct from old.birthdate then
    raise exception 'INVALID_INPUT';
  end if;
  return new;
end $$;
revoke all on function public._prevent_birthdate_change from public, anon, authenticated;

drop trigger if exists private_info_birthdate_immutable on public.private_info;
create trigger private_info_birthdate_immutable
before update on public.private_info
for each row execute function public._prevent_birthdate_change();

-- === _validate_profile_input: platforms / axes を引数に追加し、内容を検証する ===
drop function if exists public._validate_profile_input(text, text, text, jsonb, text[]);

create or replace function public._validate_profile_input(
  p_nickname text, p_bio text, p_type_code text, p_games jsonb, p_time_slots text[],
  p_platforms text[], p_axes jsonb
) returns void language plpgsql stable set search_path = public as $$
declare
  v_game jsonb;
begin
  if p_nickname is null or char_length(trim(p_nickname)) = 0 or char_length(p_nickname) > 20 then raise exception 'INVALID_INPUT'; end if;
  if char_length(coalesce(p_bio, '')) > 50 then raise exception 'INVALID_INPUT'; end if;
  if p_type_code is not null and p_type_code !~ '^[AG][RB][CL][HZ]$' then raise exception 'INVALID_INPUT'; end if;
  if jsonb_typeof(p_games) <> 'array' or jsonb_array_length(p_games) = 0 or jsonb_array_length(p_games) > 10 then
    raise exception 'INVALID_INPUT';
  end if;
  for v_game in select * from jsonb_array_elements(p_games) loop
    if jsonb_typeof(v_game) <> 'object' then raise exception 'INVALID_INPUT'; end if;
    if not (v_game ->> 'id' ~ '^[a-z0-9-]{1,32}$') then raise exception 'INVALID_INPUT'; end if;
    if (v_game ? 'rank') and v_game ->> 'rank' is not null and not (v_game ->> 'rank' ~ '^[a-z0-9-]{1,32}$') then
      raise exception 'INVALID_INPUT';
    end if;
  end loop;
  if coalesce(array_length(p_time_slots, 1), 0) = 0 or array_length(p_time_slots, 1) > 10 then raise exception 'INVALID_INPUT'; end if;
  if exists (select 1 from unnest(p_time_slots) s where s !~ '^[a-z0-9-]{1,32}$') then raise exception 'INVALID_INPUT'; end if;
  if coalesce(array_length(p_platforms, 1), 0) > 10 then raise exception 'INVALID_INPUT'; end if;
  if p_platforms is not null and exists (select 1 from unnest(p_platforms) s where s !~ '^[a-z0-9-]{1,32}$') then
    raise exception 'INVALID_INPUT';
  end if;
  if p_axes is not null and (jsonb_typeof(p_axes) <> 'object' or pg_column_size(p_axes) > 512) then raise exception 'INVALID_INPUT'; end if;
  if public._has_ng_word(p_nickname || ' ' || coalesce(p_bio, '')) then raise exception 'NG_WORD'; end if;
end $$;
revoke all on function public._validate_profile_input from public, anon, authenticated;

-- === _has_ng_word: 全角/半角ゆれを吸収する ===
create or replace function public._has_ng_word(p_text text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.ng_words w
    where position(normalize(lower(w.word), NFKC) in normalize(lower(p_text), NFKC)) > 0
  )
$$;

-- === _register_profile: 新しい _validate_profile_input に platforms / axes を渡す ===
create or replace function public._register_profile(
  p_uid uuid, p_discord_id text, p_discord_name text, p_birthdate date,
  p_nickname text, p_type_code text, p_axes jsonb, p_games jsonb, p_platforms text[],
  p_voice_ok boolean, p_time_slots text[], p_bio text
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_age int := public._age_on(p_birthdate, public._jst_today());
begin
  if exists (select 1 from public.banned_discord_ids where discord_user_id = p_discord_id) then raise exception 'BANNED'; end if;
  if exists (select 1 from public.profiles where id = p_uid) then raise exception 'ALREADY_REGISTERED'; end if;
  if p_birthdate > public._jst_today() or v_age > 120 then raise exception 'INVALID_INPUT'; end if;
  if v_age < 18 then raise exception 'UNDER_AGE'; end if;
  perform public._validate_profile_input(p_nickname, p_bio, p_type_code, p_games, p_time_slots, p_platforms, p_axes);
  insert into public.private_info (user_id, discord_user_id, discord_username, birthdate)
    values (p_uid, p_discord_id, p_discord_name, p_birthdate);
  insert into public.profiles (id, nickname, type_code, axes, games, platforms, voice_ok, time_slots, bio, age_group)
    values (p_uid, trim(p_nickname), p_type_code, p_axes, p_games, coalesce(p_platforms, '{}'), coalesce(p_voice_ok, false), p_time_slots, coalesce(p_bio, ''), 'adult');
end $$;

-- === register_profile: Discord 表示名の取得方法を修正する(#0 サフィックス除去、null チェック) ===
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
  select identity_data into v_identity from auth.identities where user_id = v_uid and provider = 'discord' limit 1;
  if v_identity is null then raise exception 'NO_DISCORD'; end if;
  v_discord_id := coalesce(v_identity ->> 'provider_id', v_identity ->> 'sub');
  v_discord_name := regexp_replace(
    coalesce(v_identity ->> 'name', v_identity ->> 'full_name', v_identity -> 'custom_claims' ->> 'global_name'),
    '#0$', ''
  );
  if v_discord_id is null or v_discord_name is null then raise exception 'NO_DISCORD'; end if;
  perform public._register_profile(
    v_uid, v_discord_id, v_discord_name,
    p_birthdate, p_nickname, p_type_code, p_axes, p_games, p_platforms, p_voice_ok, p_time_slots, p_bio
  );
end $$;

-- === update_profile: 新しい _validate_profile_input に platforms / axes を渡す ===
create or replace function public.update_profile(
  p_nickname text, p_type_code text, p_axes jsonb, p_games jsonb,
  p_platforms text[], p_voice_ok boolean, p_time_slots text[], p_bio text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and status = 'active') then raise exception 'NOT_ACTIVE'; end if;
  perform public._validate_profile_input(p_nickname, p_bio, p_type_code, p_games, p_time_slots, p_platforms, p_axes);
  update public.profiles set nickname = trim(p_nickname), type_code = p_type_code, axes = p_axes, games = p_games,
    platforms = coalesce(p_platforms, '{}'), voice_ok = coalesce(p_voice_ok, false), time_slots = p_time_slots,
    bio = coalesce(p_bio, ''), updated_at = now()
  where id = auth.uid();
end $$;

-- === send_approach: 同時実行での日次上限の競合を防ぎ、直近のパスも ALREADY_PENDING 扱いにする ===
create or replace function public.send_approach(p_to uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_reverse uuid;
begin
  if v_me is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not exists (select 1 from public.profiles where id = v_me and status = 'active') then raise exception 'NOT_ACTIVE'; end if;
  perform pg_advisory_xact_lock(hashtext('approach:' || v_me::text));
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
  -- 相手からすでに声かけが来ていれば、そのまま成立させる
  select id into v_reverse from public.approaches where from_id = p_to and to_id = v_me and status = 'pending' limit 1;
  if v_reverse is not null then
    update public.approaches set status = 'accepted', responded_at = now(), seen_by_from = false, seen_by_to = true where id = v_reverse;
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

-- === report_user: 通報の乱用を防ぎ、相手が消えても Discord ID を証跡として残す ===
create or replace function public.report_user(p_id uuid, p_reason public.report_reason, p_detail text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_target_discord_id text;
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and status = 'active') then raise exception 'NOT_ACTIVE'; end if;
  if p_id = auth.uid() or not exists (select 1 from public.profiles where id = p_id) then raise exception 'NOT_FOUND'; end if;
  -- すでに通報済みなら、対象が停止されて _visible が false になっていても ALREADY_REPORTED を返す
  if exists (select 1 from public.reports where reporter_id = auth.uid() and target_id = p_id) then
    raise exception 'ALREADY_REPORTED';
  end if;
  if not (
    public._visible(auth.uid(), p_id)
    or exists (
      select 1 from public.approaches
      where (from_id = auth.uid() and to_id = p_id) or (from_id = p_id and to_id = auth.uid())
    )
  ) then
    raise exception 'NOT_FOUND';
  end if;
  if char_length(coalesce(p_detail, '')) > 200 then raise exception 'INVALID_INPUT'; end if;
  if (select count(*) from public.reports where reporter_id = auth.uid() and created_at >= public.jst_day_start(now())) >= 5 then
    raise exception 'REPORT_LIMIT';
  end if;
  select discord_user_id into v_target_discord_id from public.private_info where user_id = p_id;
  insert into public.reports (reporter_id, target_id, target_discord_id, reason, detail)
    values (auth.uid(), p_id, v_target_discord_id, p_reason, coalesce(p_detail, ''));
  update public.profiles set status = 'suspended' where id = p_id and status = 'active';
  perform public.block_user(p_id);
exception
  when unique_violation then raise exception 'ALREADY_REPORTED';
end $$;

-- === unread_count: 相手から見えなくなった(ブロック/停止/年齢層違い)分は数えない ===
create or replace function public.unread_count() returns int
language sql stable security definer set search_path = public as $$
  select (
    (select count(*) from public.approaches where to_id = auth.uid() and status = 'pending' and not seen_by_to
       and created_at >= now() - interval '7 days' and public._visible(auth.uid(), from_id))
    + (select count(*) from public.approaches where from_id = auth.uid() and status = 'accepted' and not seen_by_from
       and public._visible(auth.uid(), to_id))
  )::int
$$;

-- === delete_me: 停止中/通報の open 案件がある間は退会で逃げられないようにする ===
create or replace function public.delete_me() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if exists (select 1 from public.profiles where id = auth.uid() and status <> 'active')
     or exists (select 1 from public.reports where target_id = auth.uid() and status = 'open') then
    raise exception 'NOT_ACTIVE';
  end if;
  delete from auth.users where id = auth.uid();
end $$;
