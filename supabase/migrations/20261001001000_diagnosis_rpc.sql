-- 診断結果の匿名記録に上限を付ける(監査 run-1 の未確定事項 diagnosis_results.insert.no_aggregate_bound)
-- これまでは anon キーを持つだれでも diagnosis_results に直接 INSERT でき、件数の上限がなかった。
--   1. 表への直接の INSERT をやめ、関数 record_diagnosis を通してだけ記録する
--   2. 値の形を検証する(4軸が -1〜1 の数値、type_code が軸の符号と一致)
--   3. サイト全体で 1分 60件・1日(日本時間)20,000件を超えた分は、エラーにせず記録だけ捨てる
--      (記録は統計用のおまけ。上限に達しても診断結果の表示は止めない)

create index if not exists diagnosis_results_created_at on public.diagnosis_results (created_at);

create or replace function public.record_diagnosis(p_type_code text, p_axes jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_expected text;
begin
  if p_axes is null or jsonb_typeof(p_axes) <> 'object' then raise exception 'INVALID_INPUT'; end if;
  if (select array_agg(k order by k) from jsonb_object_keys(p_axes) k) is distinct from array['attack', 'heat', 'instinct', 'team'] then
    raise exception 'INVALID_INPUT';
  end if;
  if exists (select 1 from jsonb_each(p_axes) e
             where jsonb_typeof(e.value) <> 'number' or (e.value)::numeric < -1 or (e.value)::numeric > 1) then
    raise exception 'INVALID_INPUT';
  end if;
  -- src/lib/scoring.ts の toTypeCode と同じ規則(正なら左の文字、それ以外は右の文字)
  v_expected :=
    (case when (p_axes ->> 'attack')::numeric > 0 then 'A' else 'G' end) ||
    (case when (p_axes ->> 'instinct')::numeric > 0 then 'R' else 'B' end) ||
    (case when (p_axes ->> 'team')::numeric > 0 then 'C' else 'L' end) ||
    (case when (p_axes ->> 'heat')::numeric > 0 then 'H' else 'Z' end);
  if p_type_code is distinct from v_expected then raise exception 'INVALID_INPUT'; end if;

  -- 全体の上限(同時に来ても数え間違えないよう、記録は1件ずつ順番に行う)
  perform pg_advisory_xact_lock(hashtext('diagnosis_results:rate'));
  if (select count(*) from public.diagnosis_results where created_at > now() - interval '1 minute') >= 60 then return; end if;
  if (select count(*) from public.diagnosis_results where created_at >= public.jst_day_start(now())) >= 20000 then return; end if;

  insert into public.diagnosis_results (type_code, axes) values (p_type_code, p_axes);
end $$;
revoke all on function public.record_diagnosis from public;
grant execute on function public.record_diagnosis to anon, authenticated;

-- 表への直接の書き込みは閉じる(読み取りは、もともと許可していない)
drop policy if exists "insert diagnosis results" on public.diagnosis_results;
revoke insert, update, delete on public.diagnosis_results from anon, authenticated;
