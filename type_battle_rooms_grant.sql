-- type_battle_rooms 테이블 권한 부여 (RLS 정책과는 별개로 필요)
grant select, insert, update, delete on type_battle_rooms to anon, authenticated;
