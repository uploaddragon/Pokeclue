import { useState, useEffect, useRef } from 'react';
import { useBattle } from '../hooks/useBattle.js';
import { Autocomplete } from './Autocomplete.jsx';
import { GuessTable } from './GuessTable.jsx';
import { displayName } from '../utils/game.js';
import { spr } from '../utils/sprite.js';

const TURN_SEC = 30;

export function BattlePage({ user, lang }) {
  const isEn = lang === 'en';
  const b = useBattle(user);
  const [joinCode, setJoinCode] = useState('');
  const [friendView, setFriendView] = useState('main');
  const [timer, setTimer] = useState(TURN_SEC);
  const timerRef = useRef(null);

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
            <div className="battle-hud-tries">{b.opTries || 0}<span className="battle-hud-tries-unit">{isEn ? ' tries' : '번'}</span></div>
            {!b.isMyTurn && <div className="battle-hud-arrow op">◀ {isEn ? "Their turn" : '상대 턴'}</div>}
          </div>
        </div>

        {/* 턴 배너 */}
        <div className={`battle-turn-banner${b.isMyTurn ? ' my-turn' : ' op-turn'}`}>
          {b.isMyTurn
            ? (isEn ? '🎯 Your Turn! Enter a Pokémon name.' : '🎯 내 턴! 포켓몬 이름을 입력하세요.')
            : (isEn ? "⏳ Opponent's Turn…" : '⏳ 상대방 턴… 기다려주세요.')}
        </div>

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
    return (
      <main>
        <div className={`battle-result-banner${b.iWon ? ' win' : ' lose'}`}>
          <div className="battle-result-top">
            <div className="battle-result-emoji">{b.iWon ? '🏆' : '💀'}</div>
            <div className="battle-result-verdict">{b.iWon ? (isEn ? 'Victory!' : '승리!') : (isEn ? 'Defeat...' : '패배...')}</div>
            <div className="battle-result-round">{isEn ? `Round ${round}` : `${round}라운드`}</div>
          </div>

          <div className="battle-result-answer">
            {b.answer && <img className="battle-result-sprite" src={spr(b.answer.id)} alt={answerName} />}
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
