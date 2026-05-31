import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('[Supabase] .env에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY를 설정하세요.');
}

// 인증 세션을 붙이는 기본 클라이언트 (쓰기/인증용)
export const supabase = createClient(url, key);

// 항상 anon 권한으로 읽는 클라이언트 (공개 랭킹 조회용)
// 로그인 상태에서도 RLS authenticated 정책에 막히지 않음
export const supabasePublic = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${key}` } },
});
