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
  const [friendView, setFriendView] = useState('main'); // 'main' | 'friend'
  const [timer, setTimer] = useState(TURN_SEC);
  const [skipped, setSkipped] = useState(false);
  const timerRef = useRef(null);

  // 타이머: playing 단계에서만 동작
  useEffect(() => {
    if (b.phase !== 'playing' || b.gameOver) {
      clearInterval(timerRef.current);
      return;
    }
    setTimer(TURN_SEC);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          // 시간 초과 → 턴 넘김 표시 후 리셋
          setSkipped(true);
          setTimeout(() => setSkipped(false), 1500);
          return TURN_SEC;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [b.phase, b.gameOver]);

  function handleSubmit(id) {
    setTimer(TURN_SEC); // 제출 시 타이머 리셋
    b.submitGuess(id);
  }

  // ── SELECT ──────────────────────────────────────────────
  if (b.phase === 'select') {
    return (
      <main>
        <div className="hero">
          <div className="hero-t">⚔ {isEn ? 'Battle Mode' : '대전 모드'}</div>
          <div className="hero-s">{isEn ? 'Race to guess the Pokémon first!' : '먼저 맞추는 사람이 승리!'}</div>
        </div>

        {friendView === 'main' && (
          <div className="battle-select">
            <div className="battle-mode-card" onClick={b.findRandom}>
              <div className="battle-mode-icon">🎲</div>
              <div className="battle-mode-title">{isEn ? 'Random Match' : '랜덤 대전'}</div>
              <div className="battle-mode-desc">{isEn ? 'Match with a random player online' : '온라인 랜덤 상대와 즉시 대결'}</div>
            </div>
            <div className="battle-mode-card friend" onClick={() => setFriendView('friend')}>
              <div className="battle-mode-icon">👥</div>
              <div className="battle-mode-title">{isEn ? 'Friend Battle' : '친구와 대전'}</div>
              <div className="battle-mode-desc">{isEn ? 'Create or join a room with a code' : '코드로 방을 만들거나 참가'}</div>
            </div>
          </div>
        )}

        {friendView === 'friend' && (
          <div className="battle-friend-panel">
            <button className="battle-back-btn" onClick={() => { setFriendView('main'); b.reset(); }}>
              ← {isEn ? 'Back' : '뒤로'}
            </button>
            <div className="battle-friend-options">
              <div className="battle-friend-box">
                <div className="battle-friend-box-title">{isEn ? '🏠 Create Room' : '🏠 방 만들기'}</div>
                <div className="battle-friend-box-desc">{isEn ? 'Get a code to share with a friend' : '코드를 받아 친구에게 공유하세요'}</div>
                <button className="battle-action-btn" onClick={b.createFriendRoom}>
                  {isEn ? 'Create Room' : '방 만들기'}
                </button>
              </div>
              <div className="battle-friend-sep">VS</div>
              <div className="battle-friend-box">
                <div className="battle-friend-box-title">{isEn ? '🚪 Join Room' : '🚪 방 참가'}</div>
                <input
                  className="battle-code-input"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && b.joinFriendRoom(joinCode)}
                  placeholder={isEn ? 'Enter 6-char code' : '6자리 코드 입력'}
                  maxLength={6}
                />
                <button className="battle-action-btn" onClick={() => b.joinFriendRoom(joinCode)}>
                  {isEn ? 'Join Room' : '참가하기'}
                </button>
              </div>
            </div>
            {b.error && <div className="battle-error">{b.error}</div>}
          </div>
        )}
      </main>
    );
  }

  // ── SEARCHING / WAITING ──────────────────────────────────
  if (b.phase === 'searching' || b.phase === 'waiting') {
    return (
      <main>
        <div className="hero">
          <div className="hero-t">⚔ {isEn ? 'Battle Mode' : '대전 모드'}</div>
        </div>
        <div className="battle-waiting">
          <div className="battle-waiting-icon">
            {b.phase === 'searching' ? '🔍' : '⏳'}
          </div>
          <div className="battle-waiting-title">
            {b.phase === 'searching'
              ? (isEn ? 'Finding opponent...' : '상대를 찾는 중...')
              : (isEn ? 'Waiting for opponent...' : '상대를 기다리는 중...')}
          </div>
          {b.phase === 'waiting' && b.roomCode && (
            <div className="battle-room-code-box">
              <div className="battle-room-code-label">{isEn ? 'Room Code' : '방 코드'}</div>
              <div className="battle-room-code-val">{b.roomCode}</div>
              <button className="battle-copy-btn" onClick={() => navigator.clipboard.writeText(b.roomCode)}>
                📋 {isEn ? 'Copy Code' : '코드 복사'}
              </button>
            </div>
          )}
          <button className="battle-cancel-btn" onClick={b.reset}>
            {isEn ? 'Cancel' : '취소'}
          </button>
        </div>
      </main>
    );
  }

  // ── TIMEOUT ──────────────────────────────────────────────
  if (b.phase === 'timeout') {
    return (
      <main>
        <div className="hero">
          <div className="hero-t">⚔ {isEn ? 'Battle Mode' : '대전 모드'}</div>
        </div>
        <div className="battle-waiting">
          <div className="battle-waiting-icon">😔</div>
          <div className="battle-waiting-title">
            {isEn ? 'No opponent found.' : '상대를 찾지 못했어요.'}
          </div>
          <button className="battle-action-btn" onClick={b.reset}>
            {isEn ? 'Try Again' : '다시 시도'}
          </button>
        </div>
      </main>
    );
  }

  // ── PLAYING ──────────────────────────────────────────────
  if (b.phase === 'playing') {
    const urgent = timer <= 10;
    return (
      <main>
        <div className="battle-hud">
          <div className="battle-hud-player me">
            <div className="battle-hud-label">{isEn ? 'ME' : '나'}</div>
            <div className="battle-hud-nick">{b.myNick}</div>
            <div className="battle-hud-tries">{b.guesses.length}{isEn ? ' tries' : '번'}</div>
          </div>

          <div className="battle-hud-center">
            <div className="battle-hud-vs">VS</div>
            <div className={`battle-timer${urgent ? ' urgent' : ''}`}>
              {skipped
                ? (isEn ? 'SKIP!' : '턴 넘김!')
                : `${timer}s`}
            </div>
          </div>

          <div className="battle-hud-player op">
            <div className="battle-hud-label">{isEn ? 'OPPONENT' : '상대'}</div>
            <div className="battle-hud-nick">{b.opNick || '???'}</div>
            <div className="battle-hud-tries">
              {b.opTries != null ? `${b.opTries}${isEn ? ' tries' : '번'}` : '-'}
              {b.opSolved && <span className="battle-solved-mark"> ✓</span>}
            </div>
          </div>
        </div>

        {b.gameOver && !b.room?.status?.includes('finished') && (
          <div className="battle-waiting-msg">
            {isEn ? '⏳ Waiting for opponent to finish...' : '⏳ 상대가 마무리하기를 기다리는 중...'}
          </div>
        )}

        <Autocomplete onSubmit={handleSubmit} disabled={b.gameOver} lang={lang} />
        <GuessTable guesses={b.guesses} answer={b.answer} lang={lang} />
      </main>
    );
  }

  // ── FINISHED ──────────────────────────────────────────────
  if (b.phase === 'finished') {
    const answerName = b.answer ? displayName(b.answer, lang) : '?';
    return (
      <main>
        <div className={`result-banner show${b.iWon ? '' : ' fail'}`}>
          <div className="res-poke">
            {b.answer && <img src={spr(b.answer.id)} alt={answerName} />}
            <div>
              <div className="res-t">
                {b.iWon
                  ? (isEn ? '🏆 Victory!' : '🏆 승리!')
                  : (b.winner ? (isEn ? '💀 Defeat...' : '💀 패배...') : (isEn ? '🤝 Draw!' : '🤝 무승부!'))}
              </div>
              <div className="res-s">{isEn ? `Answer: ${answerName}` : `정답: ${answerName}`}</div>
            </div>
          </div>

          <div className="battle-result-scores">
            <div className={`battle-result-score${b.iWon ? ' winner' : ''}`}>
              <div className="battle-result-nick">{b.myNick}</div>
              <div className="battle-result-tries">{b.guesses.length}{isEn ? ' tries' : '번'}</div>
              {b.iWon && <div className="battle-result-crown">👑</div>}
            </div>
            <div className="battle-result-vs">VS</div>
            <div className={`battle-result-score${!b.iWon && b.winner ? ' winner' : ''}`}>
              <div className="battle-result-nick">{b.opNick || '???'}</div>
              <div className="battle-result-tries">
                {b.opTries != null ? `${b.opTries}${isEn ? ' tries' : '번'}` : '-'}
              </div>
              {!b.iWon && b.winner && <div className="battle-result-crown">👑</div>}
            </div>
          </div>

          <button className="next-btn" onClick={b.reset}>
            {isEn ? '▶ Play Again' : '▶ 다시 대전'}
          </button>
        </div>
        <GuessTable guesses={b.guesses} answer={b.answer} lang={lang} />
      </main>
    );
  }

  return null;
}
