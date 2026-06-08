import { useState, useEffect, useRef } from 'react';
import { Autocomplete } from './Autocomplete.jsx';
import { GuessTable } from './GuessTable.jsx';
import { FilterModal } from './FilterModal.jsx';
import { ResultBanner } from './ResultBanner.jsx';
import { useEndlessNormal, useEndlessChallenge } from '../hooks/useEndless.js';
import { spr, sprShiny } from '../utils/sprite.js';

function ModeSelect({ onSelect, lang }) {
  const isEn = lang === 'en';
  return (
    <main>
      <div className="endless-hero">
        <div className="endless-hero-badge">∞</div>
        <div className="hero-t">{isEn ? 'Endless Mode' : '엔드리스 모드'}</div>
        <div className="hero-s">{isEn ? 'Choose your mode and keep playing!' : '데일리 이후에도 계속 포켓몬을 추리하세요!'}</div>
      </div>
      <div className="endless-select">
        <div className="endless-card" onClick={() => onSelect('normal')}>
          <div className="endless-card-icon">∞</div>
          <div className="endless-card-title">{isEn ? 'Normal' : '일반'}</div>
          <div className="endless-card-sub">{isEn ? 'Relaxed play, no limits' : '부담 없이 즐기는 무한 플레이'}</div>
          <ul className="endless-card-desc">
            <li>{isEn ? 'Unlimited tries per round' : '라운드당 무한 시도'}</li>
            <li>{isEn ? 'Filter allowed' : '필터 허용'}</li>
            <li>{isEn ? 'Play as many rounds as you want' : '원하는 만큼 계속 플레이'}</li>
            <li className="endless-card-note">{isEn ? 'No Dex registration' : '도감 등록 없음'}</li>
          </ul>
          <div className="endless-card-cta">{isEn ? 'Play Normal ▶' : '일반 시작 ▶'}</div>
        </div>
        <div className="endless-card challenge" onClick={() => onSelect('challenge')}>
          <div className="endless-card-icon">★</div>
          <div className="endless-card-title">{isEn ? 'Challenge' : '챌린지'}</div>
          <div className="endless-card-sub">{isEn ? 'Test your skills, earn rewards' : '실력을 시험하고 도감을 채우세요'}</div>
          <ul className="endless-card-desc">
            <li>{isEn ? '8 tries to guess correctly' : '8번 이내에 정답 맞히기'}</li>
            <li>{isEn ? 'No filter — pure instinct!' : '필터 불가 — 직감으로 승부!'}</li>
            <li>{isEn ? 'Clear → Dex registration' : '클리어 시 도감 자동 등록'}</li>
            <li>{isEn ? '3 daily attempts' : '하루 3회 도전 기회'}</li>
          </ul>
          <div className="endless-card-cta challenge">{isEn ? 'Play Challenge ▶' : '챌린지 시작 ▶'}</div>
        </div>
      </div>
    </main>
  );
}

