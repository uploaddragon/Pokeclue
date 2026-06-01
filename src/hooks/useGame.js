import { useState, useCallback, useEffect, useRef } from 'react';
import DB from '../data/pokemon.js';
import { pickAnswer, getTodayStr } from '../utils/game.js';
import { supabase, supabasePublic } from '../lib/supabase.js';

const ANON_KEY = 'pokeclue_anon';

function getAnonIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem(ANON_KEY) || 'null');
    if (saved?.id && saved?.nickname) return saved;
  } catch {}
  const randomPoke = DB[Math.floor(Math.random() * DB.length)];
  const identity = { id: crypto.randomUUID(), nickname: `익명의 ${randomPoke.ko}` };
  localStorage.setItem(ANON_KEY, JSON.stringify(identity));
  return identity;
}

const STORAGE_KEY = 'pokewordle_daily';

function loadDailyState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved.date !== getTodayStr()) return null;
    return saved;
  } catch { return null; }
}

function saveDailyState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function initState() {
  const saved = loadDailyState();
  const answer = pickAnswer();
  if (saved) {
    const guesses = saved.guessIds.map(id => DB.find(p => p.id === id)).filter(Boolean);
    return {
      answer,
      guesses,
      gameOver: saved.gameOver ?? false,
      usedFilter: saved.usedFilter ?? false,
      result: saved.result ?? null,
    };
  }
  return { answer, guesses: [], gameOver: false, usedFilter: false, result: null };
}

async function saveDailyToSupabase(user, { tries, solved, usedFilter }) {
  const today = getTodayStr();

  if (user) {
    const nickname = user.user_metadata?.pokeclue_nickname
      || user.user_metadata?.full_name
      || user.user_metadata?.name
      || user.email?.split('@')[0]
      || '트레이너';
    // 로그인 유저는 반드시 인증된 클라이언트(supabase) 사용 — RLS auth.uid() 검사 통과
    const { error } = await supabase
      .from('daily_results')
      .upsert(
        { user_id: user.id, date: today, tries, solved, used_filter: usedFilter, nickname },
        { onConflict: 'user_id,date' }
      );
    if (error) console.error('daily_results upsert error', error);
  } else {
    const anonSubmittedKey = `pokeclue_anon_submitted_${today}`;
    if (localStorage.getItem(anonSubmittedKey)) return;
    const anon = getAnonIdentity();
    const { error } = await supabasePublic
      .from('daily_results')
      .insert({ anon_id: anon.id, date: today, tries, solved, used_filter: usedFilter, nickname: anon.nickname });
    if (error) { console.error('daily_results anon insert error', error); return; }
    localStorage.setItem(anonSubmittedKey, '1');
  }
}

export function useGame(unlockDex, user, authLoading) {
  const [state, setState] = useState(initState);
  const { answer, guesses, gameOver, usedFilter, result } = state;
  const [filterOpen, setFilterOpen] = useState(false);

  // localStorage 동기화
  useEffect(() => {
    saveDailyState({
      date: getTodayStr(),
      guessIds: guesses.map(g => g.id),
      gameOver,
      usedFilter,
      result,
    });
  }, [guesses, gameOver, usedFilter, result]);

  // 클리어 후 Supabase 저장 — result.win이 켜지거나 user가 바뀔 때 실행
  // setState 안에서 호출하지 않고 effect에서 처리
  const savedForUserRef = useRef(null); // 마지막으로 저장한 user.id (중복 저장 방지)

  const nickname = user?.user_metadata?.pokeclue_nickname
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || null;

  useEffect(() => {
    if (!result?.win) return;
    if (authLoading) return;
    const userId = user?.id ?? 'anon';
    // user_id + nickname 조합을 키로 써서 닉네임 변경 시에도 재저장
    const saveKey = `${userId}::${nickname ?? ''}`;
    if (savedForUserRef.current === saveKey) return;
    savedForUserRef.current = saveKey;
    saveDailyToSupabase(user, { tries: guesses.length, solved: true, usedFilter });
  }, [result?.win, user?.id, authLoading, nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitGuess = useCallback((pokemonId) => {
    if (gameOver) return;
    const g = DB.find(x => x.id === pokemonId);
    if (!g) { alert('포켓몬을 찾을 수 없습니다.'); return; }

    setState(prev => {
      if (prev.guesses.find(x => x.id === g.id)) {
        alert('이미 시도했습니다.');
        return prev;
      }
      const next = [...prev.guesses, g];
      const isOk = g.id === prev.answer.id;

      if (isOk) {
        const isShiny = !prev.usedFilter;
        const shinyPct = isShiny ? '5%' : '1%';
        const shinyUnlock = isShiny && Math.random() < 0.05;
        unlockDex(prev.answer, shinyUnlock, next.length);
        // Supabase 저장은 위 useEffect에서 담당 (setState 안에서 async 호출 금지)
        return { ...prev, guesses: next, gameOver: true, result: { win: true, shinyPct } };
      }

      return { ...prev, guesses: next };
    });
  }, [gameOver, unlockDex]);

  const openFilter = useCallback(() => {
    setState(prev => ({ ...prev, usedFilter: true }));
    setFilterOpen(true);
  }, []);

  const closeFilter = useCallback(() => setFilterOpen(false), []);

  const pickFromFilter = useCallback((name) => {
    setFilterOpen(false);
    submitGuess(name);
  }, [submitGuess]);

  const resetGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    savedForUserRef.current = null;
    setState(initState());
    setFilterOpen(false);
  }, []);

  return {
    answer, guesses, gameOver, usedFilter, filterOpen,
    result, submitGuess, openFilter, closeFilter, pickFromFilter, resetGame,
  };
}
