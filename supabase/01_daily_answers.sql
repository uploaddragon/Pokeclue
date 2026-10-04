-- ============================================================
-- 01. 데일리 정답 테이블 (정답을 클라이언트 번들에서 서버로 이동)
-- 실행 순서: 01 → (supabase/daily_answers_seed.sql) → 프런트 배포
-- ============================================================

create table if not exists public.daily_answers (
  date      date primary key,
  answer_id text not null
);

alter table public.daily_answers enable row level security;

-- 읽기: "UTC+14 기준 오늘"까지의 날짜만 공개.
--  · 클라이언트가 브라우저 로컬 날짜로 정답을 요청하므로, 가장 빠른 시간대(UTC+14)의
--    사용자도 자기 '오늘' 정답을 받을 수 있어야 한다.
--  · 그 이후 날짜(= 아직 어느 시간대에서도 오지 않은 날)는 서버가 절대 내주지 않는다.
--  · 쓰기 정책은 없다 → 클라이언트(anon/authenticated)는 insert/update/delete 불가.
drop policy if exists daily_answers_read on public.daily_answers;
create policy daily_answers_read on public.daily_answers
  for select to anon, authenticated
  using (date <= ((now() at time zone 'UTC') + interval '14 hours')::date);

revoke all on public.daily_answers from anon, authenticated;
grant select on public.daily_answers to anon, authenticated;