function NormalGame({ lang, onBack, onEasterEgg, onWin, onGuess }) {
  const g = useEndlessNormal();
  const isEn = lang === 'en';
  const firedRef = useRef(false);
  const prevLenRef = useRef(0);
  useEffect(() => {
    if (g.result?.win && !firedRef.current) {
      firedRef.current = true;
      onWin?.({ tries: g.guesses.length, usedFilter: g.usedFilter ?? false });
    }
    if (!g.result) firedRef.current = false;
  }, [g.result]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (g.guesses.length > prevLenRef.current && g.answer) {
      const last = g.guesses[g.guesses.length - 1];
      onGuess?.(last, g.answer);
    }
    prevLenRef.current = g.guesses.length;
  }, [g.guesses.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main>
      <div className="endless-game-header">
        <button className="endless-back-btn" onClick={onBack}>◀ {isEn ? 'Back' : '뒤로'}</button>
        <div className="endless-mode-tag">∞ {isEn ? 'Normal' : '일반'}</div>
      </div>
      <div className="hero">
        <div className="hero-t">{isEn ? 'Normal Endless' : '일반 엔드리스'}</div>
        <div className="endless-stat-row">
          <span className="endless-stat-label">{isEn ? 'Tries' : '시도'}</span>
          <span className="endless-stat-val">{g.guesses.length}<span className="endless-stat-unit">{isEn ? '' : '번'}</span></span>
        </div>
      </div>

      {g.result && (
        <div className={`result-banner show${g.result.isShiny ? ' shiny' : ''}`}>
          <div className="res-poke">
            <img
              src={g.result.isShiny ? sprShiny(g.answer.id) : spr(g.answer.id)}
              alt={isEn ? g.answer.en || g.answer.ko : g.answer.ko}
              className={`res-sprite${g.result.isShiny ? ' shiny-sprite' : ''}`}
            />
            <div>
              <div className="res-t">
                {g.result.isShiny ? '✨ ' : '★ '}
                {isEn ? `${g.answer.en || g.answer.ko} correct!` : `${g.answer.ko} 정답!`}
              </div>
              <div className="res-s">
                {g.result.isShiny
                  ? (isEn ? '✨ Shiny! Lucky!' : '✨ 이로치 등장! 행운이에요!')
                  : (isEn ? `Cleared in ${g.guesses.length} tries!` : `${g.guesses.length}번 만에 클리어!`)}
              </div>
            </div>
          </div>
          <button className="next-btn" onClick={g.nextPokemon}>
            {isEn ? 'Next Pokémon ▶' : '다음 포켓몬 ▶'}
          </button>
        </div>
      )}

      <FilterModal
        open={g.filterOpen}
        answer={g.answer}
        guesses={g.guesses}
        onClose={g.closeFilter}
        onPick={g.pickFromFilter}
        lang={lang}
      />

      <Autocomplete onSubmit={g.submitGuess} disabled={g.gameOver} lang={lang} onEasterEgg={onEasterEgg} />

      <div className="tools">
        <button
          className={`tool-btn${g.filterOpen ? ' active-btn' : ''}`}
          onClick={g.filterOpen ? g.closeFilter : g.openFilter}
        >
          {isEn ? '▸ Filter' : '▸ 필터 열람'}
        </button>
        {!g.gameOver && (
          <button className="tool-btn" onClick={() => {
            if (window.confirm(isEn ? 'Run away? The answer will be revealed.' : '도망치시겠어요? 정답이 공개됩니다.')) g.giveUp();
          }}>
            🏃 {isEn ? 'Run Away' : '도망치다'}
          </button>
        )}
      </div>

      <GuessTable guesses={g.guesses} answer={g.answer} lang={lang} />
    </main>
  );
}

