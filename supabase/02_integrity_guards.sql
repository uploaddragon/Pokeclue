-- ============================================================
-- 02. 기록 위조 방지 가드 (트리거)
--  · 클라이언트(API) 요청에만 적용된다. SQL Editor / service_role 로 직접 수정하는 건 영향 없음.
--  · 기존 데이터는 건드리지 않는다 (새 쓰기만 검사).
--  · 되돌리기: supabase/99_rollback_guards.sql
-- 조정 가능한 값은 각 함수 안의 숫자(8초, 30회, 3000회 등)이다.
-- ============================================================

-- API(PostgREST) 요청인지 판별. SQL Editor 등 직접 접속이면 false.
create or replace function public._is_api_client() returns boolean
language sql stable as $$
  select coalesce(
           nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
           nullif(current_setting('request.jwt.claim.role', true), ''),
           ''
         ) in ('anon', 'authenticated')
$$;

-- 요청자의 uid (없으면 null). auth.uid() 에 의존하지 않고 claims 에서 직접 읽는다.
create or replace function public._api_uid() returns text
language sql stable as $$
  select coalesce(
           nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
           nullif(current_setting('request.jwt.claim.sub', true), '')
         )
$$;

-- 사용자별 마지막 쓰기 시각 (기존 테이블의 컬럼에 의존하지 않기 위한 별도 장부)
create table if not exists public.integrity_last_write (
  user_id text        not null,
  kind    text        not null,
  at      timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.integrity_last_write enable row level security;      -- 정책 없음 = 클라이언트 접근 불가
revoke all on public.integrity_last_write from anon, authenticated;

-- 최소 간격 검사: 간격 안에 다시 쓰면 예외
create or replace function public._guard_min_interval(p_user text, p_kind text, p_seconds int)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare ok_at timestamptz;
begin
  if p_user is null then return; end if;
  insert into public.integrity_last_write as w (user_id, kind, at)
  values (p_user, p_kind, now())
  on conflict (user_id, kind) do update set at = now()
    where w.at <= now() - make_interval(secs => p_seconds)
  returning at into ok_at;
  if ok_at is null then
    raise exception 'rate_limited: % writes too frequent', p_kind using errcode = 'P0001';
  end if;
end $$;

-- ───────── 헬퍼 함수 노출 차단 ─────────
-- Supabase는 public 스키마의 함수를 anon/authenticated 가 REST(/rpc/...)로 호출할 수 있게 기본 허용한다.
-- _guard_min_interval 이 그대로 노출되면 누구나 남의 user_id 로 호출해 그 사람의 정상 기록을
-- 'rate_limited' 로 막을 수 있다. 트리거 함수(security definer, 소유자 권한)는 내부에서 호출하므로 영향 없음.
revoke all on function public._guard_min_interval(text, text, int) from public, anon, authenticated;
revoke all on function public._is_api_client()                    from public, anon, authenticated;
revoke all on function public._api_uid()                          from public, anon, authenticated;

-- ───────── challenge_clears ─────────
create or replace function public.guard_challenge_clears() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public._is_api_client() then return new; end if;
  if public._api_uid() is not null and new.user_id::text is distinct from public._api_uid() then
    raise exception 'forbidden: user mismatch' using errcode = 'P0001';
  end if;
  -- 현재 규칙은 8번 이내. 규칙이 바뀌어도 정상 기록이 막히지 않도록 넉넉하게 30.
  if new.tries is null or new.tries < 1 or new.tries > 30 then
    raise exception 'invalid tries' using errcode = 'P0001';
  end if;
  perform public._guard_min_interval(new.user_id::text, 'challenge_clear', 8);
  return new;
end $$;

drop trigger if exists trg_guard_challenge_clears on public.challenge_clears;
create trigger trg_guard_challenge_clears
  before insert on public.challenge_clears
  for each row execute function public.guard_challenge_clears();

-- ───────── daily_results ─────────
create or replace function public.guard_daily_results() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  utc_today date := (now() at time zone 'UTC')::date;
  max_day   date := ((now() at time zone 'UTC') + interval '14 hours')::date;
begin
  if not public._is_api_client() then return new; end if;

  if new.user_id is not null and public._api_uid() is not null
     and new.user_id::text is distinct from public._api_uid() then
    raise exception 'forbidden: user mismatch' using errcode = 'P0001';
  end if;

  -- 임의 날짜(과거 소급/미래 선점) 기록 방지. 시간대 차이를 고려해 -2일 ~ UTC+14 오늘까지만.
  if new.date::date < utc_today - 2 or new.date::date > max_day then
    raise exception 'invalid date' using errcode = 'P0001';
  end if;

  -- 도감 종수 이상으로 시도할 수는 없다. 1 미만/비정상 값 차단.
  if new.solved is true and (new.tries is null or new.tries < 1 or new.tries > 3000) then
    raise exception 'invalid tries' using errcode = 'P0001';
  end if;

  -- 이미 정상 기록된 결과는 재제출로 갈아치울 수 없다 (닉네임/칭호/프로필 갱신은 허용).
  if tg_op = 'UPDATE' and old.solved is true and old.tries is not null and old.tries >= 1 then
    new.solved      := true;
    new.tries       := old.tries;
    if old.used_filter is not null then new.used_filter := old.used_filter; end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_daily_results on public.daily_results;
create trigger trg_guard_daily_results
  before insert or update on public.daily_results
  for each row execute function public.guard_daily_results();

-- ───────── battle_stats ─────────
create or replace function public.guard_battle_stats() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public._is_api_client() then return new; end if;

  if public._api_uid() is not null and new.user_id::text is distinct from public._api_uid() then
    raise exception 'forbidden: user mismatch' using errcode = 'P0001';
  end if;

  if tg_op = 'INSERT' then
    if new.wins < 0 or new.losses < 0 or (new.wins + new.losses) > 1 then
      raise exception 'invalid initial stats' using errcode = 'P0001';
    end if;
  else
    -- 한 번에 1판 분량만 증가 가능, 감소 불가
    if new.wins < old.wins or new.losses < old.losses
       or (new.wins - old.wins) + (new.losses - old.losses) > 1 then
      raise exception 'invalid stats change' using errcode = 'P0001';
    end if;
  end if;

  perform public._guard_min_interval(new.user_id::text, 'battle_stat', 8);
  return new;
end $$;

drop trigger if exists trg_guard_battle_stats on public.battle_stats;
create trigger trg_guard_battle_stats
  before insert or update on public.battle_stats
  for each row execute function public.guard_battle_stats();

revoke all on function public.guard_challenge_clears() from public, anon, authenticated;
revoke all on function public.guard_daily_results()    from public, anon, authenticated;
revoke all on function public.guard_battle_stats()     from public, anon, authenticated;
