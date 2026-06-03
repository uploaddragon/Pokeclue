import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import DB from '../data/pokemon.js';
import { supabase as bc } from '../lib/supabase.js';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getIdentity(user) {
  if (user) return {
    uid: user.id, anon: null,
    nick: user.user_metadata?.pokeclue_nickname || user.user_metadata?.full_name || user.email?.split('@')[0] || '트레이너',
  };
  try {
    const s = JSON.parse(localStorage.getItem('pokeclue_anon') || 'null');
    if (s?.id) return { uid: null, anon: s.id, nick: s.nickname || '트레이너' };
  } catch {}
  return { uid: null, anon: null, nick: '트레이너' };
}

export function useBattle(user) {
  const [phase, setPhase] = useState('select'); // select|waiting|searching|playing|finished|timeout
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState(null);
  const [mySlot, setMySlot] = useState(null); // 'p1'|'p2'
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState('');
  const channelRef = useRef(null);
  const timeoutRef = useRef(null);
  const pollRef = useRef(null);
  const phaseRef = useRef('select');
  const mySlotRef = useRef(null);
  const roomCodeRef = useRef('');

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { mySlotRef.current = mySlot; }, [mySlot]);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  useEffect(() => () => {
    if (channelRef.current) bc.removeChannel(channelRef.current);
    clearTimeout(timeoutRef.current);
    clearInterval(pollRef.current);
  }, []);

  // Realtime 폴백: waiting/searching 상태에서 1초마다 DB 직접 확인
  useEffect(() => {
    clearInterval(pollRef.current);
    if ((phase !== 'waiting' && phase !== 'searching') || !roomCode) return;

    pollRef.current = setInterval(async () => {
      const { data, error: pe } = await bc.from('battle_rooms').select('*').eq('id', roomCode).single();
      if (pe) { console.error('[Battle] poll error', pe); return; }
      if (!data) return;
      if (data.status === 'playing') {
        clearInterval(pollRef.current);
        clearTimeout(timeoutRef.current);
        const poke = DB.find(p => String(p.id) === String(data.answer_id));
        if (poke) setAnswer(poke);
        setRoom(data);
        setPhase('playing');
      }
    }, 1000);

    return () => clearInterval(pollRef.current);
  }, [phase, roomCode]);

  function subscribeRoom(code, slot) {
    if (channelRef.current) bc.removeChannel(channelRef.current);
    const opSlot = slot === 'p1' ? 'p2' : 'p1';

    channelRef.current = bc
      .channel(`battle-${code}`)
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (phaseRef.current !== 'playing') return;
        const opLeft = leftPresences.some(p => p.slot === opSlot);
        if (!opLeft) return;
        const code_ = roomCodeRef.current;
        const mySlot_ = mySlotRef.current;
        if (!code_ || !mySlot_) return;
        bc.from('battle_rooms')
          .update({ status: 'finished', winner: mySlot_ })
          .eq('id', code_)
          .eq('status', 'playing')
          .then(({ error: e }) => { if (e) console.error('[Battle] disconnect win error', e); });
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'battle_rooms', filter: `id=eq.${code}`,
      }, ({ new: r }) => {
        setRoom(r);
        if (r.status === 'playing' && phaseRef.current !== 'playing') {
          clearTimeout(timeoutRef.current);
          const poke = DB.find(p => String(p.id) === String(r.answer_id));
          if (poke) setAnswer(poke);
          setPhase('playing');
        }
        if (r.status === 'finished' && phaseRef.current !== 'rematch_wait') setPhase('finished');
      })
      .subscribe(async (st, err) => {
        if (err) console.error('[Battle] realtime error', err);
        if (st === 'SUBSCRIBED') {
          await channelRef.current.track({ slot });
        }
      });
  }

  function startTimeout() {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setPhase('timeout'), 60000);
  }

  async function createRoom(me) {
    const code = generateCode();
    const poke = DB[Math.floor(Math.random() * DB.length)];
    const { error: e } = await bc.from('battle_rooms').insert({
      id: code, answer_id: String(poke.id), status: 'waiting',
      current_turn: 'p1', shared_guesses: [],
      p1_uid: me.uid, p1_anon: me.anon, p1_nick: me.nick,
    });
    if (e) throw new Error(e.message || e.code || JSON.stringify(e));
    return { code, poke };
  }

  async function createFriendRoom() {
    setError('');
    const me = getIdentity(user);
    try {
      const result = await createRoom(me);
      setRoomCode(result.code); setMySlot('p1'); setAnswer(result.poke);
      setPhase('waiting'); subscribeRoom(result.code, 'p1'); startTimeout();
    } catch (err) { setError(`방 생성 실패: ${err.message}`); }
  }

  async function joinFriendRoom(code) {
    setError('');
    const upper = (code || '').toUpperCase().trim();
    if (upper.length !== 6) { setError('코드는 6자리예요.'); return; }
    const me = getIdentity(user);

    const { data, error: e } = await bc.from('battle_rooms').select('*').eq('id', upper);
    if (e) { setError('서버 오류가 발생했어요.'); return; }
    if (!data?.length) { setError('방을 찾을 수 없어요.'); return; }

    const r = data[0];
    if (r.status !== 'waiting') { setError(r.status === 'playing' ? '이미 시작된 방이에요.' : '종료된 방이에요.'); return; }
    if (me.uid && r.p1_uid === me.uid) { setError('내가 만든 방에는 입장할 수 없어요.'); return; }

    const { error: e2 } = await bc.from('battle_rooms').update({
      p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, status: 'playing',
    }).eq('id', upper).eq('status', 'waiting');
    if (e2) { setError('입장에 실패했어요.'); return; }

    const poke = DB.find(p => String(p.id) === String(r.answer_id));
    const joined = { ...r, p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, status: 'playing' };
    setRoomCode(upper); setMySlot('p2'); setAnswer(poke); setRoom(joined);
    setPhase('playing'); subscribeRoom(upper, 'p2');
  }

  async function findRandom() {
    setError(''); setPhase('searching');
    const me = getIdentity(user);

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data } = await bc.from('battle_rooms').select('*').eq('status', 'waiting')
        .order('created_at', { ascending: true }).limit(10);
      const available = (data || []).filter(r =>
        (!me.uid || r.p1_uid !== me.uid) && (!me.anon || r.p1_anon !== me.anon)
      );

      if (available.length === 0) break;

      const target = available[0];
      const { data: updated, error: e } = await bc.from('battle_rooms').update({
        p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, status: 'playing',
      }).eq('id', target.id).eq('status', 'waiting').select();

      if (!e && updated?.length > 0) {
        const actual = updated[0];
        const poke = DB.find(p => String(p.id) === String(actual.answer_id));
        setRoomCode(actual.id); setMySlot('p2'); setAnswer(poke); setRoom(actual);
        setPhase('playing'); subscribeRoom(actual.id, 'p2'); return;
      }
    }

    try {
      const result = await createRoom(me);
      setRoomCode(result.code); setMySlot('p1'); setAnswer(result.poke);
      setPhase('waiting'); subscribeRoom(result.code, 'p1'); startTimeout();
    } catch (err) { setPhase('select'); setError(`방 생성 실패: ${err.message}`); }
  }

  // 추측 제출 — 스킵 카운트 초기화 포함
  const submitGuess = useCallback(async (pokemonId) => {
    if (!answer || !roomCode) return;
    const currentGuesses = room?.shared_guesses || [];
    if (currentGuesses.includes(String(pokemonId))) return;

    const g = DB.find(x => String(x.id) === String(pokemonId));
    if (!g) return;

    const newGuesses = [...currentGuesses, String(pokemonId)];
    const isOk = String(g.id) === String(answer.id);
    const nextTurn = mySlot === 'p1' ? 'p2' : 'p1';
    const myTriesKey = mySlot === 'p1' ? 'p1_tries' : 'p2_tries';
    const mySolvedKey = mySlot === 'p1' ? 'p1_solved' : 'p2_solved';
    const mySkipsKey = mySlot === 'p1' ? 'p1_skips' : 'p2_skips';

    const update = {
      shared_guesses: newGuesses,
      current_turn: nextTurn,
      [myTriesKey]: (room?.[myTriesKey] || 0) + 1,
      [mySkipsKey]: 0, // 추측 시 스킵 카운트 초기화
    };

    if (isOk) {
      const { error: e } = await bc.from('battle_rooms').update({
        ...update, [mySolvedKey]: true, status: 'finished', winner: mySlot,
      }).eq('id', roomCode);
      if (e) console.error('[Battle] submitGuess error', e);
    } else {
      const { error: e } = await bc.from('battle_rooms').update(update).eq('id', roomCode);
      if (e) console.error('[Battle] submitGuess error', e);
    }
  }, [answer, roomCode, room, mySlot]);

  // 턴 넘기기 (타이머 만료) — 3번 연속 스킵 시 패배
  const skipTurn = useCallback(async () => {
    if (!roomCode) return;
    const mySkipsKey = mySlot === 'p1' ? 'p1_skips' : 'p2_skips';
    const opSlot = mySlot === 'p1' ? 'p2' : 'p1';
    const nextTurn = opSlot;
    const newSkips = (room?.[mySkipsKey] || 0) + 1;

    if (newSkips >= 3) {
      // 3번 연속 무응답 → 패배
      await bc.from('battle_rooms').update({
        current_turn: nextTurn,
        [mySkipsKey]: newSkips,
        status: 'finished',
        winner: opSlot,
      }).eq('id', roomCode);
    } else {
      await bc.from('battle_rooms').update({
        current_turn: nextTurn,
        [mySkipsKey]: newSkips,
      }).eq('id', roomCode);
    }
  }, [roomCode, mySlot, room]);

  // 리매치 요청
  const requestRematch = useCallback(async () => {
    if (!roomCode || !mySlot) return;
    const myKey = mySlot === 'p1' ? 'p1_rematch' : 'p2_rematch';

    await bc.from('battle_rooms').update({ [myKey]: true }).eq('id', roomCode);
    setPhase('rematch_wait');

    const { data } = await bc.from('battle_rooms')
      .select('p1_rematch, p2_rematch, round')
      .eq('id', roomCode)
      .single();

    if (data?.p1_rematch && data?.p2_rematch) {
      const nextRound = (data.round || 1) + 1;
      const firstTurn = nextRound % 2 === 0 ? 'p2' : 'p1';
      const newPoke = DB[Math.floor(Math.random() * DB.length)];
      await bc.from('battle_rooms').update({
        answer_id: String(newPoke.id),
        status: 'playing', current_turn: firstTurn, shared_guesses: [],
        p1_tries: 0, p1_solved: false, p2_tries: 0, p2_solved: false,
        p1_skips: 0, p2_skips: 0,
        winner: null, p1_rematch: false, p2_rematch: false, round: nextRound,
      }).eq('id', roomCode).eq('p1_rematch', true).eq('p2_rematch', true);
    }
  }, [roomCode, mySlot]);

  // 항복 — 상대방 승리로 처리
  const giveUp = useCallback(async () => {
    if (!roomCode) return;
    const opSlot = mySlot === 'p1' ? 'p2' : 'p1';
    const { error: e } = await bc.from('battle_rooms').update({
      status: 'finished',
      winner: opSlot,
    }).eq('id', roomCode);
    if (e) console.error('[Battle] giveUp error', e);
  }, [roomCode, mySlot]);

  function reset() {
    if (channelRef.current) bc.removeChannel(channelRef.current);
    clearTimeout(timeoutRef.current);
    channelRef.current = null;
    setPhase('select'); setRoomCode(''); setRoom(null); setMySlot(null);
    setAnswer(null); setError('');
  }

  const me = getIdentity(user);
  const currentTurn = room?.current_turn || 'p1';
  const isMyTurn = phase === 'playing' && currentTurn === mySlot;
  const mySkipsKey = mySlot === 'p1' ? 'p1_skips' : 'p2_skips';
  const mySkips = room?.[mySkipsKey] || 0;
  const sharedGuesses = useMemo(() =>
    (room?.shared_guesses || []).map(id => DB.find(p => String(p.id) === String(id))).filter(Boolean),
    [room?.shared_guesses]
  );
  const opNick  = room ? (mySlot === 'p1' ? room.p2_nick  : room.p1_nick)  : null;
  const opTries = room ? (mySlot === 'p1' ? room.p2_tries : room.p1_tries) : 0;
  const iWon = room?.winner === mySlot;

  return {
    phase, roomCode, room, mySlot, answer, error,
    myNick: me.nick, opNick, opTries, iWon, winner: room?.winner,
    isMyTurn, currentTurn, mySkips, sharedGuesses,
    createFriendRoom, joinFriendRoom, findRandom, submitGuess, skipTurn, giveUp, requestRematch, reset,
  };
}
