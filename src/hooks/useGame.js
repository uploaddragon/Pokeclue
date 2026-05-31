import { useState, useCallback, useEffect } from 'react';
import DB from '../data/pokemon.js';
import { pickAnswer, getTodayStr } from '../utils/game.js';
import { supabase } from '../lib/supabase.js';

// 익명 유저용 ID/닉네임 (localStorage에 고정 저장)
const ANON_KEY = 'pokeclue_anon';

function getAnonIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem(ANON_KEY) || 'null');
    if (saved?.id && saved?.nickname) return saved;
  } catch {}
  // 없으면 새로 생성
  const randomPoke = DB[Math.floor(Math.random() * DB.length)];
  const identity = {
    id: crypto.randomUUID(),
    nickname: `익명의 ${randomPoke.ko}`,
  };
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
  } catch {
    return null;
  }
}

function saveDailyState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function initState() {
  const saved = loadDailyState();
  const answer = pickAnswer();

  if (saved) {
    const guesses = saved.guessIds
      .map(id => DB.find(p => p.id === id))
      .filter(Boolean);
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
    // 로그인 유저
    const nickname = user.user_metadata?.full_name
      || user.user_metadata?.name
      || user.email?.split('@')[0]
      || '트레이너';
    const { error } = await supabase
      .from('daily_results')
      .upsert({
        user_id: user.id,
        date: today,
        tries,
        solved,
        used_filter: usedFilter,
        nickname,
      }, { onConflict: 'user_id,date' });
    if (error) console.error('daily_results upsert error', error);
  } else {
    // 익명 유저 — 오늘 이미 저장했으면 스킵
    const anonSubmittedKey = `pokeclue_anon_submitted_${today}`;
    if (localStorage.getItem(anonSubmittedKey)) return;

    const anon = getAnonIdentity();
    const { error } = await supabase
      .from('daily_results')
      .insert({
        anon_id: anon.id,
        date: today,
        tries,
        solved,
        used_filter: usedFilter,
        nickname: anon.nickname,
      });
    if (error) { console.error('daily_results anon insert error', error); return; }
    localStorage.setItem(anonSubmittedKey, '1');
  }
}

export function useGame(unlockDex, user) {
  const [state, setState] = useState(initState);
  const { answer, guesses, gameOver, usedFilter, result } = state;
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    saveDailyState({
      date: getTodayStr(),
      guessIds: guesses.map(g => g.id),
      gameOver,
      usedFilter,
      result,
    });
  }, [guesses, gameOver, usedFilter, result]);

  // 로그인 시점에 이미 클리어한 상태라면 user_id로 재저장
  useEffect(() => {
    if (user && result?.win) {
      saveDailyToSupabase(user, { tries: guesses.length, solved: true, usedFilter });
    }
  }, [user]);

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
        const newResult = { win: true, shinyPct };
        const shinyUnlock = isShiny && Math.random() < 0.05;
        unlockDex(prev.answer, shinyUnlock, next.length);
        saveDailyToSupabase(user, { tries: next.length, solved: true, usedFilter: prev.usedFilter });
        return { ...prev, guesses: next, gameOver: true, result: newResult };
      }

      return { ...prev, guesses: next };
    });
  }, [gameOver, unlockDex, user]);

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
    setState(initState());
    setFilterOpen(false);
  }, []);

  return {
    answer, guesses, gameOver, usedFilter, filterOpen,
    result, submitGuess, openFilter, closeFilter, pickFromFilter, resetGame,
  };
}
