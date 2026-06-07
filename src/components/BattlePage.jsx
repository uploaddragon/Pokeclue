import { useState, useEffect, useRef } from 'react';
import { useBattle } from '../hooks/useBattle.js';
import { Autocomplete } from './Autocomplete.jsx';
import { GuessTable } from './GuessTable.jsx';
import { displayName } from '../utils/game.js';
import { spr, sprShiny } from '../utils/sprite.js';
import { TITLE_MAP, RARITY } from '../data/titles.js';

function BattleTitleBadge({ titleId }) {
  if (!titleId) return null;
  const t = TITLE_MAP[titleId];
  if (!t) return null;
  const s = RARITY[t.rarity];
  return (
    <span className="battle-title-badge" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
      {t.emoji} {t.ko}
    </span>
  );
}

const TURN_SEC = 30;

const CHOSUNG_LIST = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
// 룸코드를 시드로 count개의 초성을 중복 없이 반환 (양쪽 플레이어 동일)
function getChosungHints(ko, count, seed) {
  const all = [...ko].map(ch => {
    const code = ch.charCodeAt(0) - 0xAC00;
    return (code >= 0 && code <= 11171) ? CHOSUNG_LIST[Math.floor(code / (21 * 28))] : null;
  }).filter(Boolean);
  if (all.length === 0) return [];

  // 시드 기반 셔플
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;

  const pool = [...all];
  const result = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0;
    const idx = Math.abs(h) % pool.length;
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

function seededShiny(roomCode, round) {
  const str = `${roomCode}-${round}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return (Math.abs(h) % 100) === 0; // 1%
}

export function BattlePage({ user, lang, onBattleWin, onGuess }) {
  const isEn = lang === 'en';
  const b = useBattle(user);
  const [joinCode, setJoinCode] = useState('');
  const [friendView, setFriendView] = useState('main');
  const [timer, setTimer] = useState(TURN_SEC);
  const timerRef = useRef(null);

  // 10, 15, 20, 25... 턴마다 초성 1개씩 추가 공개 (룸코드 시드 → 양측 동일, 매 렌더 계산해도 결과 동일)
  const turns = b.sharedGuesses.length;
  const hintCount = turns >= 10 ? Math.floor((turns - 10) / 5) + 1 : 0;
  const chosungHints = (b.answer && hintCount > 0)
    ? getChosungHints(b.answer.ko, hintCount, b.roomCode)
    : [];
  const battleWinFiredRef = useRef(false);
  const prevGuessLenRef = useRef(0);

  // 새 추측마다 near-miss 체크
  useEffect(() => {
    const len = b.sharedGuesses.length;
    if (len > prevGuessLenRef.current && b.answer) {
      const last = b.sharedGuesses[len - 1];
      onGuess?.(last, b.answer);
    }
    prevGuessLenRef.current = len;
  }, [b.sharedGuesses.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // 승리 확정 시 칭호 체크 (라운드당 1회)
  useEffect(() => {
    if (b.phase === 'finished' && b.iWon && !battleWinFiredRef.current) {
      battleWinFiredRef.current = true;
      const myTries = b.sharedGuesses.filter((_, i) =>
        b.mySlot === 'p1' ? i % 2 === 0 : i % 2 === 1
      ).length;
      onBattleWin?.({ totalTurns: b.sharedGuesses.length, myTries, isFirstMover: b.mySlot === 'p1' });
    }
    if (b.phase !== 'finished') {
      battleWinFiredRef.current = false;
    }
  }, [b.phase, b.iWon]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearInterval(timerRef.current);
    if (!b.isMyTurn) { setTimer(TURN_SEC); return; }
    setTimer(TURN_SEC);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); b.skipTurn(); return TURN_SEC; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [b.isMyTurn]);

  function handleSubmit(id) {
    if (!b.isMyTurn) return;
    const alreadyGuessed = (b.room?.shared_guesses || []).includes(String(id));
    if (alreadyGuessed) return;
    clearInterval(timerRef.current);
    setTimer(TURN_SEC);
    b.submitGuess(id);
  }

  // ── SELECT ───────────────────────────────────────────────
  if (b.phase === 'select') {
    return (
      <main>
        <div className="battle-hero">
          <div className="battle-hero-badge">⚔</div>
          <div className="hero-t">{isEn ? 'Battle Mode' : '대전 모드'}</div>
          <div className="hero-s">{isEn ? 'Take turns guessing — first to solve wins!' : '번갈아 추측하며 먼저 맞추는 사람이 승리!'}</div>
        </div>

        {friendView === 'main' && (
          <div className="battle-select">
            <div className="battle-mode-card" onClick={b.findRandom}>
              <div className="battle-mode-icon">🎲</div>
              <div className="battle-mode-title">{isEn ? 'Random Match' : '랜덤 대전'}</div>
              <div className="battle-mode-sub">{isEn ? 'Jump in and play instantly' : '즉시 랜덤 상대와 대결'}</div>
              <ul className="battle-mode-desc">
                <li>{isEn ? 'Matched with a random online player' : '온라인 플레이어와 자동 매칭'}</li>
                <li>{isEn ? '30s turn timer' : '턴당 30초 제한'}</li>
              </ul>
              <div className="battle-mode-cta">{isEn ? 'Find Match ▶' : '매칭 시작 ▶'}</div>
            </div>
            <div className="battle-mode-card friend" onClick={() => setFriendView('friend')}>
              <div className="battle-mode-icon">👥</div>
              <div className="battle-mode-title">{isEn ? 'Friend Battle' : '친구와 대전'}</div>
              <div className="battle-mode-sub">{isEn ? 'Play with someone you know' : '친구와 코드로 대결'}</div>
              <ul className="battle-mode-desc">
                <li>{isEn ? 'Create a room and share the code' : '방을 만들고 코드 공유'}</li>
                <li>{isEn ? 'Or join with a 6-char code' : '또는 6자리 코드로 입장'}</li>
              </ul>
              <div className="battle-mode-cta friend">{isEn ? 'Friend Battle ▶' : '친구 대전 ▶'}</div>
            </div>
          </div>
        )}

        {friendView === 'friend' && (
          <div className="battle-friend-panel">
            <div className="battle-friend-header">
              <button className="endless-back-btn" onClick={() => { setFriendView('main'); b.reset(); }}>
                ◀ {isEn ? 'Back' : '뒤로'}
              </button>
            </div>
            <div className="battle-friend-options">
              <div className="battle-friend-box">
                <div className="battle-friend-box-title">🏠 {isEn ? 'Create Room' : '방 만들기'}</div>
                <div className="battle-friend-box-desc">{isEn ? 'Get a code to share with a friend' : '코드를 받아 친구에게 공유하세요'}</div>
                <button className="battle-action-btn" onClick={b.createFriendRoom}>{isEn ? 'Create Room' : '방 만들기'}</button>
              </div>
              <div className="battle-friend-sep">VS</div>
              <div className="battle-friend-box">
                <div className="battle-friend-box-title">🚪 {isEn ? 'Join Room' : '방 참가'}</div>
                <input
                  className="battle-code-input"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && b.joinFriendRoom(joinCode)}
                  placeholder={isEn ? 'Enter 6-char code' : '6자리 코드 입력'}
                  maxLength={6}
                />
                <button className="battle-action-btn" onClick={() => b.joinFriendRoom(joinCode)}>{isEn ? 'Join Room' : '참가하기'}</button>
              </div>
            </div>
            {b.error && <div className="battle-error">{b.error}</div>}
          </div>
        )}
      </main>
    );
  }

  // ── WAITING / SEARCHING ──────────────────────────────────
  if (b.phase === 'waiting' || b.phase === 'searching') {
    const isSearching = b.phase === 'searching';
    return (
      <main>
        <div className="battle-hero">
          <div className="battle-hero-badge">⚔</div>
          <div className="hero-t">{isEn ? 'Battle Mode' : '대전 모드'}</div>
        </div>
        <div className="battle-waiting">
          <div className="battle-waiting-icon">{isSearching ? '🔍' : '⏳'}</div>
          <div className="battle-waiting-title">
            {isSearching
              ? (isEn ? 'Finding opponent' : '상대를 찾는 중')
              : (isEn ? 'Waiting for opponent' : '상대를 기다리는 중')}
            <span className="battle-dots"><span>.</span><span>.</span><span>.</span></span>
          </div>
          {!isSearching && b.roomCode && (
            <div className="battle-room-code-box">
              <div className="battle-room-code-label">{isEn ? 'Room Code' : '방 코드'}</div>
              <div className="battle-room-code-val">{b.roomCode}</div>
              <button className="battle-copy-btn" onClick={() => navigator.clipboard.writeText(b.roomCode)}>
                📋 {isEn ? 'Copy Code' : '코드 복사'}
              </button>
            </div>
          )}
          <button className="battle-cancel-btn" onClick={b.reset}>{isEn ? 'Cancel' : '취소'}</button>
        </div>
      </main>
    );
  }

  // ── REMATCH WAIT ─────────────────────────────────────────
  if (b.phase === 'rematch_wait') {
    return (
      <main>
        <div className="battle-hero">
          <div className="battle-hero-badge">⚔</div>
          <div className="hero-t">{isEn ? 'Battle Mode' : '대전 모드'}</div>
        </div>
        <div className="battle-waiting">
          <div className="battle-waiting-icon">⏳</div>
          <div className="battle-waiting-title">
            {isEn ? 'Waiting for rematch' : '재대전 수락 대기 중'}
            <span className="battle-dots"><span>.</span><span>.</span><span>.</span></span>
          </div>
          <button className="battle-cancel-btn" onClick={b.reset}>{isEn ? 'Cancel' : '취소'}</button>
        </div>
      </main>
    );
  }

  // ── TIMEOUT ──────────────────────────────────────────────
  if (b.phase === 'timeout') {
    return (
      <main>
        <div className="battle-hero">
          <div className="battle-hero-badge">⚔</div>
          <div className="hero-t">{isEn ? 'Battle Mode' : '대전 모드'}</div>
        </div>
        <div className="battle-waiting">
          <div className="battle-waiting-icon">😔</div>
          <div className="battle-waiting-title">{isEn ? 'No opponent found.' : '상대를 찾지 못했어요.'}</div>
          <button className="battle-action-btn" onClick={b.reset}>{isEn ? 'Try Again' : '다시 시도'}</button>
        </div>
      </main>
    );
  }

  // ── PLAYING ──────────────────────────────────────────────
  if (b.phase === 'playing') {
    const urgent = b.isMyTurn && timer <= 10;
    const timerPct = (timer / TURN_SEC) * 100;
    const myTries = b.sharedGuesses.filter((_, i) =>
      b.mySlot === 'p1' ? i % 2 === 0 : i % 2 === 1
    ).length;

    return (
      <main>
        {/* HUD */}
        <div className="battle-hud">
          <div className={`battle-hud-player me${b.isMyTurn ? ' active' : ''}`}>
            <div className="battle-hud-label">{isEn ? 'ME' : '나'}</div>
            <div className="battle-hud-nick">{b.myNick}</div>
            <BattleTitleBadge titleId={b.myTitle} />
            <div className="battle-hud-tries">{myTries}<span className="battle-hud-tries-unit">{isEn ? ' tries' : '번'}</span></div>
            {b.isMyTurn && <div className="battle-hud-arrow my">▶ {isEn ? 'Your turn' : '내 턴'}</div>}
          </div>

          <div className="battle-hud-center">
            <div className="battle-hud-vs">VS</div>
            <div className={`battle-timer${urgent ? ' urgent' : ''}${!b.isMyTurn ? ' inactive' : ''}`}>
              {b.isMyTurn ? `${timer}` : '—'}
              {b.isMyTurn && <span className="battle-timer-unit">s</span>}
            </div>
            {b.isMyTurn && (
              <div className="battle-timer-bar-wrap">
                <div
                  className={`battle-timer-bar${urgent ? ' urgent' : ''}`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
            )}
          </div>

          <div className={`battle-hud-player op${!b.isMyTurn ? ' active' : ''}`}>
            <div className="battle-hud-label">{isEn ? 'OPPONENT' : '상대'}</div>
            <div className="battle-hud-nick">{b.opNick || '???'}</div>
            <BattleTitleBadge titleId={b.opTitle} />
            <div className="battle-hud-tries">{b.opTries || 0}<span className="battle-hud-tries-unit">{isEn ? ' tries' : '번'}</span></div>
            {!b.isMyTurn && <div className="battle-hud-arrow op">◀ {isEn ? "Their turn" : '상대 턴'}</div>}
          </div>
        </div>

        {/* 자리비움 경고 */}
        {b.mySkips >= 2 && (
          <div className="battle-afk-warning">
            ⚠️ {isEn ? '3 turns without input = defeat. One more skip and you lose!' : '3턴동안 아무것도 입력하지 않으면 패배 처리됩니다.'}
          </div>
        )}

        {/* 턴 배너 */}
        <div className={`battle-turn-banner${b.isMyTurn ? ' my-turn' : ' op-turn'}`}>
          {b.isMyTurn
            ? (isEn ? '🎯 Your Turn! Enter a Pokémon name.' : '🎯 내 턴! 포켓몬 이름을 입력하세요.')
            : (isEn ? "⏳ Opponent's Turn…" : '⏳ 상대방 턴… 기다려주세요.')}
        </div>

        {/* 10턴부터 5턴마다 초성 1개씩 추가 */}
        {chosungHints.length > 0 && (
          <div className="battle-chosung-hint">
            💡 {isEn ? 'Hint' : '힌트'}&nbsp;·&nbsp;
            {chosungHints.map((c, i) => (
              <span key={i} className="battle-chosung-text px">
                {i > 0 && <span className="battle-chosung-sep">, </span>}{c}
              </span>
            ))}
          </div>
        )}

        <Autocomplete onSubmit={handleSubmit} disabled={!b.isMyTurn} lang={lang} />
        <GuessTable guesses={b.sharedGuesses} answer={b.answer} lang={lang} />

        <div className="battle-giveup-wrap">
          <button className="battle-giveup-btn" onClick={() => {
            if (window.confirm(isEn ? 'Give up? You will lose.' : '항복하시겠어요? 패배 처리됩니다.')) b.giveUp();
          }}>
            🏳 {isEn ? 'Give Up' : '항복'}
          </button>
        </div>
      </main>
    );
  }

  // ── FINISHED ─────────────────────────────────────────────
  if (b.phase === 'finished') {
    const answerName = b.answer ? displayName(b.answer, lang) : '?';
    const myTries = b.room ? (b.mySlot === 'p1' ? b.room.p1_tries : b.room.p2_tries) : 0;
    const round = b.room?.round || 1;
    const opTries = b.room ? (b.mySlot === 'p1' ? b.room.p2_tries : b.room.p1_tries) : 0;
    const mySolved = b.room ? (b.mySlot === 'p1' ? b.room.p1_solved : b.room.p2_solved) : false;
    const opDisconnected = b.iWon && !mySolved;
    const isShiny = seededShiny(b.roomCode, round);
    return (
      <main>
        <div className={`battle-result-banner${b.iWon ? ' win' : ' lose'}${isShiny ? ' shiny' : ''}`}>
          <div className="battle-result-top">
            <div className="battle-result-emoji">{b.iWon ? '🏆' : '💀'}</div>
            <div className="battle-result-verdict">{b.iWon ? (isEn ? 'Victory!' : '승리!') : (isEn ? 'Defeat...' : '패배...')}</div>
            {opDisconnected && (
              <div className="battle-result-disconnect">{isEn ? '(Opponent disconnected)' : '(상대방 연결 끊김)'}</div>
            )}
            <div className="battle-result-round">{isEn ? `Round ${round}` : `${round}라운드`}</div>
          </div>

          <div className="battle-result-answer">
            {b.answer && <img className={`battle-result-sprite${isShiny ? ' shiny-sprite' : ''}`} src={isShiny ? sprShiny(b.answer.id) : spr(b.answer.id)} alt={answerName} />}
            <div className="battle-result-answer-label">{isEn ? 'Answer' : '정답'}</div>
            <div className="battle-result-answer-name">{answerName}</div>
          </div>

          <div className="battle-result-scores">
            <div className={`battle-result-score${b.iWon ? ' winner' : ''}`}>
              {b.iWon && <div className="battle-result-crown">👑</div>}
              <div className="battle-result-nick">{b.myNick}</div>
              <div className="battle-result-tries">{myTries}<span className="battle-result-tries-unit">{isEn ? ' tries' : '번'}</span></div>
            </div>
            <div className="battle-result-vs-mid">VS</div>
            <div className={`battle-result-score${!b.iWon && b.winner ? ' winner' : ''}`}>
              {!b.iWon && b.winner && <div className="battle-result-crown">👑</div>}
              <div className="battle-result-nick">{b.opNick || '???'}</div>
              <div className="battle-result-tries">{b.opTries || 0}<span className="battle-result-tries-unit">{isEn ? ' tries' : '번'}</span></div>
            </div>
          </div>

          <div className="battle-result-btns">
            <button className="battle-action-btn" onClick={b.requestRematch}>🔄 {isEn ? 'Rematch' : '다시 대전'}</button>
            <button className="battle-leave-btn" onClick={b.reset}>✕ {isEn ? 'Leave' : '나가기'}</button>
          </div>
        </div>

        <GuessTable guesses={b.sharedGuesses} answer={b.answer} lang={lang} />
      </main>
    );
  }

  return null;
}
