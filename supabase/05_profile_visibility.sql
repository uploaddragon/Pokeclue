-- ============================================================
-- 05. 프로필 공개 여부 반영 (04 의 get_public_profile 을 교체)
--
-- · 사용자가 프로필 설정에서 "프로필 공개"를 끄면 user_metadata.profile_public = false 가 저장된다.
-- · 비공개 사용자는 닉네임·장착 칭호·프로필 포켓몬만 돌려준다.
--   (이 셋은 랭킹 행에 이미 들어 있는 값이라 새로 노출되는 정보가 아니다)
--   도감 수·이로치 수·데일리/챌린지/대전 기록·획득 칭호·가입일은 돌려주지 않는다.
-- · 값이 없거나 false 가 아니면 공개(기본값). 04 와 동작이 같다.
-- · 이메일 등 개인정보는 04 와 동일하게 어떤 경우에도 반환하지 않는다.
-- · 되돌리기: 04_public_profile.sql 을 다시 실행하면 이전 동작으로 돌아간다.
--
-- ※ 한계: 랭킹 자체(데일리/챌린지 순위·시도 횟수)는 별도 공개 테이블이라 이 설정과 무관하게 계속 보인다.
-- ============================================================

create or replace function public.get_public_profile(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select case
    when coalesce(u.raw_user_meta_data ->> 'profile_public', 'true') = 'false' then
      jsonb_build_object(
        'user_id',         u.id,
        'private',         true,
        'nickname',        left(coalesce(nullif(u.raw_user_meta_data ->> 'pokeclue_nickname', ''),
                                         nullif(u.raw_user_meta_data ->> 'full_name', ''),
                                         nullif(u.raw_user_meta_data ->> 'name', ''),
                                         '트레이너'), 40),
        'equipped_title',  left(u.raw_user_meta_data ->> 'equipped_title', 60),
        'profile_pokemon', left(u.raw_user_meta_data ->> 'profile_pokemon', 60)
      )
    else
      jsonb_build_object(
        'user_id',          u.id,
        'private',          false,
        'nickname',         left(coalesce(nullif(u.raw_user_meta_data ->> 'pokeclue_nickname', ''),
                                          nullif(u.raw_user_meta_data ->> 'full_name', ''),
                                          nullif(u.raw_user_meta_data ->> 'name', ''),
                                          '트레이너'), 40),
        'equipped_title',   left(u.raw_user_meta_data ->> 'equipped_title', 60),
        'profile_pokemon',  left(u.raw_user_meta_data ->> 'profile_pokemon', 60),
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
  end
  from auth.users u
  where u.id = p_user
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;
