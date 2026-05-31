import { useState } from 'react';
import { Autocomplete } from './Autocomplete.jsx';
import { GuessTable } from './GuessTable.jsx';
import { FilterModal } from './FilterModal.jsx';
import { ResultBanner } from './ResultBanner.jsx';
import { useEndlessNormal, useEndlessChallenge } from '../hooks/useEndless.js';

function ModeSelect({ onSelect, lang }) {
  const isEn = lang === 'en';
  return (
    <main>
      <div className="hero">
        <div className="hero-t">{isEn ? 'Endless Mode' : '엔드리스 모드'}</div>
        <div className="hero-s">{isEn ? 'Choose your challenge' : '모드를 선택하세요'}</div>
      </div>
      <div className="endless-select">
        <div className="endless-card" onClick={() => onSelect('normal')}>
          <div className="endless-card-icon">∞</div>
          <div className="endless-card-title">{isEn ? 'Normal' : '일반'}</div>
          <ul className="endless-card-desc">
            <li>{isEn ? 'Unlimited tries' : '무한 시도'}</li>
            <li>{isEn ? 'Filter allowed' : '필터 허용'}</li>
            <li>{isEn ? 'No Dex registration' : '도감 등록 없음'}</li>
          </ul>
        </div>
        <div className="endless-card challenge" onClick={() => onSelect('challenge')}>
          <div className="endless-card-icon">★</div>
          <div className="endless-card-title">{isEn ? 'Challenge' : '챌린지'}</div>
          <ul className="endless-card-desc">
            <li>{isEn ? 'Within 10 tries' : '10번 이내 정답'}</li>
            <li>{isEn ? 'No filter' : '필터 불가'}</li>
            <li>{isEn ? 'Dex registration on clear' : '클리어 시 도감 등록'}</li>
            <li>{isEn ? '5 attempts per day' : '하루 5회 도전'}</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

function NormalGame({ lang }) {
  const g = useEndlessNormal();
  const isEn = lang === 'en';

  return (
    <main>
      <div className="hero">
        <div className="hero-t">{isEn ? 'Normal Endless' : '일반 엔드리스'}</div>
        <div className="hero-s">{isEn ? 'Attempts: ' : '시도 횟수 : '}<strong>{g.guesses.length}</strong>{isEn ? '' : '번'}</div>
      </div>

      {g.result && (
        <div className="result-banner show">
          <div className="res-poke">
            <div>
              <div className="res-t">★ {isEn ? `${g.answer.en || g.answer.ko} correct!` : `${g.answer.ko} 정답!`}</div>
              <div className="res-s">{isEn ? `Cleared in ${g.guesses.length} tries!` : `${g.guesses.length}번 만에 클리어!`}</div>
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

      <Autocomplete onSubmit={g.submitGuess} disabled={g.gameOver} lang={lang} />

      <div className="tools">
        <button
          className={`tool-btn${g.filterOpen ? ' active-btn' : ''}`}
          onClick={g.filterOpen ? g.closeFilter : g.openFilter}
        >
          {isEn ? '▸ Filter' : '▸ 필터 열람'}
        </button>
      </div>

      <GuessTable guesses={g.guesses} answer={g.answer} lang={lang} />
    </main>
  );
}

function ChallengeGame({ unlockDex, lang }) {
  const g = useEndlessChallenge(unlockDex);
  const isEn = lang === 'en';
  const triesLeft = g.maxTries - g.guesses.length;
  const tryDots = Array.from({ length: g.maxTries }, (_, i) => i < g.guesses.length);

  if (g.remaining <= 0 && !g.gameOver) {
    return (
      <main>
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
        <div className={`result-banner show${g.result.win ? '' : ' fail'}`}>
          <div className="res-poke">
            <div>
              <div className="res-t">
                {g.result.win
                  ? `★ ${isEn ? `${g.answer.en || g.answer.ko} correct!` : `${g.answer.ko} 정답!`}`
                  : `${isEn ? 'Answer: ' : '정답: '}${isEn ? g.answer.en || g.answer.ko : g.answer.ko}`}
              </div>
              <div className="res-s">
                {g.result.win
                  ? (isEn ? `Cleared in ${g.guesses.length} tries!` : `${g.guesses.length}번 만에 클리어!`)
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

      <Autocomplete onSubmit={g.submitGuess} disabled={g.gameOver} lang={lang} />

      <div className="tools">
        <span className="no-filter-notice">
          🚫 {isEn ? 'Filter not allowed in Challenge mode' : '챌린지 모드는 필터 사용 불가'}
        </span>
      </div>

      <GuessTable guesses={g.guesses} answer={g.answer} lang={lang} />
    </main>
  );
}

export function EndlessPage({ unlockDex, lang }) {
  const [mode, setMode] = useState('select');

  if (mode === 'select') return <ModeSelect onSelect={setMode} lang={lang} />;
  if (mode === 'normal') return <NormalGame lang={lang} />;
  if (mode === 'challenge') return <ChallengeGame unlockDex={unlockDex} lang={lang} />;
}
