import { useState, useEffect, useRef } from 'react';
import { useTypeBattle } from '../hooks/useTypeBattle.js';
import { Autocomplete } from './Autocomplete.jsx';
import { displayName } from '../utils/game.js';
import { spr, sprShiny } from '../utils/sprite.js';
import { TITLE_MAP, RARITY } from '../data/titles.js';
import { TCHIP_COL, TICON, TYPE_EN } from '../data/types.js';

const SELECT_SEC = 10;
const WIN_SCORE = 5;

function SpeechBubble({ bubble, side }) {
  if (!bubble) return null;
  return (
    <div className={`battle-bubble battle-bubble-${side}`}>
      <span className="battle-bubble-text">{bubble.text}</span>
      <div className="battle-bubble-tail" />
    </div>
  );
}

function BattleAvatar({ profilePokemon }) {
  const sprSrc = profilePokemon
    ? (profilePokemon.endsWith('-shiny') ? sprShiny(profilePokemon.slice(0, -6)) : spr(profilePokemon))
    : null;
  return (
    <div className="battle-avatar-circle">
      {sprSrc
        ? <img src={sprSrc} className="battle-avatar-spr" alt="" />
        : <svg viewBox="0 0 40 40" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#fff" stroke="#222" strokeWidth="2"/>
            <path d="M2 20 Q2 2 20 2 Q38 2 38 20Z" fill="#e63329"/>
            <rect x="2" y="18.5" width="36" height="3" fill="#222"/>
            <circle cx="20" cy="20" r="5.5" fill="#fff" stroke="#222" strokeWidth="2.5"/>
            <circle cx="20" cy="20" r="2.5" fill="#ddd"/>
          </svg>}
    </div>
  );
}

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

function WrongFlash({ flash, side }) {
  if (!flash) return null;
  const { poke } = flash;
  return (
    <div className={`battle-bubble tb-wrong-bubble battle-bubble-${side}`}>
      <img src={spr(poke.id)} alt="" className="tb-wrong-bubble-spr" />
      <div className="tb-wrong-bubble-types">
        <TypeChip type={poke.t1} lang="ko" />
        {poke.t2 !== '없음' && <TypeChip type={poke.t2} lang="ko" />}
      </div>
      <div className="battle-bubble-tail" />
    </div>
  );
}

function TypeChip({ type, lang }) {
  const isEn = lang === 'en';
  const col = TCHIP_COL[type] || TCHIP_COL['없음'];
  return (
    <span className="tb-type-chip" style={{ background: col.bg, color: col.fg }}>
      {TICON[type]} {isEn ? TYPE_EN[type] : type}
    </span>
  );
}

