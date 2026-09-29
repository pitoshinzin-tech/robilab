-- マイ設定(docs/superpowers/specs/2026-09-29-my-settings-design.md)
-- 1人1行の設定データ。読むのは本人だけ。書き込みは関数経由だけ。公開カードは slug で anon も読める。

create table if not exists public.my_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 4096),
  updated_at timestamptz not null default now(),
  public_slug text unique check (public_slug ~ '^[A-Za-z0-9]{10}$')
);
alter table public.my_settings enable row level security;
create policy "read own my settings" on public.my_settings for select to authenticated using (user_id = (select auth.uid()));

-- 候補の id か自由入力の名前(どちらか1つ)。
-- jsonb_object_keys はオブジェクト以外でエラーになるので、先に種類を確かめてから中身を見る(plpgsql の if で順番を保証する)。
create or replace function public._my_item_ok(p jsonb, p_max int) returns boolean
language plpgsql immutable set search_path = public as $$
declare
  v_keys text[];
begin
  if p is null or jsonb_typeof(p) <> 'object' then return false; end if;
  select array_agg(k) into v_keys from jsonb_object_keys(p) k;
  if v_keys = array['id'] then
    return jsonb_typeof(p -> 'id') = 'string' and (p ->> 'id') ~ '^[a-z0-9-]{1,40}$';
  end if;
  if v_keys = array['name'] then
    return jsonb_typeof(p -> 'name') = 'string'
      and char_length(p ->> 'name') between 1 and p_max
      and btrim(p ->> 'name') = (p ->> 'name')
      and (p ->> 'name') !~ '[[:cntrl:]]';
  end if;
  return false;
end $$;
revoke all on function public._my_item_ok from public, anon, authenticated;

