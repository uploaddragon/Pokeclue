import { useState, useEffect, useCallback, useRef } from 'react';
import DB from '../data/pokemon.js';
import { supabasePublic } from '../lib/supabase.js';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getIdentity(user) {
  if (user) return {
    uid: user.id,
    anon: null,
    nick: user.user_metadata?.pokeclue_nickname || user.user_metadata?.full_name || user.email?.split('@')[0] || '트레이너',
  };
  try {
    const s = JSON.parse(localStorage.getItem('pokeclue_anon') || 'null');
    if (s?.id) return { uid: null, anon: s.id, nick: s.nickname || '트레이너' };
  } catch {}
  return { uid: null, anon: crypto.randomUUID(), nick: '트레이너' };
}

export function useBattle(user) {
  const [phase, setPhase] = useState('select'); // select | waiting | searching | playing | finished | timeout
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState(null);
  const [mySlot, setMySlot] = useState(null); // 'p1' | 'p2'
  const [answer, setAnswer] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [error, setError] = useState('');
  const channelRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (channelRef.current) supabasePublic.removeChannel(channelRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function subscribeRoom(code) {
    if (channelRef.current) supabasePublic.removeChannel(channelRef.current);
    const ch = supabasePublic
      .channel(`battle-${code}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'battle_rooms', filter: `id=eq.${code}`,
      }, ({ new: r }) => {
        setRoom(r);
        if (r.status === 'playing') {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setPhase('playing');
        }
        if (r.status === 'finished') setPhase('finished');
      })
      .subscribe();
    channelRef.current = ch;
  }

  function startWaitingTimeout() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setPhase('timeout'), 60000);
  }

  async function createFriendRoom() {
    setError('');
    const code = generateCode();
    const me = getIdentity(user);
    const randomPoke = DB[Math.floor(Math.random() * DB.length)];
    const { error: e } = await supabasePublic.from('battle_rooms').insert({
      id: code, answer_id: String(randomPoke.id), status: 'waiting',
      p1_uid: me.uid, p1_anon: me.anon, p1_nick: me.nick,
    });
    if (e) { setError('방 생성에 실패했어요. 다시 시도해주세요.'); return; }
    setRoomCode(code);
    setMySlot('p1');
    setAnswer(randomPoke);
    setPhase('waiting');
    subscribeRoom(code);
    startWaitingTimeout();
  }

  async function joinFriendRoom(code) {
    setError('');
    const upper = code.toUpperCase().trim();
    if (upper.length !== 6) { setError('코드는 6자리예요.'); return; }
    const me = getIdentity(user);

    const { data, error: e } = await supabasePublic
      .from('battle_rooms').select('*').eq('id', upper).eq('status', 'waiting').single();
    if (e || !data) { setError('방을 찾을 수 없어요. 코드를 확인해주세요.'); return; }
    if ((me.uid && data.p1_uid === me.uid) || (me.anon && data.p1_anon === me.anon)) {
      setError('내가 만든 방에는 입장할 수 없어요.'); return;
    }

    const { error: e2 } = await supabasePublic.from('battle_rooms').update({
      p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, status: 'playing',
    }).eq('id', upper);
    if (e2) { setError('입장에 실패했어요. 다시 시도해주세요.'); return; }

    const poke = DB.find(p => String(p.id) === String(data.answer_id));
    setRoomCode(upper);
    setMySlot('p2');
    setAnswer(poke);
    setRoom({ ...data, p2_uid: me.uid, p2_anon: me.anon, p2_nick: me.nick, status: 'playing' });
    setPhase('playing');
    subscribeRoom(upper);
  }

  async function findRandom() {
    setError('');
    setPhase('searching');
    const me = getIdentity(user);

    const { data } = await supabasePublic
      .from('battle_rooms').select('*').eq('status', 'waiting')
      .order('created_at', { ascending: true }).limit(10);

    const available = (data || []).filter(r =>
      (!me.uid || r.p1_uid !== me.uid) && (!me.anon || r.p1_anon !== me.anon)
    );

    if (available.length > 0) {
      const target = available[0];
      const { error: e } = await supabasePublic.from('battle_rooms').update({
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

    // 방이 없으면 새로 생성 후 대기
    const code = generateCode();
    const randomPoke = DB[Math.floor(Math.random() * DB.length)];
    await supabasePublic.from('battle_rooms').insert({
      id: code, answer_id: String(randomPoke.id), status: 'waiting',
      p1_uid: me.uid, p1_anon: me.anon, p1_nick: me.nick,
    });
    setRoomCode(code);
    setMySlot('p1');
    setAnswer(randomPoke);
    setPhase('waiting');
    subscribeRoom(code);
    startWaitingTimeout();
  }

  const submitGuess = useCallback(async (pokemonId) => {
    if (gameOver || !answer) return;
    const g = DB.find(x => String(x.id) === String(pokemonId));
    if (!g || guesses.find(x => x.id === g.id)) return;

    const next = [...guesses, g];
    setGuesses(next);
    const isOk = String(g.id) === String(answer.id);

    const myUpdate = mySlot === 'p1'
      ? { p1_tries: next.length, p1_solved: isOk }
      : { p2_tries: next.length, p2_solved: isOk };

    if (isOk) {
      setGameOver(true);
      await supabasePublic.from('battle_rooms').update({
        ...myUpdate, status: 'finished', winner: mySlot,
      }).eq('id', roomCode);
    } else {
      await supabasePublic.from('battle_rooms').update(myUpdate).eq('id', roomCode);
    }
  }, [gameOver, answer, guesses, mySlot, roomCode]);

  function reset() {
    if (channelRef.current) supabasePublic.removeChannel(channelRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    channelRef.current = null;
    setPhase('select');
    setRoomCode(''); setRoom(null); setMySlot(null);
    setAnswer(null); setGuesses([]); setGameOver(false); setError('');
  }

  const me = getIdentity(user);
  const opNick = room ? (mySlot === 'p1' ? room.p2_nick : room.p1_nick) : null;
  const opTries = room ? (mySlot === 'p1' ? room.p2_tries : room.p1_tries) : null;
  const opSolved = room ? (mySlot === 'p1' ? room.p2_solved : room.p1_solved) : false;
  const iWon = room?.winner === mySlot;

  return {
    phase, roomCode, room, mySlot, answer, guesses, gameOver, error,
    myNick: me.nick, opNick, opTries, opSolved, iWon, winner: room?.winner,
    createFriendRoom, joinFriendRoom, findRandom, submitGuess, reset,
  };
}