export function TypeBattlePage({ user, lang, onBattleWin, onBattleLoss }) {
  const isEn = lang === 'en';
  const b = useTypeBattle(user);
  const [joinCode, setJoinCode] = useState('');
  const [friendView, setFriendView] = useState('main');
  const [now, setNow] = useState(Date.now());
  const autoPickedRef = useRef(null);
  const resultFiredRef = useRef(false);
  const revealedAtRef = useRef(null);

  const roundDoneNow = !!b.room?.round_winner;

  // 선택 단계 + 정답 대기(실루엣 타이머) 단계 동안 시계 갱신
  useEffect(() => {
    if (b.phase !== 'playing') return;
    if (roundDoneNow) return;
    if (b.bothChosen && !b.revealed) return; // 공개 연출 중엔 불필요
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, [b.phase, b.bothChosen, b.revealed, roundDoneNow, b.room?.round]);

  const startedAt = b.room?.round_started_at ? new Date(b.room.round_started_at).getTime() : now;
  const selectRemain = Math.max(0, SELECT_SEC - Math.floor((now - startedAt) / 1000));

  // 라운드가 공개되는 순간의 시각을 기록 (실루엣 힌트 타이머 기준)
  useEffect(() => {
    revealedAtRef.current = b.revealed ? Date.now() : null;
  }, [b.revealed, b.room?.round]);
  const guessElapsed = revealedAtRef.current ? (now - revealedAtRef.current) / 1000 : 0;
  const showSilhouette = b.revealed && !roundDoneNow && guessElapsed >= 10 && !!b.hintPokemon;

  // 시간 초과 시 자동으로 랜덤 타입 선택
  useEffect(() => {
    if (b.phase !== 'playing' || b.myType || selectRemain > 0) return;
    if (autoPickedRef.current === b.room?.round) return;
    autoPickedRef.current = b.room?.round;
    b.pickType(b.ALL_TYPES[Math.floor(Math.random() * b.ALL_TYPES.length)]);
  }, [selectRemain, b.phase, b.myType, b.room?.round]); // eslint-disable-line react-hooks/exhaustive-deps

  // 매치 종료 시 콜백
  useEffect(() => {
    if (b.phase === 'finished' && !resultFiredRef.current) {
      resultFiredRef.current = true;
      if (b.iWon) onBattleWin?.({});
      else onBattleLoss?.({});
    }
    if (b.phase !== 'finished') resultFiredRef.current = false;
  }, [b.phase, b.iWon]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(id) {
    if (!b.bothChosen || !b.revealed || b.room?.round_winner) return;
    b.submitGuess(id);
  }

  // ── SELECT ───────────────────────────────────────────────
  if (b.phase === 'select') {
    return (
      <main>
        <div className="battle-hero">
          <div className="battle-hero-badge">🔤</div>
          <div className="hero-t">{isEn ? 'Type Battle' : '타입 대전'}</div>
          <div className="hero-s">{isEn ? 'Pick two types, race to name a matching Pokémon!' : '타입 2개를 골라 조합에 맞는 포켓몬을 먼저 맞혀보세요!'}</div>
        </div>

        {friendView === 'main' && (
          <div className="battle-select">
            <div className="battle-mode-card" onClick={b.findRandom}>
              <div className="battle-mode-icon">🎲</div>
              <div className="battle-mode-title">{isEn ? 'Random Match' : '랜덤 대전'}</div>
              <div className="battle-mode-sub">{isEn ? 'Jump in and play instantly' : '즉시 랜덤 상대와 대결'}</div>
              <ul className="battle-mode-desc">
                <li>{isEn ? 'First to 5 round wins' : '5라운드 먼저 이기면 승리'}</li>
                <li>{isEn ? '10s to pick a type each round' : '라운드마다 10초 내 타입 선택'}</li>
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
          <div className="battle-hero-badge">🔤</div>
          <div className="hero-t">{isEn ? 'Type Battle' : '타입 대전'}</div>
        </div>
        <div className="battle-waiting">
          <div className="battle-waiting-icon">{isSearching ? '🔍' : '⏳'}</div>
          <div className="battle-waiting-title">
            {isSearching ? (isEn ? 'Finding opponent' : '상대를 찾는 중') : (isEn ? 'Waiting for opponent' : '상대를 기다리는 중')}
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
          <div className="battle-hero-badge">🔤</div>
          <div className="hero-t">{isEn ? 'Type Battle' : '타입 대전'}</div>
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
          <div className="battle-hero-badge">🔤</div>
          <div className="hero-t">{isEn ? 'Type Battle' : '타입 대전'}</div>
        </div>
        <div className="battle-waiting">
          <div className="battle-waiting-icon">😔</div>
          <div className="battle-waiting-title">{isEn ? 'No opponent found.' : '상대를 찾지 못했어요.'}</div>
          <button className="battle-action-btn" onClick={b.reset}>{isEn ? 'Try Again' : '다시 시도'}</button>
        </div>
      </main>
    );
  }

  // ── FINISHED ─────────────────────────────────────────────
  if (b.phase === 'finished') {
    return (
      <main>
        <div className={`battle-result-banner${b.iWon ? ' win' : ' lose'}`}>
          <div className="battle-result-top">
            <div className="battle-result-emoji">{b.iWon ? '🏆' : '💀'}</div>
            <div className="battle-result-verdict">{b.iWon ? (isEn ? 'Victory!' : '승리!') : (isEn ? 'Defeat...' : '패배...')}</div>
            <div className="battle-result-round">{isEn ? `First to ${WIN_SCORE}` : `${WIN_SCORE}선승`}</div>
          </div>

          <div className="battle-result-scores">
            <div className={`battle-result-score${b.iWon ? ' winner' : ''}`}>
              {b.iWon && <div className="battle-result-crown">👑</div>}
              <BattleAvatar profilePokemon={b.myProfilePokemon} />
              <div className="battle-result-nick">{b.myNick}</div>
              <BattleTitleBadge titleId={b.myTitle} />
              <div className="battle-result-tries">{b.myScore}<span className="battle-result-tries-unit">{isEn ? ' wins' : '승'}</span></div>
            </div>
            <div className="battle-result-vs-mid">VS</div>
            <div className={`battle-result-score${!b.iWon ? ' winner' : ''}`}>
              {!b.iWon && <div className="battle-result-crown">👑</div>}
              <BattleAvatar profilePokemon={b.opProfilePokemon} />
              <div className="battle-result-nick">{b.opNick || '???'}</div>
              <BattleTitleBadge titleId={b.opTitle} />
              <div className="battle-result-tries">{b.opScore}<span className="battle-result-tries-unit">{isEn ? ' wins' : '승'}</span></div>
            </div>
          </div>

          <div className="battle-result-btns">
            <button className="battle-action-btn" onClick={b.requestRematch}>🔄 {isEn ? 'Rematch' : '재대전'}</button>
            <button className="battle-leave-btn" onClick={b.reset}>✕ {isEn ? 'Leave' : '나가기'}</button>
          </div>
        </div>
      </main>
    );
  }

  // ── PLAYING ──────────────────────────────────────────────
  const myPicked = !!b.myType;
  const roundDone = !!b.room?.round_winner;
  const iWonRound = roundDone && b.room.round_winner === b.mySlot;
  const opWonRound = roundDone && b.room.round_winner !== 'draw' && b.room.round_winner !== b.mySlot;

  return (
    <main>
      <div className="battle-hud">
        <div className={`battle-hud-player me${iWonRound ? ' tb-round-glow' : ''}`}>
          <div className="battle-avatar-wrap">
            <BattleAvatar profilePokemon={b.myProfilePokemon} />
            {b.myWrongFlash
              ? <WrongFlash key={b.myWrongFlash.key} flash={b.myWrongFlash} side="me" />
              : <SpeechBubble key={b.myBubble?.key} bubble={b.myBubble} side="me" />}
          </div>
          <span className="battle-hud-nick">{b.myNick} {isEn ? '(Me)' : '(나)'}</span>
          <BattleTitleBadge titleId={b.myTitle} />
          <span className="tb-score">{b.myScore}</span>
        </div>
        <div className="battle-hud-center">
          <span className="battle-hud-vs">VS</span>
          <span className="tb-goal">{isEn ? `First to ${WIN_SCORE}` : `${WIN_SCORE}선승`}</span>
        </div>
        <div className={`battle-hud-player op${opWonRound ? ' tb-round-glow' : ''}`}>
          <div className="battle-avatar-wrap">
            <BattleAvatar profilePokemon={b.opProfilePokemon} />
            {b.opWrongFlash
              ? <WrongFlash key={b.opWrongFlash.key} flash={b.opWrongFlash} side="op" />
              : <SpeechBubble key={b.opBubble?.key} bubble={b.opBubble} side="op" />}
          </div>
          <span className="battle-hud-nick">{b.opNick || (isEn ? 'Opponent' : '상대')}</span>
          <BattleTitleBadge titleId={b.opTitle} />
          <span className="tb-score">{b.opScore}</span>
        </div>
      </div>

      {/* 타입 선택 단계 */}
      {!b.bothChosen && (
        <div className="panel tb-select-panel">
          <div className="tb-select-header">
            {myPicked
              ? (isEn ? 'Waiting for opponent to pick a type…' : '상대가 타입을 고르는 중이에요…')
              : (isEn ? 'Pick your type!' : '타입을 선택하세요!')}
            <span className="tb-timer">{selectRemain}s</span>
          </div>
          {b.opTypeChosen && !myPicked && (
            <div className="tb-op-ready">✓ {isEn ? 'Opponent has chosen' : '상대는 선택을 완료했어요'}</div>
          )}
          <div className="tb-type-grid">
            {b.ALL_TYPES.map(t => {
              const col = TCHIP_COL[t];
              const selected = b.myType === t;
              return (
                <button
                  key={t}
                  className={`tb-type-btn${selected ? ' picked' : ''}`}
                  style={{ background: col.bg, color: col.fg, opacity: myPicked && !selected ? 0.4 : 1 }}
                  disabled={myPicked}
                  onClick={() => b.pickType(t)}
                >
                  {TICON[t]} {isEn ? TYPE_EN[t] : t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 공개 대기(로컬 3초) */}
      {b.bothChosen && !b.revealed && (
        <div className="panel tb-reveal-wait">
          <div className="tb-reveal-icon">🔒</div>
          <div className="tb-reveal-text">{isEn ? 'Revealing in 3…' : '3초 뒤 공개됩니다!'}</div>
        </div>
      )}

      {/* 공개 후: 추리 라운드 */}
      {b.bothChosen && b.revealed && (
        <div className="panel tb-round-panel">
          <div className="tb-combo">
            <TypeChip type={b.room.p1_type} lang={lang} />
            <span className="tb-combo-plus">+</span>
            <TypeChip type={b.room.p2_type} lang={lang} />
          </div>

          {!roundDone && (
            <>
              <div className="tb-round-sub">
                {isEn ? 'Name a Pokémon with this exact type combo — first correct guess wins the round!' : '이 타입 조합을 가진 포켓몬을 먼저 맞히면 라운드 승리!'}
              </div>
              {showSilhouette && (
                <div className="tb-silhouette-wrap">
                  <img src={spr(b.hintPokemon.id)} alt="" className="tb-silhouette-img" />
                  <div className="tb-silhouette-label">{isEn ? '💡 Hint' : '💡 실루엣 힌트'}</div>
                </div>
              )}
              <Autocomplete onSubmit={handleSubmit} lang={lang} />
              {b.myGuesses.length > 0 && (
                <div className="tb-wrong-list">
                  {isEn ? 'Wrong guesses: ' : '오답: '}
                  {b.myGuesses.map(p => displayName(p, lang)).join(', ')}
                </div>
              )}
            </>
          )}

          {roundDone && (
            <div className={`tb-round-result${iWonRound ? ' win' : opWonRound ? ' lose' : ''}`}>
              {b.room.round_winner === 'draw' ? (
                <div className="tb-result-text">
                  {isEn ? '😅 No Pokémon has this type combo! No winner this round.' : '😅 해당 타입 조합의 포켓몬이 존재하지 않아요! 승자 없이 다음 라운드로 넘어갑니다.'}
                </div>
              ) : (
                <>
                  <div className="tb-result-banner">
                    {iWonRound
                      ? (isEn ? `🎉 You score! (${b.myNick})` : `🎉 ${b.myNick} 득점!`)
                      : (isEn ? `💧 ${b.opNick || 'Opponent'} scores!` : `💧 ${b.opNick || '상대'} 득점!`)}
                  </div>
                  {b.roundAnswer && (
                    <div className="tb-answer-card">
                      <img src={spr(b.roundAnswer.id)} alt="" className="tb-answer-spr" />
                      <div className="tb-answer-info">
                        <span className="tb-answer-name">{displayName(b.roundAnswer, lang)}</span>
                        <div className="tb-answer-types">
                          <TypeChip type={b.roundAnswer.t1} lang={lang} />
                          {b.roundAnswer.t2 !== '없음' && <TypeChip type={b.roundAnswer.t2} lang={lang} />}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="battle-chat-bar">
        {['😊 잘 부탁해!', '🔥 좋아!', '😤 아깝다!', '👏 나이스!', '😱 이런!'].map(m => (
          <button key={m} className="battle-chat-btn" onClick={() => b.sendChat(m)}>{m}</button>
        ))}
      </div>
      <div className="battle-giveup-wrap">
        <button className="battle-giveup-btn" onClick={() => {
          if (window.confirm(isEn ? 'Give up? You will lose.' : '도망치시겠어요? 패배 처리됩니다.')) b.giveUp();
        }}>
          🏃 {isEn ? 'Run Away' : '도망치다'}
        </button>
      </div>
    </main>
  );
}
