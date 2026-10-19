import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { getTodayStr } from '../utils/game.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 로그인/로그아웃 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  async function signInWithDiscord() {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function updateNickname(nickname) {
    const { data, error } = await supabase.auth.updateUser({
      data: { pokeclue_nickname: nickname },
    });
    if (!error) {
      setUser(data.user);
      // 오늘 랭킹 기록의 닉네임도 즉시 업데이트
      await supabase
        .from('daily_results')
        .update({ nickname })
        .eq('user_id', data.user.id)
        .eq('date', getTodayStr());
    }
    return error;
  }

  async function updateProfilePokemon(pokemonId, isShiny) {
    const value = pokemonId == null ? null : (isShiny ? `${pokemonId}-shiny` : String(pokemonId));
    const { data, error } = await supabase.auth.updateUser({
      data: { profile_pokemon: value },
    });
    if (!error) {
      setUser(data.user);
      await supabase
        .from('daily_results')
        .update({ profile_pokemon: value })
        .eq('user_id', data.user.id)
        .eq('date', getTodayStr());
    }
    return error;
  }

  // 프로필 공개 여부 (user_metadata.profile_public). 서버 함수 get_public_profile 이 이 값을 보고 응답을 줄인다.
  async function updateProfileVisibility(isPublic) {
    const { data, error } = await supabase.auth.updateUser({
      data: { profile_public: !!isPublic },
    });
    if (!error) setUser(data.user);
    return error;
  }

  return { user, loading, signInWithGoogle, signInWithDiscord, signOut, updateNickname, updateProfilePokemon, updateProfileVisibility };
}
