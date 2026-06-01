import { useRef } from 'react';
import { ResultBanner, RankingPanel, LegendPanel } from './ResultBanner.jsx';
import { FilterModal } from './FilterModal.jsx';
import { Autocomplete } from './Autocomplete.jsx';
import { GuessTable } from './GuessTable.jsx';

export function GamePage({
  answer, guesses, gameOver, usedFilter,
  filterOpen, result,
  onSubmit, onOpenFilter, onCloseFilter, onPickFromFilter,
  onReset, onRanking,
  lang = 'ko', user,
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
              guessCount={guesses.length} lang={lang} user={user} />
            <GuessTable guesses={guesses} answer={answer} lang={lang} showWinRow={true} />
          </div>
          <aside className="rightcol">
            <RankingPanel win={true} user={user} lang={lang} />
            <LegendPanel lang={lang} />
          </aside>
        </div>
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
        <Autocomplete ref={acRef} onSubmit={onSubmit} disabled={gameOver} lang={lang} />
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
    </main>
  );
}
