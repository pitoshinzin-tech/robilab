-- エイム記録と成長グラフ(plan.md D43)
-- 自分の自己ベスト(aim_scores、1 人 1 日 1 行)だけを、今日から 400 日前までの範囲で日付の順に返す。
-- 返すのは日付・点数・正確さ・時間だけ(char_id・submitted_at は返さない)。
-- 利用停止・BAN の人も自分の記録は読める(ほかの人には何も見えないため)。
create or replace function public.my_aim_history(p_from date)
returns table (play_date date, score int, accuracy numeric, time_ms int)
language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_today date := public._aim_today();
begin
  if v_uid is null then raise exception 'NOT_LOGGED_IN'; end if;
  return query
    select s.play_date, s.score, s.accuracy, s.time_ms
    from public.aim_scores s
    where s.user_id = v_uid
      and s.play_date >= greatest(coalesce(p_from, v_today - 399), v_today - 399)
      and s.play_date <= v_today
    order by s.play_date
    limit 400;
end $$;

revoke all on function public.my_aim_history(date) from public, anon;
grant execute on function public.my_aim_history(date) to authenticated;