create or replace function public.save_my_settings(p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  -- src/lib/my-settings.ts の MY_SETTINGS_LIMITS と同じ(tests/data/my-settings-sql.test.ts で確認)
  c_dpi_min numeric := 50;
  c_dpi_max numeric := 64000;
  c_hand_length_min numeric := 10;
  c_hand_length_max numeric := 25;
  c_hand_width_min numeric := 5;
  c_hand_width_max numeric := 15;
  c_free_text_max numeric := 40;
  c_card_name_max numeric := 20;
  c_favorite_games_max numeric := 6;
  -- src/data/sensitivity.ts の SENS_GAMES の [min, max]
  v_sens_games jsonb := '{"valorant":[0.001,10],"overwatch":[0.01,100],"apex":[0.01,20],"cs2":[0.001,20],"cod":[0.01,100],"fortnite":[0.1,100],"r6":[1,100]}';
  v_keys text[] := array['version', 'updatedAt', 'typeCode', 'axes', 'dpi', 'mainGame', 'sens', 'hand', 'devices', 'favoriteGames', 'cardName'];
  v_hand jsonb := p_data -> 'hand';
  v_devices jsonb := p_data -> 'devices';
  v_games jsonb := p_data -> 'favoriteGames';
  v_texts text;
  v_saved jsonb;
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) > 4096 then raise exception 'INVALID_INPUT'; end if;
  if not (p_data ?& v_keys) or exists (select 1 from jsonb_object_keys(p_data) k where k <> all (v_keys)) then raise exception 'INVALID_INPUT'; end if;
  if p_data -> 'version' is distinct from '1'::jsonb or jsonb_typeof(p_data -> 'updatedAt') <> 'string' then raise exception 'INVALID_INPUT'; end if;

  -- タイプと4軸
  if jsonb_typeof(p_data -> 'typeCode') <> 'null'
     and not (jsonb_typeof(p_data -> 'typeCode') = 'string' and (p_data ->> 'typeCode') ~ '^[AG][RB][CL][HZ]$') then
    raise exception 'INVALID_INPUT';
  end if;
  -- 注意:jsonb_object_keys / jsonb_each / jsonb_array_elements は種類が違うとエラーになる。
  -- 条件式の中の評価順は保証されないので、種類の確認は必ず別の if で先に行う。
  if jsonb_typeof(p_data -> 'axes') <> 'null' then
    if jsonb_typeof(p_data -> 'axes') <> 'object' then raise exception 'INVALID_INPUT'; end if;
    if (select array_agg(k order by k) from jsonb_object_keys(p_data -> 'axes') k) is distinct from array['attack', 'heat', 'instinct', 'team']
       or exists (select 1 from jsonb_each(p_data -> 'axes') e
                  where jsonb_typeof(e.value) <> 'number' or (e.value)::numeric < -1 or (e.value)::numeric > 1) then
      raise exception 'INVALID_INPUT';
    end if;
  end if;

  -- DPI とメインゲーム
  if jsonb_typeof(p_data -> 'dpi') <> 'null'
     and not (jsonb_typeof(p_data -> 'dpi') = 'number'
              and (p_data ->> 'dpi')::numeric = trunc((p_data ->> 'dpi')::numeric)
              and (p_data ->> 'dpi')::numeric between c_dpi_min and c_dpi_max) then
    raise exception 'INVALID_INPUT';
  end if;
  if jsonb_typeof(p_data -> 'mainGame') <> 'null'
     and not (jsonb_typeof(p_data -> 'mainGame') = 'string' and v_sens_games ? (p_data ->> 'mainGame')) then
    raise exception 'INVALID_INPUT';
  end if;

  -- ゲームごとの感度
  if jsonb_typeof(p_data -> 'sens') <> 'object' then raise exception 'INVALID_INPUT'; end if;
  if exists (select 1 from jsonb_each(p_data -> 'sens') e
                where not (v_sens_games ? e.key)
                   or jsonb_typeof(e.value) <> 'number'
                   or (e.value)::numeric <= 0
                   or (e.value)::numeric < (v_sens_games -> e.key ->> 0)::numeric
                   or (e.value)::numeric > (v_sens_games -> e.key ->> 1)::numeric) then
    raise exception 'INVALID_INPUT';
  end if;

  -- 手と持ち方
  if jsonb_typeof(v_hand) <> 'object' then raise exception 'INVALID_INPUT'; end if;
  if (select array_agg(k order by k) from jsonb_object_keys(v_hand) k) is distinct from array['grip', 'lengthCm', 'widthCm']
     or (jsonb_typeof(v_hand -> 'lengthCm') <> 'null' and not (jsonb_typeof(v_hand -> 'lengthCm') = 'number'
         and (v_hand ->> 'lengthCm')::numeric between c_hand_length_min and c_hand_length_max))
     or (jsonb_typeof(v_hand -> 'widthCm') <> 'null' and not (jsonb_typeof(v_hand -> 'widthCm') = 'number'
         and (v_hand ->> 'widthCm')::numeric between c_hand_width_min and c_hand_width_max))
     or (jsonb_typeof(v_hand -> 'grip') <> 'null' and not (v_hand ->> 'grip' in ('palm', 'claw', 'fingertip'))) then
    raise exception 'INVALID_INPUT';
  end if;

  -- デバイス4つ
  if jsonb_typeof(v_devices) <> 'object' then raise exception 'INVALID_INPUT'; end if;
  if (select array_agg(k order by k) from jsonb_object_keys(v_devices) k) is distinct from array['headset', 'keyboard', 'mouse', 'pad']
     or exists (select 1 from jsonb_each(v_devices) e
                where jsonb_typeof(e.value) <> 'null' and not public._my_item_ok(e.value, c_free_text_max::int)) then
    raise exception 'INVALID_INPUT';
  end if;

  -- 好きなゲーム(最大6つ、重複なし)
  if jsonb_typeof(v_games) <> 'array' then raise exception 'INVALID_INPUT'; end if;
  if jsonb_array_length(v_games) > c_favorite_games_max
     or exists (select 1 from jsonb_array_elements(v_games) g where not public._my_item_ok(g, c_free_text_max::int))
     or (select count(distinct g) from jsonb_array_elements(v_games) g) <> jsonb_array_length(v_games) then
    raise exception 'INVALID_INPUT';
  end if;

  -- 表示名
  if jsonb_typeof(p_data -> 'cardName') <> 'null'
     and not (jsonb_typeof(p_data -> 'cardName') = 'string'
              and char_length(p_data ->> 'cardName') between 1 and c_card_name_max
              and btrim(p_data ->> 'cardName') = (p_data ->> 'cardName')
              and (p_data ->> 'cardName') !~ '[[:cntrl:]]') then
    raise exception 'INVALID_INPUT';
  end if;

  -- 自由入力と表示名の NG ワード
  select concat_ws(' ', p_data ->> 'cardName',
           (select string_agg(e.value ->> 'name', ' ') from jsonb_each(v_devices) e where jsonb_typeof(e.value) = 'object'),
           (select string_agg(g ->> 'name', ' ') from jsonb_array_elements(v_games) g))
    into v_texts;
  if public._has_ng_word(coalesce(v_texts, '')) then raise exception 'NG_WORD'; end if;

  v_saved := jsonb_set(p_data, '{updatedAt}', to_jsonb(to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
  insert into public.my_settings (user_id, data, updated_at) values (auth.uid(), v_saved, now())
    on conflict (user_id) do update set data = excluded.data, updated_at = excluded.updated_at;
  return v_saved;
end $$;

create or replace function public.delete_my_settings() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  delete from public.my_settings where user_id = auth.uid();
end $$;

create or replace function public.set_card_public(p_public boolean) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_alphabet text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  v_bytes bytea;
  v_slug text;
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not exists (select 1 from public.my_settings where user_id = auth.uid()) then raise exception 'NOT_FOUND'; end if;
  if not coalesce(p_public, false) then
    update public.my_settings set public_slug = null where user_id = auth.uid();
    return null;
  end if;
  for attempt in 1..5 loop
    v_bytes := extensions.gen_random_bytes(10);
    select string_agg(substr(v_alphabet, (get_byte(v_bytes, i) % 62) + 1, 1), '' order by i)
      into v_slug from generate_series(0, 9) i;
    begin
      update public.my_settings set public_slug = v_slug where user_id = auth.uid();
      return v_slug;
    exception when unique_violation then
      -- まれに重なったら作り直す
    end;
  end loop;
  raise exception 'INVALID_INPUT';
end $$;

-- 公開カードの表示項目だけを返す(src/lib/card-view.ts の PublicCardData と同じ形)
create or replace function public.get_public_card(p_slug text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'typeCode', data -> 'typeCode',
    'cardName', data -> 'cardName',
    'dpi', data -> 'dpi',
    'mainGame', data -> 'mainGame',
    'mainSens', coalesce(data -> 'sens' -> (data ->> 'mainGame'), 'null'::jsonb),
    'grip', data -> 'hand' -> 'grip',
    'devices', data -> 'devices',
    'favoriteGames', data -> 'favoriteGames')
  from public.my_settings
  where p_slug ~ '^[A-Za-z0-9]{10}$' and public_slug = p_slug
$$;

revoke all on function public.save_my_settings, public.delete_my_settings, public.set_card_public, public.get_public_card from public, anon;
grant execute on function public.save_my_settings, public.delete_my_settings, public.set_card_public to authenticated;
grant execute on function public.get_public_card to anon, authenticated;
