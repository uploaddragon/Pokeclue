-- 타입 대전 모드용 테이블
create table if not exists type_battle_rooms (
  id text primary key,
  status text not null default 'waiting',        -- waiting | playing | finished
  round int not null default 1,
  round_started_at timestamptz not null default now(),

  p1_type text,
  p2_type text,
  p1_guesses jsonb not null default '[]'::jsonb,  -- 이번 라운드 내 오답 목록
  p2_guesses jsonb not null default '[]'::jsonb,

  round_winner text,       -- 'p1' | 'p2' | 'draw' | null
  round_answer_id text,    -- 라운드를 맞춘 포켓몬 id (연출용)

  p1_score int not null default 0,
  p2_score int not null default 0,
  winner text,             -- 'p1' | 'p2' | null (5선승 최종 승자)

  p1_rematch boolean not null default false,
  p2_rematch boolean not null default false,

  p1_uid uuid, p1_anon text, p1_nick text, p1_title text, p1_profile_pokemon text,
  p2_uid uuid, p2_anon text, p2_nick text, p2_title text, p2_profile_pokemon text,

  created_at timestamptz not null default now()
);

alter table type_battle_rooms enable row level security;

create policy type_battle_rooms_select on type_battle_rooms for select using (true);
create policy type_battle_rooms_insert on type_battle_rooms for insert with check (true);
create policy type_battle_rooms_update on type_battle_rooms for update using (true);
create policy type_battle_rooms_delete on type_battle_rooms for delete using (true);

-- Realtime 구독 활성화 (postgres_changes 이벤트 받으려면 필요)
alter publication supabase_realtime add table type_battle_rooms;
