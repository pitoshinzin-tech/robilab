-- マイ設定の版 2(クロスヘア)。版 1 も受け付け、クロスヘアの初期値を足して版 2 で保存する。

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
  v_keys text[] := array['version', 'updatedAt', 'typeCode', 'axes', 'dpi', 'mainGame', 'sens', 'hand', 'devices', 'favoriteGames', 'cardName', 'crosshair'];
  v_hand jsonb := p_data -> 'hand';
  v_devices jsonb := p_data -> 'devices';
  v_games jsonb := p_data -> 'favoriteGames';
  v_texts text;
  -- src/lib/crosshair.ts の CROSSHAIR_LIMITS と同じ
  c_crosshair_length_min numeric := 1;
  c_crosshair_length_max numeric := 20;
  c_crosshair_thickness_min numeric := 1;
  c_crosshair_thickness_max numeric := 6;
  c_crosshair_gap_min numeric := 0;
  c_crosshair_gap_max numeric := 10;
  v_cross jsonb;
  v_saved jsonb;
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) > 4096 then raise exception 'INVALID_INPUT'; end if;

  -- 版 1 は版 2 に変換する(クロスヘアの初期値を足す)
  if p_data -> 'version' = '1'::jsonb and not (p_data ? 'crosshair') then
    p_data := jsonb_set(p_data, '{version}', '2'::jsonb)
      || jsonb_build_object('crosshair', jsonb_build_object('shape', 'cross', 'color', '#39f3ff', 'length', 6, 'thickness', 2, 'gap', 3, 'outline', true));
    v_hand := p_data -> 'hand';
    v_devices := p_data -> 'devices';
    v_games := p_data -> 'favoriteGames';
  end if;
  if not (p_data ?& v_keys) or exists (select 1 from jsonb_object_keys(p_data) k where k <> all (v_keys)) then raise exception 'INVALID_INPUT'; end if;
  if p_data -> 'version' is distinct from '2'::jsonb or jsonb_typeof(p_data -> 'updatedAt') <> 'string' then raise exception 'INVALID_INPUT'; end if;

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

  -- クロスヘア
  v_cross := p_data -> 'crosshair';
  if jsonb_typeof(v_cross) <> 'object' then raise exception 'INVALID_INPUT'; end if;
  if (select array_agg(k order by k) from jsonb_object_keys(v_cross) k) is distinct from array['color', 'gap', 'length', 'outline', 'shape', 'thickness']
     or not (v_cross ->> 'shape' in ('cross', 'dot', 'circle', 'cross-dot'))
     or jsonb_typeof(v_cross -> 'color') <> 'string' or (v_cross ->> 'color') !~ '^#[0-9a-fA-F]{6}$'
     or jsonb_typeof(v_cross -> 'outline') <> 'boolean' then
    raise exception 'INVALID_INPUT';
  end if;
  if jsonb_typeof(v_cross -> 'length') <> 'number' or jsonb_typeof(v_cross -> 'thickness') <> 'number' or jsonb_typeof(v_cross -> 'gap') <> 'number' then
    raise exception 'INVALID_INPUT';
  end if;
  if (v_cross ->> 'length')::numeric not between c_crosshair_length_min and c_crosshair_length_max
     or (v_cross ->> 'thickness')::numeric not between c_crosshair_thickness_min and c_crosshair_thickness_max
     or (v_cross ->> 'gap')::numeric not between c_crosshair_gap_min and c_crosshair_gap_max
     or (v_cross ->> 'length')::numeric <> trunc((v_cross ->> 'length')::numeric)
     or (v_cross ->> 'thickness')::numeric <> trunc((v_cross ->> 'thickness')::numeric)
     or (v_cross ->> 'gap')::numeric <> trunc((v_cross ->> 'gap')::numeric) then
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

revoke all on function public.save_my_settings from public, anon;
grant execute on function public.save_my_settings to authenticated;
