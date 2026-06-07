import { useRef } from 'react';
import { ResultBanner, RankingPanel, LegendPanel } from './ResultBanner.jsx';
import { FilterModal } from './FilterModal.jsx';
import { Autocomplete } from './Autocomplete.jsx';
import { GuessTable } from './GuessTable.jsx';

function InfoSection({ lang = 'ko', usedFilter }) {
  const isEn = lang === 'en';
  return (
    <div className="info-section">
      <div className="info-cards">
        <div className="panel info-card">
          <div className="info-icon">🔍</div>
          <div className="info-title px">{isEn ? 'Guess the Pokémon' : '포켓몬 추리'}</div>
          <div className="info-desc">{isEn ? <>A new Pokémon hides every day.<br />Type a name to guess!</> : <>매일 새 포켓몬이 숨겨집니다.<br />이름 입력으로 추리해보세요!</>}</div>
        </div>
        <div className="panel info-card">
          <div className="info-icon">🗂️✨</div>
          <div className="info-title px">{isEn ? 'Filter & Shiny' : '필터 & 이로치'}</div>
          <div className="info-desc">{isEn ? <>Filter shows possible Pokémon based on your clues.<br />But using it drops the shiny rate from 5% → 1%.<br />Try without filter!</> : <>필터는 단서를 토대로 해당하는 포켓몬 명단을 알려줍니다.<br />하지만 열람 시 이로치 확률이 5% → 1%로 떨어집니다.<br />필터 미사용으로 도전해보세요!</>}</div>
        </div>
        <div className="panel info-card">
          <div className="info-icon">∞</div>
          <div className="info-title px">{isEn ? 'Endless Mode' : '엔드리스 모드'}</div>
          <div className="info-desc">{isEn ? <>Keep playing after the daily!<br />Challenge mode even lets you register Pokémon to your Dex!</> : <>데일리 후에도 계속 즐기세요.<br />챌린지 모드는 도감 등록도 가능합니다!</>}</div>
        </div>
      </div>
      <div className="panel shiny-info">
        <div className="shiny-info-title px">✦ {isEn ? 'Shiny Challenge System' : '이로치 챌린지 시스템'}</div>
        <div className="shiny-info-rows">
          <span className="shiny-info-row">
            <span className="shiny-pct" style={{ background: usedFilter ? 'var(--miss)' : 'var(--correct)' }}>5%</span>
            <span>{isEn ? 'Clear without using filter' : '필터 미사용 클리어'}</span>
          </span>
          <span className="shiny-info-row">
            <span className="shiny-pct" style={{ background: 'var(--muted)' }}>1%</span>
            <span>{isEn ? 'Used filter at least once' : '필터 1회 이상 사용'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function GamePage({
  answer, guesses, gameOver, usedFilter,
  filterOpen, result,
  onSubmit, onOpenFilter, onCloseFilter, onPickFromFilter,
  onReset, onRanking, onEasterEgg,
  lang = 'ko', user, newTitleIds = [],
}) {
  const isEn = lang === 'en';
  const acRef = useRef(null);
  const shinyPct = usedFilter ? '1%' : '5%';

  /* ── 클리어(win) 화면 ── */
  if (gameOver && result?.win) {
    return (
      <main>
        <FilterModal open={filterOpen} answer={answer} guesses={guesses}
          onClose={onCloseFilter} onPick={onPickFromFilter} lang={lang} />
        <div className="clearwrap">
          <div className="leftcol">
            <ResultBanner answer={answer} result={result}
              guessCount={guesses.length} lang={lang} user={user} newTitleIds={newTitleIds} />
            <GuessTable guesses={guesses} answer={answer} lang={lang} showWinRow={true} />
          </div>
          <aside className="rightcol">
            <RankingPanel win={true} user={user} lang={lang} />
            <LegendPanel lang={lang} />
          </aside>
        </div>
        <InfoSection lang={lang} usedFilter={usedFilter} />
      </main>
    );
  }

  /* ── 실패 화면 ── */
  if (gameOver && result && !result.win) {
    return (
      <main>
        <ResultBanner answer={answer} result={result}
          guessCount={guesses.length} lang={lang} user={user} />
        <GuessTable guesses={guesses} answer={answer} lang={lang} />
        <LegendPanel lang={lang} />
        <InfoSection lang={lang} usedFilter={usedFilter} />
      </main>
    );
  }

  /* ── 진행 중 화면 ── */
  return (
    <main>
      {/* 상태 스트립 */}
      <div className="panel statusbar">
        <span className="statusbar-title px">
          <span className="star">★</span>{' '}
          {isEn ? "Guess today's Pokémon!" : '오늘의 포켓몬을 맞춰보세요'}
        </span>
        <span className="spacer" />
        <span className="chip">
          {isEn ? 'Attempts ' : '시도 횟수 '}
          <b className="px">{guesses.length}</b>
        </span>
        <span className="chip">
          <span className="dot" />
          {isEn ? ' Shiny ' : ' 이로치 확률 '}
          <b className="px">{shinyPct}</b>
        </span>
      </div>

      {/* 입력 행 */}
      <div className="inputrow">
        <Autocomplete ref={acRef} onSubmit={onSubmit} disabled={gameOver} lang={lang} onEasterEgg={onEasterEgg} />
        <button className="btn go" onClick={() => acRef.current?.submit()}>
          {isEn ? 'Guess ▶' : '맞히기 ▶'}
        </button>
        <button
          className={`btn ghost${filterOpen ? ' active' : ''}`}
          onClick={filterOpen ? onCloseFilter : onOpenFilter}
        >
          ⛃ {isEn ? 'Filter' : '필터'}
        </button>
      </div>

      <FilterModal open={filterOpen} answer={answer} guesses={guesses}
        onClose={onCloseFilter} onPick={onPickFromFilter} lang={lang} />

      <GuessTable guesses={guesses} answer={answer} lang={lang} />

      <LegendPanel lang={lang} />

      <InfoSection lang={lang} usedFilter={usedFilter} />
    </main>
  );
}
