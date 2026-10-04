-- 02_integrity_guards.sql 되돌리기 (문제가 생기면 이것만 실행하면 즉시 원상복구)
drop trigger if exists trg_guard_challenge_clears on public.challenge_clears;
drop trigger if exists trg_guard_daily_results    on public.daily_results;
drop trigger if exists trg_guard_battle_stats     on public.battle_stats;

drop function if exists public.guard_challenge_clears();
drop function if exists public.guard_daily_results();
drop function if exists public.guard_battle_stats();
drop function if exists public._guard_min_interval(text, text, int);
drop function if exists public._api_uid();
drop function if exists public._is_api_client();
drop table    if exists public.integrity_last_write;
