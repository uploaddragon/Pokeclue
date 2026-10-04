-- 실행 전 점검용 (읽기 전용, 아무것도 바꾸지 않음). 결과를 캡처해 두면 문제 시 비교할 수 있다.

-- 1) 대상 테이블 컬럼 타입 (가드가 가정하는 컬럼이 실제로 있는지)
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('daily_results', 'challenge_clears', 'battle_stats')
order by table_name, ordinal_position;

-- 2) 이미 걸려 있는 트리거 (이름 충돌/중복 확인)
select event_object_table as table_name, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table in ('daily_results', 'challenge_clears', 'battle_stats');

-- 3) 기존 데이터 중 새 규칙에 어긋나는 행 수 (새 규칙은 기존 행엔 적용되지 않지만 현황 파악용)
select 'daily_results tries<1 (solved)' as check_name, count(*) from public.daily_results where solved is true and (tries is null or tries < 1)
union all
select 'challenge_clears tries not in 1..30', count(*) from public.challenge_clears where tries is null or tries < 1 or tries > 30
union all
select 'battle_stats wins+losses = 0', count(*) from public.battle_stats where wins + losses = 0;
