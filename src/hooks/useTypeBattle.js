import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import DB from '../data/pokemon.js';
import { supabase as bc } from '../lib/supabase.js';

const SELECT_SEC = 10;
const REVEAL_SEC = 3;
const RESULT_SEC = 3;
const WIN_SCORE = 5;
const ALL_TYPES = ['노말','불꽃','물','전기','풀','얼음','격투','독','땅','비행','에스퍼','벌레','바위','고스트','드래곤','악','강철','페어리'];

async function recordBattleResult(userId, won) {
  if (!userId) return;
  const { data } = await bc.from('battle_stats').select('wins, losses').eq('user_id', userId).maybeSingle();
  if (data) {
    await bc.from('battle_stats').update({
      wins: data.wins + (won ? 1 : 0),
      losses: data.losses + (won ? 0 : 1),
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
  } else {
    await bc.from('battle_stats').insert({ user_id: userId, wins: won ? 1 : 0, losses: won ? 0 : 1 });
  }
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getIdentity(user) {
  if (user) return {
    uid: user.id, anon: null,
    nick: user.user_metadata?.pokeclue_nickname || user.user_metadata?.full_name || user.email?.split('@')[0] || '트레이너',
    title: user.user_metadata?.equipped_title ?? null,
    profilePokemon: user.user_metadata?.profile_pokemon ?? null,
  };
  try {
    const s = JSON.parse(localStorage.getItem('pokeclue_anon') || 'null');
    if (s?.id) return { uid: null, anon: s.id, nick: s.nickname || '트레이너', title: null, profilePokemon: null };
  } catch {}
  return { uid: null, anon: null, nick: '트레이너', title: null, profilePokemon: null };
}

// 라운드 타입 조합(순서 무관, 동일 타입 2회 선택 시 단일 타입) 판정
function roundTypeKey(t1, t2) {
  return t1 === t2 ? t1 : [t1, t2].sort().join('/');
}
function pokeTypeKey(p) {
  if (p.t2 && p.t2 !== '없음') return [p.t1, p.t2].sort().join('/');
  return p.t1;
}
function findValidPokemon(t1, t2) {
  if (!t1 || !t2) return [];
  const key = roundTypeKey(t1, t2);
  return DB.filter(p => pokeTypeKey(p) === key);
}

export function useTypeBattle(user) {
  const [phase, setPhase] = useState('select'); // select|waiting|searching|playing|timeout|rematch_wait
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState(null);
  const [mySlot, setMySlot] = useState(null);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(false); // 로컬 3초 공개 연출 완료 여부
  const battleRecordedRef = useRef(false);

  // 오답 제출 시 잠깐 보여주는 흔들림 말풍선 { poke, key }
  const [myWrongFlash, setMyWrongFlash] = useState(null);
  const [opWrongFlash, setOpWrongFlash] = useState(null);
  const myWrongTimer = useRef(null);
  const opWrongTimer = useRef(null);
  const wrongFlashKeyRef = useRef(0);

  const channelRef = useRef(null);
  const timeoutRef = useRef(null);
  const pollRef = useRef(null);
  const revealTimerRef = useRef(null);
  const resolveDrawRef = useRef(null); // 중복 draw 처리 방지 (round 번호)
  const advanceRef = useRef(null);     // 중복 라운드 진행 방지 (round 번호)
  const phaseRef = useRef('select');
  const mySlotRef = useRef(null);
  const roomCodeRef = useRef('');

  const [myBubble, setMyBubble] = useState(null);
  const [opBubble, setOpBubble] = useState(null);
  const myBubbleTimer = useRef(null);
  const opBubbleTimer = useRef(null);
  const bubbleKeyRef = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { mySlotRef.current = mySlot; }, [mySlot]);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  useEffect(() => () => {
    const code = roomCodeRef.current;
    if (code) bc.from('type_battle_rooms').delete().eq('id', code).eq('status', 'waiting');
    if (channelRef.current) bc.removeChannel(channelRef.current);
    clearTimeout(timeoutRef.current);
    clearInterval(pollRef.current);
    clearTimeout(revealTimerRef.current);
  }, []);

  // 매치 종료 시 전적 기록 (친구 도주 등으로 0라운드에 끝난 경우 제외)
  useEffect(() => {
    if (phase !== 'finished' || !user?.id || !room?.winner || battleRecordedRef.current) return;
    if ((room.round || 1) <= 1 && !room.p1_score && !room.p2_score) return;
    battleRecordedRef.current = true;
    recordBattleResult(user.id, room.winner === mySlot);
  }, [phase, room?.winner]); // eslint-disable-line react-hooks/exhaustive-deps

  // 대기/검색 상태 폴백 폴링
  useEffect(() => {
    clearInterval(pollRef.current);
    if ((phase !== 'waiting' && phase !== 'searching') || !roomCode) return;
    pollRef.current = setInterval(async () => {
      const { data, error: pe } = await bc.from('type_battle_rooms').select('*').eq('id', roomCode).single();
      if (pe || !data) return;
      if (data.status === 'playing') {
        clearInterval(pollRef.current);
        clearTimeout(timeoutRef.current);
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
      .channel(`type-battle-${code}`)
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        if (payload.slot === slot) return;
        const k = ++bubbleKeyRef.current;
        setOpBubble({ text: payload.text, key: k });
        clearTimeout(opBubbleTimer.current);
        opBubbleTimer.current = setTimeout(() => setOpBubble(null), 3500);
      })
      .on('broadcast', { event: 'wrong_guess' }, ({ payload }) => {
        if (payload.slot === slot) return; // 내 에코 무시
        const poke = DB.find(p => String(p.id) === String(payload.id));
        if (!poke) return;
        const k = ++wrongFlashKeyRef.current;
        setOpWrongFlash({ poke, key: k });
        clearTimeout(opWrongTimer.current);
        opWrongTimer.current = setTimeout(() => setOpWrongFlash(null), 2200);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (phaseRef.current !== 'playing') return;
        const opLeft = leftPresences.some(p => p.slot === opSlot);
        if (!opLeft) return;
        const code_ = roomCodeRef.current;
        const mySlot_ = mySlotRef.current;
        if (!code_ || !mySlot_) return;
        bc.from('type_battle_rooms')
          .update({ status: 'finished', winner: mySlot_ })
          .eq('id', code_)
          .in('status', ['waiting', 'playing'])
          .then(({ error: e }) => { if (e) console.error('[TypeBattle] disconnect win error', e); });
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'type_battle_rooms', filter: `id=eq.${code}`,
      }, ({ new: r }) => {
        setRoom(r);
        if (r.status === 'playing' && phaseRef.current !== 'playing') {
          clearTimeout(timeoutRef.current);
          setPhase('playing');
        }
        if (r.status === 'finished' && phaseRef.current !== 'rematch_wait') setPhase('finished');
      })
      .subscribe(async (st, err) => {
        if (err) console.error('[TypeBattle] realtime error', err);
        if (st === 'SUBSCRIBED') await channelRef.current.track({ slot });
      });
  }

  function startTimeout() {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const code = roomCodeRef.current;
      if (code) await bc.from('type_battle_rooms').delete().eq('id', code).eq('status', 'waiting');
      setPhase('timeout');
    }, 60000);
  }

  async function createRoom(me) {
    const code = generateCode();
    const { error: e } = await bc.from('type_battle_rooms').insert({
      id: code, status: 'waiting', round: 1, round_started_at: new Date().toISOString(),
      p1_uid: me.uid, p1_anon: me.anon, p1_nick: me.nick, p1_title: me.title,
      p1_profile_pokemon: me.profilePokemon,
    });
    if (e) throw new Error(e.message || e.code || JSON.stringify(e));
    return code;
  }

  async function createFriendRoom() {
    setError('');
    const me = getIdentity(user);
    try {
      const code = await createRoom(me);
      setRoomCode(code); setMySlot('p1');
      setPhase('waiting'); subscribeRoom(code, 'p1'); startTimeout();
    } catch (err) { setError(`방 생성 실패: ${err.message}`); }
  }

  async function joinFriendRoom(code) {
    setError('');
    const upper = (code || '').toUpperCase().trim();
    if (upper.length !== 6) { setError('코드는 6자리예요.'); return; }
    const me = getIdentity(user);

    const { data, error: e } = await bc.from('type_battle_rooms').select('*').eq('id', upper);
    if (e) { setError('서버 오류가 발생했어요.'); return; }
    if (!data?.length) { setError('방을 찾을 수 없어요.'); return; }

    const r = data[0];
    if (r.status !== 'waiting') { setError(r.status === 'playing' ? '이미 시작된 방이에요.' : '종료된 방이에요.'); return; }
    if (me.uid && r.p1_uid === me.uid) { setError('내가 만든 방에는 입장할 수 없어요.'); return; }

    const { error: e2 } = await bc.from('type_battle_rooms').update({
      p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, p2_title: me.title,
      p2_profile_pokemon: me.profilePokemon, status: 'playing',
      round_started_at: new Date().toISOString(),
    }).eq('id', upper).eq('status', 'waiting');
    if (e2) { setError('입장에 실패했어요.'); return; }

    const joined = { ...r, p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, status: 'playing' };
    setRoomCode(upper); setMySlot('p2'); setRoom(joined);
    setPhase('playing'); subscribeRoom(upper, 'p2');
  }

  async function findRandom() {
    setError(''); setPhase('searching');
    const me = getIdentity(user);

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data } = await bc.from('type_battle_rooms').select('*').eq('status', 'waiting')
        .order('created_at', { ascending: true }).limit(10);
      const available = (data || []).filter(r =>
        (!me.uid || r.p1_uid !== me.uid) && (!me.anon || r.p1_anon !== me.anon)
      );
      if (available.length === 0) break;

      const target = available[0];
      const { data: updated, error: e } = await bc.from('type_battle_rooms').update({
        p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, p2_title: me.title,
        p2_profile_pokemon: me.profilePokemon, status: 'playing',
        round_started_at: new Date().toISOString(),
      }).eq('id', target.id).eq('status', 'waiting').select();

      if (!e && updated?.length > 0) {
        const actual = updated[0];
        setRoomCode(actual.id); setMySlot('p2'); setRoom(actual);
        setPhase('playing'); subscribeRoom(actual.id, 'p2'); return;
      }
    }

    try {
      const code = await createRoom(me);
      setRoomCode(code); setMySlot('p1');
      setPhase('waiting'); subscribeRoom(code, 'p1'); startTimeout();
    } catch (err) { setPhase('select'); setError(`방 생성 실패: ${err.message}`); }
  }

  // 타입 선택
  const pickType = useCallback(async (type) => {
    if (!roomCode || !mySlot || !room) return;
    const myTypeKey = mySlot === 'p1' ? 'p1_type' : 'p2_type';
    if (room[myTypeKey]) return; // 이미 선택함
    await bc.from('type_battle_rooms').update({ [myTypeKey]: type }).eq('id', roomCode).eq('round', room.round);
  }, [roomCode, mySlot, room]);

  // 양쪽 타입이 다 정해지면 로컬 3초 공개 연출 후 revealed=true
  useEffect(() => {
    setRevealed(false);
    clearTimeout(revealTimerRef.current);
    if (!room || !room.p1_type || !room.p2_type) return;
    revealTimerRef.current = setTimeout(() => setRevealed(true), REVEAL_SEC * 1000);
    return () => clearTimeout(revealTimerRef.current);
  }, [room?.round, room?.p1_type, room?.p2_type]);

  // 무승부(해당 포켓몬 없음) 자동 판정
  useEffect(() => {
    if (!room || room.status !== 'playing') return;
    if (!room.p1_type || !room.p2_type) return;
    if (room.round_winner) return;
    if (resolveDrawRef.current === room.round) return;
    const valid = findValidPokemon(room.p1_type, room.p2_type);
    if (valid.length > 0) return;
    resolveDrawRef.current = room.round;
    bc.from('type_battle_rooms').update({ round_winner: 'draw' })
      .eq('id', roomCode).eq('round', room.round).is('round_winner', null)
      .then(({ error: e }) => { if (e) console.error('[TypeBattle] draw resolve error', e); });
  }, [room?.round, room?.p1_type, room?.p2_type, room?.round_winner, room?.status, roomCode]);

  // 라운드 결과가 나오면 잠시 후 다음 라운드로 진행 (매치 종료 시엔 진행 안 함)
  useEffect(() => {
    if (!room || room.status !== 'playing' || !room.round_winner) return;
    if (advanceRef.current === room.round) return;
    advanceRef.current = room.round;
    const t = setTimeout(() => {
      bc.from('type_battle_rooms').update({
        round: room.round + 1,
        p1_type: null, p2_type: null,
        p1_guesses: [], p2_guesses: [],
        round_winner: null, round_answer_id: null,
        round_started_at: new Date().toISOString(),
      }).eq('id', roomCode).eq('round', room.round)
        .then(({ error: e }) => { if (e) console.error('[TypeBattle] advance error', e); });
    }, RESULT_SEC * 1000);
    return () => clearTimeout(t);
  }, [room?.round, room?.round_winner, room?.status, roomCode]);

  // 정답 제출
  const submitGuess = useCallback(async (pokemonId) => {
    if (!room || !roomCode || !mySlot) return;
    if (!room.p1_type || !room.p2_type || room.round_winner) return;
    const myGuessesKey = mySlot === 'p1' ? 'p1_guesses' : 'p2_guesses';
    const myGuesses = room[myGuessesKey] || [];
    if (myGuesses.includes(String(pokemonId))) return;

    const g = DB.find(x => String(x.id) === String(pokemonId));
    if (!g) return;

    const isOk = pokeTypeKey(g) === roundTypeKey(room.p1_type, room.p2_type);

    if (isOk) {
      const myScoreKey = mySlot === 'p1' ? 'p1_score' : 'p2_score';
      const newScore = (room[myScoreKey] || 0) + 1;
      const won = newScore >= WIN_SCORE;
      const { error: e } = await bc.from('type_battle_rooms').update({
        round_winner: mySlot, round_answer_id: String(g.id), [myScoreKey]: newScore,
        ...(won ? { status: 'finished', winner: mySlot } : {}),
      }).eq('id', roomCode).eq('round', room.round).is('round_winner', null);
      if (e) console.error('[TypeBattle] submitGuess error', e);
    } else {
      const { error: e } = await bc.from('type_battle_rooms').update({
        [myGuessesKey]: [...myGuesses, String(pokemonId)],
      }).eq('id', roomCode).eq('round', room.round);
      if (e) console.error('[TypeBattle] submitGuess error', e);

      const k = ++wrongFlashKeyRef.current;
      setMyWrongFlash({ poke: g, key: k });
      clearTimeout(myWrongTimer.current);
      myWrongTimer.current = setTimeout(() => setMyWrongFlash(null), 2200);
      channelRef.current?.send({ type: 'broadcast', event: 'wrong_guess', payload: { slot: mySlot, id: String(g.id) } });
    }
  }, [room, roomCode, mySlot]);

  const requestRematch = useCallback(async () => {
    if (!roomCode || !mySlot) return;
    const myKey = mySlot === 'p1' ? 'p1_rematch' : 'p2_rematch';
    await bc.from('type_battle_rooms').update({ [myKey]: true }).eq('id', roomCode);
    battleRecordedRef.current = false;
    setPhase('rematch_wait');

    const { data } = await bc.from('type_battle_rooms')
      .select('p1_rematch, p2_rematch, round').eq('id', roomCode).single();

    if (data?.p1_rematch && data?.p2_rematch) {
      await bc.from('type_battle_rooms').update({
        status: 'playing', round: (data.round || 1) + 1,
        p1_type: null, p2_type: null, p1_guesses: [], p2_guesses: [],
        round_winner: null, round_answer_id: null,
        p1_score: 0, p2_score: 0, winner: null,
        p1_rematch: false, p2_rematch: false,
        round_started_at: new Date().toISOString(),
      }).eq('id', roomCode).eq('p1_rematch', true).eq('p2_rematch', true);
    }
  }, [roomCode, mySlot]);

  const sendChat = useCallback((text) => {
    if (!channelRef.current || !mySlot) return;
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload: { slot: mySlot, text } });
    const k = ++bubbleKeyRef.current;
    setMyBubble({ text, key: k });
    clearTimeout(myBubbleTimer.current);
    myBubbleTimer.current = setTimeout(() => setMyBubble(null), 3500);
  }, [mySlot]);

  const giveUp = useCallback(async () => {
    if (!roomCode || !mySlot) return;
    const opSlot = mySlot === 'p1' ? 'p2' : 'p1';
    await bc.from('type_battle_rooms').update({ status: 'finished', winner: opSlot }).eq('id', roomCode);
  }, [roomCode, mySlot]);

  async function reset() {
    const code = roomCodeRef.current;
    if (code) await bc.from('type_battle_rooms').delete().eq('id', code).eq('status', 'waiting');
    if (channelRef.current) bc.removeChannel(channelRef.current);
    clearTimeout(timeoutRef.current);
    clearInterval(pollRef.current);
    clearTimeout(revealTimerRef.current);
    clearTimeout(myWrongTimer.current);
    clearTimeout(opWrongTimer.current);
    channelRef.current = null;
    resolveDrawRef.current = null;
    advanceRef.current = null;
    battleRecordedRef.current = false;
    setPhase('select'); setRoomCode(''); setRoom(null); setMySlot(null);
    setError(''); setRevealed(false);
    setMyWrongFlash(null); setOpWrongFlash(null);
  }

  const me = getIdentity(user);
  const myTypeKey = mySlot === 'p1' ? 'p1_type' : 'p2_type';
  const opTypeKey = mySlot === 'p1' ? 'p2_type' : 'p1_type';
  const myType = room?.[myTypeKey] ?? null;
  const opTypeChosen = !!room?.[opTypeKey];
  const bothChosen = !!(room?.p1_type && room?.p2_type);
  const myGuessesKey = mySlot === 'p1' ? 'p1_guesses' : 'p2_guesses';
  const myGuesses = useMemo(() =>
    (room?.[myGuessesKey] || []).map(id => DB.find(p => String(p.id) === String(id))).filter(Boolean),
    [room?.[myGuessesKey]] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const myScore = room?.[mySlot === 'p1' ? 'p1_score' : 'p2_score'] || 0;
  const opScore = room?.[mySlot === 'p1' ? 'p2_score' : 'p1_score'] || 0;
  const opNick  = room ? (mySlot === 'p1' ? room.p2_nick  : room.p1_nick)  : null;
  const opTitle = room ? (mySlot === 'p1' ? room.p2_title : room.p1_title) : null;
  const opProfilePokemon = room ? (mySlot === 'p1' ? room.p2_profile_pokemon : room.p1_profile_pokemon) : null;
  const iWon = room?.winner === mySlot;
  const roundAnswer = room?.round_answer_id ? DB.find(p => String(p.id) === String(room.round_answer_id)) : null;
  const validPokemon = room?.p1_type && room?.p2_type ? findValidPokemon(room.p1_type, room.p2_type) : [];
  const validCount = room?.p1_type && room?.p2_type ? validPokemon.length : null;
  // 힌트용 실루엣 — 양쪽 클라이언트가 같은 포켓몬을 보도록 결정론적으로 첫 항목 사용
  const hintPokemon = validPokemon.length > 0 ? validPokemon[0] : null;

  return {
    phase, roomCode, room, mySlot, error,
    myNick: me.nick, myTitle: me.title, myProfilePokemon: me.profilePokemon,
    opNick, opTitle, opProfilePokemon, iWon, winner: room?.winner,
    myType, opTypeChosen, bothChosen, revealed, myGuesses, myScore, opScore,
    roundAnswer, validCount, hintPokemon,
    myWrongFlash, opWrongFlash,
    createFriendRoom, joinFriendRoom, findRandom, pickType, submitGuess, giveUp, requestRematch, reset,
    sendChat, myBubble, opBubble,
    ALL_TYPES,
  };
}
