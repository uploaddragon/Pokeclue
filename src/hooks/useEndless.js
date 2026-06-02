import { useState, useCallback, useEffect } from 'react';
import DB from '../data/pokemon.js';
import { getTodayStr } from '../utils/game.js';

const CHALLENGE_MAX_TRIES = 8;
const CHALLENGE_DAILY_LIMIT = 3;
const CHALLENGE_KEY   = 'pokeclue_challenge';
const NORMAL_STATE_KEY    = 'pokeclue_endless_normal';
const CHALLENGE_STATE_KEY = 'pokeclue_endless_challenge';

// ── 공통 유틸 ──────────────────────────────────────────────────

function pickRandom(excludeIds = []) {
  const pool = DB.filter(p => !excludeIds.includes(p.id));
  if (!pool.length) return DB[Math.floor(Math.random() * DB.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}

// ── 챌린지 데일리 횟수 ──────────────────────────────────────────

function loadChallengeDaily() {
  const raw = load(CHALLENGE_KEY);
  if (raw?.date === getTodayStr()) return raw;
  return { date: getTodayStr(), remaining: CHALLENGE_DAILY_LIMIT };
}

function saveChallengeDaily(state) {
  save(CHALLENGE_KEY, state);
}

// ── 일반 엔드리스 ──────────────────────────────────────────────

function initNormalState() {
  const saved = load(NORMAL_STATE_KEY);
  if (saved?.answerId) {
    const answer = DB.find(p => p.id === saved.answerId);
    if (answer) {
      const guesses = (saved.guessIds || []).map(id => DB.find(p => p.id === id)).filter(Boolean);
      return { answer, guesses, gameOver: saved.gameOver ?? false, result: saved.result ?? null };
    }
  }
  return { answer: pickRandom(), guesses: [], gameOver: false, result: null };
}

export function useEndlessNormal() {
  const [state, setState] = useState(initNormalState);
  const [filterOpen, setFilterOpen] = useState(false);
  const [usedFilter, setUsedFilter] = useState(false);

  const { answer, guesses, gameOver, result } = state;

  // 상태 변경 시 저장
  useEffect(() => {
    save(NORMAL_STATE_KEY, {
      answerId: answer.id,
      guessIds: guesses.map(g => g.id),
      gameOver,
      result,
    });
  }, [answer, guesses, gameOver, result]);

  const submitGuess = useCallback((pokemonId) => {
    if (gameOver) return;
    const g = DB.find(x => x.id === pokemonId);
    if (!g) return;

    setState(prev => {
      if (prev.guesses.find(x => x.id === g.id)) { alert('이미 시도했습니다.'); return prev; }
      const next = [...prev.guesses, g];
      if (g.id === prev.answer.id) {
        const isShiny = Math.random() < 0.05;
        return { ...prev, guesses: next, gameOver: true, result: { win: true, isShiny } };
      }
      return { ...prev, guesses: next };
    });
  }, [gameOver]);

  const nextPokemon = useCallback(() => {
    const next = { answer: pickRandom([answer.id]), guesses: [], gameOver: false, result: null };
    setState(next);
    setFilterOpen(false);
    setUsedFilter(false);
  }, [answer]);

  const openFilter  = useCallback(() => { setUsedFilter(true); setFilterOpen(true); }, []);
  const closeFilter = useCallback(() => setFilterOpen(false), []);
  const pickFromFilter = useCallback((id) => { setFilterOpen(false); submitGuess(id); }, [submitGuess]);

  return {
    answer, guesses, gameOver, filterOpen, usedFilter, result,
    submitGuess, openFilter, closeFilter, pickFromFilter, nextPokemon,
  };
}

// ── 챌린지 엔드리스 ────────────────────────────────────────────

function initChallengeState() {
  const saved = load(CHALLENGE_STATE_KEY);
  // 오늘 날짜 것만 복원
  if (saved?.date === getTodayStr() && saved?.answerId) {
    const answer = DB.find(p => p.id === saved.answerId);
    if (answer) {
      const guesses = (saved.guessIds || []).map(id => DB.find(p => p.id === id)).filter(Boolean);
      return { answer, guesses, gameOver: saved.gameOver ?? false, result: saved.result ?? null };
    }
  }
  return { answer: pickRandom(), guesses: [], gameOver: false, result: null };
}

export function useEndlessChallenge(unlockDex) {
  const [daily, setDaily]   = useState(loadChallengeDaily);
  const [state, setState]   = useState(initChallengeState);

  const { answer, guesses, gameOver, result } = state;
  const remaining = daily.remaining;

  // 상태 변경 시 저장
  useEffect(() => {
    save(CHALLENGE_STATE_KEY, {
      date: getTodayStr(),
      answerId: answer.id,
      guessIds: guesses.map(g => g.id),
      gameOver,
      result,
    });
  }, [answer, guesses, gameOver, result]);

  const submitGuess = useCallback((pokemonId) => {
    if (gameOver || remaining <= 0) return;
    const g = DB.find(x => x.id === pokemonId);
    if (!g) return;

    setState(prev => {
      if (prev.guesses.find(x => x.id === g.id)) { alert('이미 시도했습니다.'); return prev; }
      const next = [...prev.guesses, g];
      const isCorrect  = g.id === prev.answer.id;
      const outOfTries = next.length >= CHALLENGE_MAX_TRIES && !isCorrect;

      if (isCorrect) {
        const isShiny = Math.random() < 0.05;
        unlockDex(prev.answer, isShiny, next.length);
        return { ...prev, guesses: next, gameOver: true, result: { win: true, isShiny } };
      }
      if (outOfTries) {
        const nextDaily = { ...daily, remaining: Math.max(0, daily.remaining - 1) };
        setDaily(nextDaily);
        saveChallengeDaily(nextDaily);
        return { ...prev, guesses: next, gameOver: true, result: { win: false } };
      }
      return { ...prev, guesses: next };
    });
  }, [gameOver, remaining, daily, unlockDex]);

  const nextChallenge = useCallback(() => {
    if (remaining <= 0) return;
    setState({ answer: pickRandom([answer.id]), guesses: [], gameOver: false, result: null });
  }, [answer, remaining]);

  return {
    answer, guesses, gameOver, result, remaining,
    maxTries: CHALLENGE_MAX_TRIES,
    submitGuess, nextChallenge,
  };
}
