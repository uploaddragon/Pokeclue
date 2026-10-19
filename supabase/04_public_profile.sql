-- ============================================================
-- 04. 공개 프로필 조회 함수 (랭킹에서 플레이어 이름을 눌러 보는 프로필용)
--
-- · SECURITY DEFINER 로 auth.users 의 메타데이터를 읽되, 아래에 적은 "공개해도 되는 항목"만 돌려준다.
-- · 이메일/가입 방식/로그인 기록 등은 어떤 경로로도 반환하지 않는다.
--   (OAuth 로그인 사용자의 raw_user_meta_data 에는 email 이 들어 있으므로, 메타데이터를 통째로 반환하면 안 된다.)
-- · 도감(dex_entries)은 RLS 로 본인만 읽을 수 있어서, 개수만 이 함수가 대신 세어 준다 (내용은 노출하지 않음).
-- · 되돌리기: drop function public.get_public_profile(uuid);
-- ============================================================

create or replace function public.get_public_profile(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select jsonb_build_object(
    'user_id',          u.id,
    'nickname',         left(coalesce(nullif(u.raw_user_meta_data ->> 'pokeclue_nickname', ''),
                                      nullif(u.raw_user_meta_data ->> 'full_name', ''),
                                      nullif(u.raw_user_meta_data ->> 'name', ''),
                                      '트레이너'), 40),
    'equipped_title',   left(u.raw_user_meta_data ->> 'equipped_title', 60),
    'profile_pokemon',  left(u.raw_user_meta_data ->> 'profile_pokemon', 60),
    -- 사용자가 직접 수정할 수 있는 값이므로 배열이 아니면 빈 배열, 길이·개수는 제한
    'earned_titles',    case
                          when jsonb_typeof(u.raw_user_meta_data -> 'earned_titles') = 'array' then
                            (select coalesce(jsonb_agg(s.v), '[]'::jsonb)
                               from (select left(e.v, 60) as v
                                       from jsonb_array_elements_text(u.raw_user_meta_data -> 'earned_titles') as e(v)
                                      limit 300) s)
                          else '[]'::jsonb
                        end,
    'joined',           u.created_at::date,
    'dex_count',        (select count(*) from public.dex_entries d where d.user_id = u.id),
    'shiny_count',      (select count(*) from public.dex_entries d where d.user_id = u.id and d.shiny is true),
    'daily_clears',     (select count(*) from public.daily_results r where r.user_id = u.id and r.solved is true),
    'challenge_clears', (select count(*) from public.challenge_clears c where c.user_id = u.id),
    'battle_wins',      coalesce((select b.wins   from public.battle_stats b where b.user_id = u.id), 0),
    'battle_losses',    coalesce((select b.losses from public.battle_stats b where b.user_id = u.id), 0)
  )
  from auth.users u
  where u.id = p_user
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;
