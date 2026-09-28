-- 日本時間のその日の0時(UTC の時刻として返す)
create or replace function public.jst_day_start(p_ts timestamptz)
returns timestamptz language sql immutable as $$
  select (date_trunc('day', p_ts at time zone 'Asia/Tokyo')) at time zone 'Asia/Tokyo'
$$;

create or replace function public._jst_today() returns date language sql stable as $$
  select (now() at time zone 'Asia/Tokyo')::date
$$;

create or replace function public._age_on(p_birthdate date, p_today date) returns int language sql immutable as $$
  select extract(year from age(p_today, p_birthdate))::int
$$;

create or replace function public._has_ng_word(p_text text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ng_words w where position(lower(w.word) in lower(p_text)) > 0)
$$;

create or replace function public._validate_profile_input(p_nickname text, p_bio text, p_type_code text, p_games jsonb, p_time_slots text[])
returns void language plpgsql stable as $$
begin
  if p_nickname is null or char_length(trim(p_nickname)) = 0 or char_length(p_nickname) > 20 then raise exception 'INVALID_INPUT'; end if;
  if char_length(coalesce(p_bio, '')) > 50 then raise exception 'INVALID_INPUT'; end if;
  if p_type_code is not null and p_type_code !~ '^[AG][RB][CL][HZ]$' then raise exception 'INVALID_INPUT'; end if;
  if jsonb_typeof(p_games) <> 'array' or jsonb_array_length(p_games) = 0 then raise exception 'INVALID_INPUT'; end if;
  if coalesce(array_length(p_time_slots, 1), 0) = 0 then raise exception 'INVALID_INPUT'; end if;
  if public._has_ng_word(p_nickname || ' ' || coalesce(p_bio, '')) then raise exception 'NG_WORD'; end if;
end $$;

-- 内部用:登録の本体(テストからは service_role で呼ぶ)
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
  perform public._validate_profile_input(p_nickname, p_bio, p_type_code, p_games, p_time_slots);
  insert into public.private_info (user_id, discord_user_id, discord_username, birthdate)
    values (p_uid, p_discord_id, p_discord_name, p_birthdate);
  insert into public.profiles (id, nickname, type_code, axes, games, platforms, voice_ok, time_slots, bio, age_group)
    values (p_uid, trim(p_nickname), p_type_code, p_axes, p_games, coalesce(p_platforms, '{}'), coalesce(p_voice_ok, false), p_time_slots, coalesce(p_bio, ''), 'adult');
end $$;
revoke all on function public._register_profile from public, anon, authenticated;
grant execute on function public._register_profile to service_role;

