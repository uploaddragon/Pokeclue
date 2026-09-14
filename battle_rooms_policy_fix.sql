-- battle_rooms: 기존 정책을 제거하고 permissive 정책으로 재설정
-- (RLS를 켠 뒤, 기존 update 정책이 status='finished' 전환을 막고 있어서
--  정답 제출 시 조용히 실패하는 문제를 해결)

drop policy if exists battle_rooms_select on battle_rooms;
drop policy if exists battle_rooms_insert on battle_rooms;
drop policy if exists battle_rooms_update on battle_rooms;

create policy battle_rooms_select on battle_rooms for select using (true);
create policy battle_rooms_insert on battle_rooms for insert with check (true);
create policy battle_rooms_update on battle_rooms for update using (true) with check (true);

-- 참고: delete 정책은 의도적으로 만들지 않습니다 (아무도 남의 방을 삭제 못하도록).
