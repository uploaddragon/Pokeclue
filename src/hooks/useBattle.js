import { useState, useEffect, useCallback, useRef } from 'react';
import DB from '../data/pokemon.js';
import { createClient } from '@supabase/supabase-js';

// 배틀 전용 클라이언트 — 세션 없이 anon key만 사용
const bc = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getIdentity(user) {
  if (user) return {
    uid: user.id,
    anon: null,
    nick: user.user_metadata?.pokeclue_nickname
      || user.user_metadata?.full_name
      || user.email?.split('@')[0]
      || '트레이너',
  };
  try {
    const s = JSON.parse(localStorage.getItem('pokeclue_anon') || 'null');
    if (s?.id) return { uid: null, anon: s.id, nick: s.nickname || '트레이너' };
  } catch {}
  return { uid: null, anon: null, nick: '트레이너' };
}

export function useBattle(user) {
  const [phase, setPhase] = useState('select');
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState(null);
  const [mySlot, setMySlot] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [error, setError] = useState('');
  const channelRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => () => {
    if (channelRef.current) bc.removeChannel(channelRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  function subscribeRoom(code) {
    if (channelRef.current) bc.removeChannel(channelRef.current);
    channelRef.current = bc
      .channel(`battle-${code}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'battle_rooms', filter: `id=eq.${code}`,
      }, ({ new: r }) => {
        setRoom(r);
        if (r.status === 'playing') {
          clearTimeout(timeoutRef.current);
          setPhase('playing');
        }
        if (r.status === 'finished') setPhase('finished');
      })
      .subscribe((status, err) => {
        if (err) console.error('[Battle] realtime subscribe error', err);
      });
  }

  function startTimeout() {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setPhase('timeout'), 60000);
  }

  // ── 방 생성 공통 함수 ─────────────────────────────────────
  async function createRoom(me) {
    const code = generateCode();
    const poke = DB[Math.floor(Math.random() * DB.length)];
    const { error: e } = await bc.from('battle_rooms').insert({
      id: code,
      answer_id: String(poke.id),
      status: 'waiting',
      p1_uid: me.uid,
      p1_anon: me.anon,
      p1_nick: me.nick,
    });
    if (e) {
      console.error('[Battle] createRoom error', e);
      throw new Error(e.message || e.code || JSON.stringify(e));
    }
    return { code, poke };
  }

  // ── 친구 방 만들기 ────────────────────────────────────────
  async function createFriendRoom() {
    setError('');
    const me = getIdentity(user);
    let result;
    try { result = await createRoom(me); }
    catch (err) { setError(`방 생성 실패: ${err.message}`); return; }
    setRoomCode(result.code);
    setMySlot('p1');
    setAnswer(result.poke);
    setPhase('waiting');
    subscribeRoom(result.code);
    startTimeout();
  }

  // ── 코드로 방 참가 ────────────────────────────────────────
  async function joinFriendRoom(code) {
    setError('');
    const upper = (code || '').toUpperCase().trim();
    if (upper.length !== 6) { setError('코드는 6자리예요.'); return; }

    // 방 조회 (status 무관하게 조회해서 더 나은 에러 메시지 제공)
    const { data, error: e } = await bc
      .from('battle_rooms')
      .select('*')
      .eq('id', upper);

    if (e) { console.error('[Battle] joinFriendRoom select error', e); setError('서버 오류가 발생했어요.'); return; }
    if (!data || data.length === 0) { setError('방을 찾을 수 없어요. 코드를 확인해주세요.'); return; }

    const roomData = data[0];
    if (roomData.status !== 'waiting') {
      setError(roomData.status === 'playing' ? '이미 시작된 방이에요.' : '종료된 방이에요.');
      return;
    }

    const me = getIdentity(user);
    // 본인 방 참가 방지 (uid 기준, anon은 테스트를 위해 허용)
    if (me.uid && roomData.p1_uid === me.uid) {
      setError('내가 만든 방에는 입장할 수 없어요.'); return;
    }

    const { error: e2 } = await bc.from('battle_rooms').update({
      p2_uid: me.uid,
      p2_anon: me.anon,
      p2_nick: me.nick,
      status: 'playing',
    }).eq('id', upper).eq('status', 'waiting');

    if (e2) { console.error('[Battle] joinFriendRoom update error', e2); setError('입장에 실패했어요.'); return; }

    const poke = DB.find(p => String(p.id) === String(roomData.answer_id));
    setRoomCode(upper);
    setMySlot('p2');
    setAnswer(poke);
    setRoom({ ...roomData, p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, status: 'playing' });
    setPhase('playing');
    subscribeRoom(upper);
  }

  // ── 랜덤 대전 ─────────────────────────────────────────────
  async function findRandom() {
    setError('');
    setPhase('searching');
    const me = getIdentity(user);

    const { data } = await bc
      .from('battle_rooms')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(10);

    const available = (data || []).filter(r =>
      (!me.uid || r.p1_uid !== me.uid) &&
      (!me.anon || r.p1_anon !== me.anon)
    );

    if (available.length > 0) {
      const target = available[0];
      const { error: e } = await bc.from('battle_rooms').update({
        p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, status: 'playing',
      }).eq('id', target.id).eq('status', 'waiting');

      if (!e) {
        const poke = DB.find(p => String(p.id) === String(target.answer_id));
        setRoomCode(target.id);
        setMySlot('p2');
        setAnswer(poke);
        setRoom({ ...target, p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, status: 'playing' });
        setPhase('playing');
        subscribeRoom(target.id);
        return;
      }
    }

    // 빈 방 없음 → 새로 만들고 대기
    let result;
    try { result = await createRoom(me); }
    catch (err) { setPhase('select'); setError(`방 생성 실패: ${err.message}`); return; }
    setRoomCode(result.code);
    setMySlot('p1');
    setAnswer(result.poke);
    setPhase('waiting');
    subscribeRoom(result.code);
    startTimeout();
  }

  // ── 추측 제출 ─────────────────────────────────────────────
  const submitGuess = useCallback(async (pokemonId) => {
    if (gameOver || !answer) return;
    const g = DB.find(x => String(x.id) === String(pokemonId));
    if (!g || guesses.find(x => x.id === g.id)) return;

    const next = [...guesses, g];
    setGuesses(next);
    const isOk = String(g.id) === String(answer.id);
    const col = mySlot === 'p1'
      ? { p1_tries: next.length, p1_solved: isOk }
      : { p2_tries: next.length, p2_solved: isOk };

    if (isOk) {
      setGameOver(true);
      const { error: e } = await bc.from('battle_rooms')
        .update({ ...col, status: 'finished', winner: mySlot })
        .eq('id', roomCode);
      if (e) console.error('[Battle] finish update error', e);
    } else {
      await bc.from('battle_rooms').update(col).eq('id', roomCode);
    }
  }, [gameOver, answer, guesses, mySlot, roomCode]);

  // ── 리셋 ──────────────────────────────────────────────────
  function reset() {
    if (channelRef.current) bc.removeChannel(channelRef.current);
    clearTimeout(timeoutRef.current);
    channelRef.current = null;
    setPhase('select'); setRoomCode(''); setRoom(null); setMySlot(null);
    setAnswer(null); setGuesses([]); setGameOver(false); setError('');
  }

  const me = getIdentity(user);
  const opNick  = room ? (mySlot === 'p1' ? room.p2_nick  : room.p1_nick)  : null;
  const opTries = room ? (mySlot === 'p1' ? room.p2_tries : room.p1_tries) : null;
  const opSolved = room ? (mySlot === 'p1' ? room.p2_solved : room.p1_solved) : false;

  return {
    phase, roomCode, room, mySlot, answer, guesses, gameOver, error,
    myNick: me.nick, opNick, opTries, opSolved,
    iWon: room?.winner === mySlot, winner: room?.winner,
    createFriendRoom, joinFriendRoom, findRandom, submitGuess, reset,
  };
}