-- 公開用:ログイン中の Discord アカウントの情報で登録する
create or replace function public.register_profile(
  p_birthdate date, p_nickname text, p_type_code text, p_axes jsonb, p_games jsonb,
  p_platforms text[], p_voice_ok boolean, p_time_slots text[], p_bio text
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_identity jsonb;
begin
  if v_uid is null then raise exception 'NOT_LOGGED_IN'; end if;
  select identity_data into v_identity from auth.identities where user_id = v_uid and provider = 'discord' limit 1;
  if v_identity is null then raise exception 'NO_DISCORD'; end if;
  perform public._register_profile(
    v_uid,
    coalesce(v_identity ->> 'provider_id', v_identity ->> 'sub'),
    coalesce(v_identity -> 'custom_claims' ->> 'global_name', v_identity ->> 'full_name', v_identity ->> 'name'),
    p_birthdate, p_nickname, p_type_code, p_axes, p_games, p_platforms, p_voice_ok, p_time_slots, p_bio
  );
end $$;

create or replace function public.update_profile(
  p_nickname text, p_type_code text, p_axes jsonb, p_games jsonb,
  p_platforms text[], p_voice_ok boolean, p_time_slots text[], p_bio text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and status = 'active') then raise exception 'NOT_ACTIVE'; end if;
  perform public._validate_profile_input(p_nickname, p_bio, p_type_code, p_games, p_time_slots);
  update public.profiles set nickname = trim(p_nickname), type_code = p_type_code, axes = p_axes, games = p_games,
    platforms = coalesce(p_platforms, '{}'), voice_ok = coalesce(p_voice_ok, false), time_slots = p_time_slots,
    bio = coalesce(p_bio, ''), updated_at = now()
  where id = auth.uid();
end $$;

create or replace function public.my_profile() returns setof public.profiles
language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid()
$$;

-- 「viewer から target が見えるか」の共通ルール
create or replace function public._visible(p_viewer uuid, p_target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_viewer <> p_target
    and exists (
      select 1 from public.profiles v join public.profiles t on t.id = p_target
      where v.id = p_viewer and v.status = 'active' and t.status = 'active' and v.age_group = t.age_group
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = p_viewer and b.blocked_id = p_target) or (b.blocker_id = p_target and b.blocked_id = p_viewer)
    )
$$;

create or replace function public.lobby_candidates()
returns table (id uuid, nickname text, type_code text, axes jsonb, games jsonb, platforms text[], voice_ok boolean, time_slots text[], bio text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select t.id, t.nickname, t.type_code, t.axes, t.games, t.platforms, t.voice_ok, t.time_slots, t.bio, t.created_at
  from public.profiles t, public.profiles me
  where me.id = auth.uid()
    and public._visible(me.id, t.id)
    and t.time_slots && me.time_slots
    and exists (
      select 1 from jsonb_array_elements(t.games) tg, jsonb_array_elements(me.games) mg
      where tg ->> 'id' = mg ->> 'id'
    )
  order by t.created_at desc
  limit 200
$$;

create or replace function public.get_profile(p_id uuid)
returns table (id uuid, nickname text, type_code text, axes jsonb, games jsonb, platforms text[], voice_ok boolean, time_slots text[], bio text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select t.id, t.nickname, t.type_code, t.axes, t.games, t.platforms, t.voice_ok, t.time_slots, t.bio, t.created_at
  from public.profiles t
  where t.id = p_id and public._visible(auth.uid(), p_id)
$$;

-- 期限切れを反映する(7日)
create or replace function public._expire_old(p_user uuid) returns void
language sql security definer set search_path = public as $$
  update public.approaches set status = 'expired'
  where status = 'pending' and created_at < now() - interval '7 days' and (from_id = p_user or to_id = p_user)
$$;

create or replace function public.send_approach(p_to uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_reverse uuid;
begin
  if v_me is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not exists (select 1 from public.profiles where id = v_me and status = 'active') then raise exception 'NOT_ACTIVE'; end if;
  if not public._visible(v_me, p_to) then raise exception 'NOT_FOUND'; end if;
  perform public._expire_old(v_me);
  if exists (select 1 from public.approaches where status = 'accepted'
             and ((from_id = v_me and to_id = p_to) or (from_id = p_to and to_id = v_me))) then
    raise exception 'ALREADY_MATCHED';
  end if;
  if exists (select 1 from public.approaches where from_id = v_me and to_id = p_to and status = 'pending') then
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

create or replace function public.respond_approach(p_id uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_row public.approaches;
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  perform public._expire_old(auth.uid());
  select * into v_row from public.approaches where id = p_id and to_id = auth.uid() and status = 'pending' for update;
  if v_row.id is null then raise exception 'NOT_FOUND'; end if;
  if not public._visible(auth.uid(), v_row.from_id) then raise exception 'BLOCKED'; end if;
  update public.approaches
    set status = case when p_accept then 'accepted'::public.approach_status else 'passed'::public.approach_status end,
        responded_at = now(), seen_by_to = true, seen_by_from = not p_accept
  where id = p_id;
end $$;

create or replace function public.my_inbox()
returns table (kind text, approach_id uuid, partner_id uuid, nickname text, type_code text, axes jsonb, games jsonb, discord_username text, status text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  perform public._expire_old(auth.uid());
  return query
  -- 届いた声かけ(返事待ち)
  select 'received', a.id, p.id, p.nickname, p.type_code, p.axes, p.games, null::text, a.status::text, a.created_at
  from public.approaches a join public.profiles p on p.id = a.from_id
  where a.to_id = auth.uid() and a.status = 'pending' and public._visible(auth.uid(), a.from_id)
  union all
  -- 送った声かけ(パスされたものも「返事待ち」→「期限切れ」として見せる)
  select 'sent', a.id, p.id, p.nickname, p.type_code, p.axes, p.games, null::text,
         case when a.status = 'passed' and a.created_at >= now() - interval '7 days' then 'pending'
              when a.status = 'passed' then 'expired'
              else a.status::text end,
         a.created_at
  from public.approaches a join public.profiles p on p.id = a.to_id
  where a.from_id = auth.uid() and a.status in ('pending', 'passed', 'expired') and public._visible(auth.uid(), a.to_id)
  union all
  -- 成立した相手(相互 OK のときだけ Discord 名を返す)
  select 'matched', a.id, p.id, p.nickname, p.type_code, p.axes, p.games, pi.discord_username, 'accepted', coalesce(a.responded_at, a.created_at)
  from public.approaches a
  join public.profiles p on p.id = case when a.from_id = auth.uid() then a.to_id else a.from_id end
  join public.private_info pi on pi.user_id = p.id
  where a.status = 'accepted' and (a.from_id = auth.uid() or a.to_id = auth.uid()) and public._visible(auth.uid(), p.id)
  order by 10 desc;
end $$;

create or replace function public.unread_count() returns int
language sql stable security definer set search_path = public as $$
  select (
    (select count(*) from public.approaches where to_id = auth.uid() and status = 'pending' and not seen_by_to
       and created_at >= now() - interval '7 days')
    + (select count(*) from public.approaches where from_id = auth.uid() and status = 'accepted' and not seen_by_from)
  )::int
$$;

create or replace function public.mark_inbox_seen() returns void
language sql security definer set search_path = public as $$
  update public.approaches set seen_by_to = true where to_id = auth.uid() and not seen_by_to;
  update public.approaches set seen_by_from = true where from_id = auth.uid() and not seen_by_from;
$$;

create or replace function public.block_user(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if p_id = auth.uid() or not exists (select 1 from public.profiles where id = p_id) then raise exception 'NOT_FOUND'; end if;
  insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), p_id) on conflict do nothing;
  update public.approaches set status = 'passed', responded_at = now()
  where status = 'pending' and ((from_id = auth.uid() and to_id = p_id) or (from_id = p_id and to_id = auth.uid()));
end $$;

create or replace function public.unblock_user(p_id uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.blocks where blocker_id = auth.uid() and blocked_id = p_id
$$;

create or replace function public.report_user(p_id uuid, p_reason public.report_reason, p_detail text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and status = 'active') then raise exception 'NOT_ACTIVE'; end if;
  if p_id = auth.uid() or not exists (select 1 from public.profiles where id = p_id) then raise exception 'NOT_FOUND'; end if;
  if char_length(coalesce(p_detail, '')) > 200 then raise exception 'INVALID_INPUT'; end if;
  insert into public.reports (reporter_id, target_id, reason, detail) values (auth.uid(), p_id, p_reason, coalesce(p_detail, ''));
  update public.profiles set status = 'suspended' where id = p_id and status = 'active';
  perform public.block_user(p_id);
exception
  when unique_violation then raise exception 'ALREADY_REPORTED';
end $$;

create or replace function public.delete_me() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- 実行権限:ログインした人だけ(jst_day_start は誰でも可)
revoke all on function public.register_profile, public.update_profile, public.my_profile, public.lobby_candidates,
  public.get_profile, public.send_approach, public.respond_approach, public.my_inbox, public.unread_count,
  public.mark_inbox_seen, public.block_user, public.unblock_user, public.report_user, public.delete_me from public, anon;
grant execute on function public.register_profile, public.update_profile, public.my_profile, public.lobby_candidates,
  public.get_profile, public.send_approach, public.respond_approach, public.my_inbox, public.unread_count,
  public.mark_inbox_seen, public.block_user, public.unblock_user, public.report_user, public.delete_me to authenticated;
revoke all on function public._visible, public._expire_old, public._has_ng_word, public._validate_profile_input from public, anon, authenticated;
