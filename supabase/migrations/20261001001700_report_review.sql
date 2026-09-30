-- 通報は、すぐに相手を利用停止にせず、運営の確認を待つ(本人の決定 2026-09-30、plan.md D42)
--   - これまで:通報が 1 件入ると、理由にかかわらず相手を自動で suspended にしていた
--     (ブロックされた人が、ブロックした人を通報して止めることもできた)
--   - これから:自動で利用停止にするのは、理由が「年齢詐称」(age_fake)のときだけ。
--     ロビーは 18 歳以上限定なので、未成年の可能性がある人は確認が終わるまで止める
--   - どの理由でも、通報した人は相手をブロックする(通報した人の一覧からは消える)。これまでと同じ
--   - それ以外の理由は、運営が毎日の確認で必要に応じて止める(docs/ops/moderation.md)
--   - 退会(delete_me)は、これまでどおり open の通報があるあいだはできない(0600 のまま)
-- 0600 の report_user の定義をそのまま写し、利用停止の 1 行に理由の条件を足しただけ。

-- === report_user: 利用停止は age_fake のときだけ ===
create or replace function public.report_user(p_id uuid, p_reason public.report_reason, p_detail text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me_discord_id text;
  v_target_discord_id text;
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and status = 'active') then raise exception 'NOT_ACTIVE'; end if;
  select discord_user_id into v_me_discord_id from public.private_info where user_id = auth.uid();
  if v_me_discord_id is null then raise exception 'NOT_ACTIVE'; end if;
  perform pg_advisory_xact_lock(hashtext('report:' || v_me_discord_id));
  if p_id = auth.uid() or not exists (select 1 from public.profiles where id = p_id) then raise exception 'NOT_FOUND'; end if;
  select discord_user_id into v_target_discord_id from public.private_info where user_id = p_id;
  -- すでに通報済みなら、対象が停止されて _visible が false になっていても ALREADY_REPORTED を返す
  -- (退会・再登録をはさんでも、同じ Discord 同士なら通報済みとみなす)
  if exists (select 1 from public.reports where reporter_id = auth.uid() and target_id = p_id)
     or exists (select 1 from public.reports
                where reporter_discord_id = v_me_discord_id and target_discord_id = v_target_discord_id) then
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
  if (select count(*) from public.reports
      where (reporter_discord_id = v_me_discord_id or reporter_id = auth.uid())
        and created_at >= public.jst_day_start(now())) >= 5 then
    raise exception 'REPORT_LIMIT';
  end if;
  insert into public.reports (reporter_id, reporter_discord_id, target_id, target_discord_id, reason, detail)
    values (auth.uid(), v_me_discord_id, p_id, v_target_discord_id, p_reason, coalesce(p_detail, ''));
  -- 年齢詐称(18 歳未満の疑い)だけは、運営の確認が終わるまで利用停止にする
  if p_reason = 'age_fake' then
    update public.profiles set status = 'suspended' where id = p_id and status = 'active';
  end if;
  perform public.block_user(p_id);
exception
  when unique_violation then raise exception 'ALREADY_REPORTED';
end $$;

revoke all on function public.report_user from public, anon;
grant execute on function public.report_user to authenticated;
