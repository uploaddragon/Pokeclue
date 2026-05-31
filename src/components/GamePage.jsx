import { ResultBanner } from './ResultBanner.jsx';
import { FilterModal } from './FilterModal.jsx';
import { Autocomplete } from './Autocomplete.jsx';
import { GuessTable } from './GuessTable.jsx';

export function GamePage({ answer, guesses, gameOver, usedFilter, filterOpen, result, onSubmit, onOpenFilter, onCloseFilter, onPickFromFilter, onReset, onRanking, lang = 'ko', user }) {
  const isEn = lang === 'en';
  return (
    <main>
      <div className="hero">
        <div className="hero-t">{isEn ? "Guess today's Pokémon!" : '오늘의 포켓몬을 맞춰보세요!'}</div>
        <div className="hero-s">{isEn ? 'Attempts: ' : '시도 횟수 : '}<strong>{guesses.length}</strong>{isEn ? '' : '번'}</div>
      </div>

      <ResultBanner answer={answer} result={result} guessCount={guesses.length} onReset={onReset} lang={lang} user={user} />

      <FilterModal
        open={filterOpen}
        answer={answer}
        guesses={guesses}
        onClose={onCloseFilter}
        onPick={onPickFromFilter}
        lang={lang}
      />

      <Autocomplete onSubmit={onSubmit} disabled={gameOver} lang={lang} />

      <div className="tools">
        <button
          className={`tool-btn${filterOpen ? ' active-btn' : ''}`}
          onClick={filterOpen ? onCloseFilter : onOpenFilter}
        >
          {isEn ? '▸ Filter' : '▸ 필터 열람'}
        </button>
        <button className="tool-btn ranking-btn" onClick={onRanking}>
          🏆 {isEn ? 'Ranking' : '랭킹'}
        </button>
        <span className="badge">
          <span className="dot"></span>
          {isEn ? 'Shiny rate: ' : '이로치 확률 : '}<span style={{ color: 'var(--partial)' }}>{usedFilter ? '1%' : '5%'}</span>
        </span>
      </div>

      <GuessTable guesses={guesses} answer={answer} lang={lang} />

      <div className="how">
        <div className="how-c">
          <div className="how-i">🔍</div>
          <div className="how-t">{isEn ? 'Guess the Pokémon' : '포켓몬 추리'}</div>
          <div className="how-d">{isEn ? <>A new Pokémon hides every day.<br />Type a name to guess!</> : <>매일 새 포켓몬이 숨겨집니다.<br />이름 입력으로 추리해보세요!</>}</div>
        </div>
        <div className="how-c">
          <div className="how-i">🗂️</div>
          <div className="how-t">{isEn ? 'Filter' : '필터 열람'}</div>
          <div className="how-d">{isEn ? <>Based on your guesses,<br />filters show possible Pokémon.</> : <>추측 결과를 바탕으로<br />가능한 포켓몬만 걸러줘요.</>}</div>
        </div>
        <div className="how-c">
          <div className="how-i">✨</div>
          <div className="how-t">{isEn ? 'Shiny Challenge' : '이로치 챌린지'}</div>
          <div className="how-d">{isEn ? <>Clear without filter<br />for 5% shiny chance!</> : <>필터 미사용 클리어 시<br />이로치 확률 5%!</>}</div>
        </div>
      </div>

      <div className="leg">
        <div className="leg-t">{isEn ? 'Color Guide' : '색상 안내'}</div>
        <div className="leg-r">
          <span className="ld" style={{ background: 'var(--correct)' }}></span>{isEn ? 'Exact match' : '정확히 일치'}
          <span className="ld" style={{ background: 'var(--partial)' }}></span>{isEn ? 'Partial / same base Pokémon' : '부분 일치 / 같은 기반 포켓몬'}
          <span className="ld" style={{ background: 'var(--wrong)' }}></span>{isEn ? 'No match 〈↑↓ direction hint〉' : '불일치 〈↑↓ 방향 힌트〉'}
        </div>
      </div>

      <div className="shiny-card">
        <div className="shiny-t">{isEn ? '★ Shiny Challenge System' : '★ 이로치 챌린지 시스템'}</div>
        <div className="shiny-r">
          <span className="shiny-p">5%</span> · {isEn ? 'Clear without filter' : '필터 미사용 클리어'}<br />
          <span className="shiny-p">1%</span> · {isEn ? 'Used filter at least once' : '필터 1회 이상 사용'}
        </div>
      </div>
    </main>
  );
}
