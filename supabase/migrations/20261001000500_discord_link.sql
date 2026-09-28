-- === my_inbox: 成立した相手の Discord 数字 ID も返す ===
-- Discord のユーザー名は変更・再取得されうるため、登録時に保存した名前だけを連絡先にすると、
-- 名前を引き継いだ別人にフレンド申請が届くおそれがある。変わらない discord_user_id を一緒に返し、
-- 画面ではプロフィールへのリンク(discord.com/users/<id>)を主な連絡先にする。
-- 戻り値の列が変わるので、drop してから作り直す。
drop function if exists public.my_inbox();

create function public.my_inbox()
returns table (kind text, approach_id uuid, partner_id uuid, nickname text, type_code text, axes jsonb, games jsonb,
               discord_username text, discord_user_id text, status text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  perform public._expire_old(auth.uid());
  return query
  -- 届いた声かけ(返事待ち)
  select 'received', a.id, p.id, p.nickname, p.type_code, p.axes, p.games, null::text, null::text, a.status::text, a.created_at
  from public.approaches a join public.profiles p on p.id = a.from_id
  where a.to_id = auth.uid() and a.status = 'pending' and public._visible(auth.uid(), a.from_id)
  union all
  -- 送った声かけ(パスされたものも「返事待ち」→「期限切れ」として見せる)
  select 'sent', a.id, p.id, p.nickname, p.type_code, p.axes, p.games, null::text, null::text,
         case when a.status = 'passed' and a.created_at >= now() - interval '7 days' then 'pending'
              when a.status = 'passed' then 'expired'
              else a.status::text end,
         a.created_at
  from public.approaches a join public.profiles p on p.id = a.to_id
  where a.from_id = auth.uid() and a.status in ('pending', 'passed', 'expired') and public._visible(auth.uid(), a.to_id)
  union all
  -- 成立した相手(相互 OK のときだけ Discord の名前と ID を返す)
  select 'matched', a.id, p.id, p.nickname, p.type_code, p.axes, p.games, pi.discord_username, pi.discord_user_id,
         'accepted', coalesce(a.responded_at, a.created_at)
  from public.approaches a
  join public.profiles p on p.id = case when a.from_id = auth.uid() then a.to_id else a.from_id end
  join public.private_info pi on pi.user_id = p.id
  where a.status = 'accepted' and (a.from_id = auth.uid() or a.to_id = auth.uid()) and public._visible(auth.uid(), p.id)
  order by 11 desc;
end $$;

revoke all on function public.my_inbox from public, anon;
grant execute on function public.my_inbox to authenticated;
