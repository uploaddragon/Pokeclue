import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import DB from '../data/pokemon.js';
import { createClient } from '@supabase/supabase-js';

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
  const slotRef = useRef(null); // realtime 콜백에서 mySlot 참조용

  useEffect(() => () => {
    if (channelRef.current) bc.removeChannel(channelRef.current);
    clearTimeout(timeoutRef.current);
  }, []);

  function subscribeRoom(code, slotRef) {
    if (channelRef.current) bc.removeChannel(channelRef.current);
    channelRef.current = bc
      .channel(`battle-${code}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'battle_rooms', filter: `id=eq.${code}`,
      }, ({ new: r }) => {
        setRoom(r);
        if (r.status === 'playing') {
          clearTimeout(timeoutRef.current);
          const poke = DB.find(p => String(p.id) === String(r.answer_id));
          if (poke) setAnswer(poke);
          setPhase('playing');
        }
        if (r.status === 'finished') setPhase('finished');

        // 양측 모두 리매치 준비됨 → p1이 새 게임 시작 (race condition 방지)
        if (r.p1_rematch && r.p2_rematch && r.status === 'finished') {
          if (slotRef.current === 'p1') {
            const nextRound = (r.round || 1) + 1;
            const firstTurn = nextRound % 2 === 0 ? 'p2' : 'p1';
            const newPoke = DB[Math.floor(Math.random() * DB.length)];
            bc.from('battle_rooms').update({
              answer_id: String(newPoke.id),
              status: 'playing',
              current_turn: firstTurn,
              shared_guesses: [],
              p1_tries: 0, p1_solved: false,
              p2_tries: 0, p2_solved: false,
              winner: null,
              p1_rematch: false, p2_rematch: false,
              round: nextRound,
            }).eq('id', r.id).eq('p1_rematch', true).eq('p2_rematch', true);
            // answer는 realtime의 status='playing' 이벤트에서 갱신됨
          }
        }
      })
      .subscribe((st, err) => { if (err) console.error('[Battle] realtime error', err); });
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
      slotRef.current = 'p1';
      setRoomCode(result.code); setMySlot('p1'); setAnswer(result.poke);
      setPhase('waiting'); subscribeRoom(result.code, slotRef); startTimeout();
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
    slotRef.current = 'p2';
    setRoomCode(upper); setMySlot('p2'); setAnswer(poke); setRoom(joined);
    setPhase('playing'); subscribeRoom(upper, slotRef);
  }

  async function findRandom() {
    setError(''); setPhase('searching');
    const me = getIdentity(user);

    const { data } = await bc.from('battle_rooms').select('*').eq('status', 'waiting')
      .order('created_at', { ascending: true }).limit(10);
    const available = (data || []).filter(r =>
      (!me.uid || r.p1_uid !== me.uid) && (!me.anon || r.p1_anon !== me.anon)
    );

    if (available.length > 0) {
      const target = available[0];
      const { error: e } = await bc.from('battle_rooms').update({
        p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, status: 'playing',
      }).eq('id', target.id).eq('status', 'waiting');
      if (!e) {
        const poke = DB.find(p => String(p.id) === String(target.answer_id));
        const joined = { ...target, p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, status: 'playing' };
        slotRef.current = 'p2';
        setRoomCode(target.id); setMySlot('p2'); setAnswer(poke); setRoom(joined);
        setPhase('playing'); subscribeRoom(target.id, slotRef); return;
      }
    }

    try {
      const result = await createRoom(me);
      slotRef.current = 'p1';
      setRoomCode(result.code); setMySlot('p1'); setAnswer(result.poke);
      setPhase('waiting'); subscribeRoom(result.code, slotRef); startTimeout();
    } catch (err) { setPhase('select'); setError(`방 생성 실패: ${err.message}`); }
  }

  // 추측 제출 — 내 턴일 때만
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

    const update = {
      shared_guesses: newGuesses,
      current_turn: nextTurn,
      [myTriesKey]: (room?.[myTriesKey] || 0) + 1,
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

  // 턴 넘기기 (타이머 만료)
  const skipTurn = useCallback(async () => {
    if (!roomCode) return;
    const nextTurn = mySlot === 'p1' ? 'p2' : 'p1';
    await bc.from('battle_rooms').update({ current_turn: nextTurn }).eq('id', roomCode);
  }, [roomCode, mySlot]);

  // 리매치 요청 — 항상 대기 화면 표시, 양측 모두 누르면 realtime이 새 게임 시작
  const requestRematch = useCallback(async () => {
    if (!roomCode || !mySlot) return;
    const myKey = mySlot === 'p1' ? 'p1_rematch' : 'p2_rematch';
    await bc.from('battle_rooms').update({ [myKey]: true }).eq('id', roomCode);
    setPhase('rematch_wait');
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
    isMyTurn, currentTurn, sharedGuesses,
    createFriendRoom, joinFriendRoom, findRandom, submitGuess, skipTurn, giveUp, requestRematch, reset,
  };
}