function ChallengeGame({ unlockDex, lang, onBack, onEasterEgg, onWin, onGuess }) {
  const g = useEndlessChallenge(unlockDex);
  const isEn = lang === 'en';
  const firedRef = useRef(false);
  const prevLenRef = useRef(0);
  useEffect(() => {
    if (g.result?.win && !firedRef.current) {
      firedRef.current = true;
      onWin?.({ tries: g.guesses.length, usedFilter: false });
    }
    if (!g.result) firedRef.current = false;
  }, [g.result]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (g.guesses.length > prevLenRef.current && g.answer) {
      const last = g.guesses[g.guesses.length - 1];
      onGuess?.(last, g.answer);
    }
    prevLenRef.current = g.guesses.length;
  }, [g.guesses.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const triesLeft = g.maxTries - g.guesses.length;
  const tryDots = Array.from({ length: g.maxTries }, (_, i) => i < g.guesses.length);

  if (g.remaining <= 0 && !g.gameOver) {
    return (
      <main>
        <div className="endless-game-header">
          <button className="endless-back-btn" onClick={onBack}>◀ {isEn ? 'Back' : '뒤로'}</button>
          <div className="endless-mode-tag challenge">★ {isEn ? 'Challenge' : '챌린지'}</div>
        </div>
        <div className="hero">
          <div className="hero-t">{isEn ? 'Challenge' : '챌린지'}</div>
          <div className="hero-s" style={{ color: 'var(--wrong)' }}>
            {isEn ? 'No attempts remaining today.' : '오늘 도전 횟수를 모두 소진했습니다.'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="endless-game-header">
        <button className="endless-back-btn" onClick={onBack}>◀ {isEn ? 'Back' : '뒤로'}</button>
        <div className="endless-mode-tag challenge">★ {isEn ? 'Challenge' : '챌린지'}</div>
      </div>
      <div className="hero">
        <div className="hero-t">{isEn ? 'Challenge' : '챌린지'}</div>
        <div className="challenge-meta">
          <div className="challenge-stat">
            <span className="challenge-label">{isEn ? 'Daily attempts' : '오늘 도전'}</span>
            <div className="challenge-dots">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={`cdot${i < g.remaining ? ' active' : ''}`} />
              ))}
            </div>
            <span className="challenge-val">{g.remaining}<span className="challenge-unit">{isEn ? ' left' : '회'}</span></span>
          </div>
          <div className="challenge-divider" />
          <div className="challenge-stat">
            <span className="challenge-label">{isEn ? 'Tries' : '시도'}</span>
            <div className="challenge-dots">
              {tryDots.map((used, i) => (
                <span key={i} className={`cdot try${used ? ' used' : ''}`} />
              ))}
            </div>
            <span className="challenge-val">{triesLeft}<span className="challenge-unit">{isEn ? ' left' : '번 남음'}</span></span>
          </div>
        </div>
      </div>

      {g.result && (
        <div className={`result-banner show${g.result.win ? (g.result.isShiny ? ' shiny' : '') : ' fail'}`}>
          <div className="res-poke">
            <img
              src={g.result.win && g.result.isShiny ? sprShiny(g.answer.id) : spr(g.answer.id)}
              alt={isEn ? g.answer.en || g.answer.ko : g.answer.ko}
              className={`res-sprite${g.result.win && g.result.isShiny ? ' shiny-sprite' : ''}`}
            />
            <div>
              <div className="res-t">
                {g.result.win
                  ? `${g.result.isShiny ? '✨' : '★'} ${isEn ? `${g.answer.en || g.answer.ko} correct!` : `${g.answer.ko} 정답!`}`
                  : `${isEn ? 'Answer: ' : '정답: '}${isEn ? g.answer.en || g.answer.ko : g.answer.ko}`}
              </div>
              <div className="res-s">
                {g.result.win
                  ? g.result.isShiny
                    ? (isEn ? '✨ Shiny! Lucky!' : '✨ 이로치 등장! 행운이에요!')
                    : (isEn ? `Cleared in ${g.guesses.length} tries!` : `${g.guesses.length}번 만에 클리어!`)
                  : (isEn ? 'Failed — attempt used.' : '실패 — 도전 횟수가 차감됩니다.')}
              </div>
            </div>
          </div>
          {g.remaining > 0 && (
            <button className="next-btn" onClick={g.nextChallenge}>
              {isEn ? 'Next Challenge ▶' : '다음 도전 ▶'}
            </button>
          )}
        </div>
      )}

      <Autocomplete onSubmit={g.submitGuess} disabled={g.gameOver} lang={lang} onEasterEgg={onEasterEgg} />

      <div className="tools">
        <span className="no-filter-notice">
          🚫 {isEn ? 'Filter not allowed in Challenge mode' : '챌린지 모드는 필터 사용 불가'}
        </span>
      </div>

      <GuessTable guesses={g.guesses} answer={g.answer} lang={lang} />
    </main>
  );
}

export function EndlessPage({ unlockDex, lang, onEasterEgg, onWin, onGuess }) {
  const [mode, setMode] = useState('select');

  if (mode === 'select') return <ModeSelect onSelect={setMode} lang={lang} />;
  if (mode === 'normal') return <NormalGame lang={lang} onBack={() => setMode('select')} onEasterEgg={onEasterEgg} onWin={onWin} onGuess={onGuess} />;
  if (mode === 'challenge') return <ChallengeGame unlockDex={unlockDex} lang={lang} onBack={() => setMode('select')} onEasterEgg={onEasterEgg} onWin={onWin} onGuess={onGuess} />;
}
