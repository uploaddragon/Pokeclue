import { spr } from '../utils/sprite.js';
import { arrow, compareForm, formLabel, displayName } from '../utils/game.js';
import { TCHIP_COL } from '../data/types.js';

function TypeChip({ type, lang = 'ko' }) {
  if (!type || type === '없음') {
    return <span className="cell-none">— {lang === 'en' ? 'None' : '없음'}</span>;
  }
  const c = TCHIP_COL[type] || { bg: '#bbb', fg: '#222' };
  return (
    <span className="tchip" style={{ background: c.bg, color: c.fg }}>
      {lang === 'en'
        ? (type === '노말' ? 'Normal' : type === '불꽃' ? 'Fire' : type === '물' ? 'Water'
          : type === '전기' ? 'Electric' : type === '풀' ? 'Grass' : type === '얼음' ? 'Ice'
          : type === '격투' ? 'Fight' : type === '독' ? 'Poison' : type === '땅' ? 'Ground'
          : type === '비행' ? 'Flying' : type === '에스퍼' ? 'Psychic' : type === '벌레' ? 'Bug'
          : type === '바위' ? 'Rock' : type === '고스트' ? 'Ghost' : type === '드래곤' ? 'Dragon'
          : type === '악' ? 'Dark' : type === '강철' ? 'Steel' : type === '페어리' ? 'Fairy' : type)
        : type}
    </span>
  );
}

function GuessRow({ g, answer, lang, isWin }) {
  const isEn = lang === 'en';
  const lf = isEn ? 'enLen' : 'len';

  const genSt  = g.gen === answer.gen  ? 'correct' : 'miss';
  const t1St   = g.t1  === answer.t1   ? 'correct' : g.t1 === answer.t2 ? 'partial' : 'miss';
  const t2St   = g.t2  === answer.t2   ? 'correct' : g.t2 === answer.t1 ? 'partial' : 'miss';
  const evoSt  = g.evo === answer.evo  ? 'correct' : 'miss';
  const lenSt  = g[lf] === answer[lf]  ? 'correct' : 'miss';
  const fmCode = compareForm(g, answer);
  const fmSt   = fmCode === 'cc' ? 'correct' : fmCode === 'cp' ? 'partial' : 'miss';

  const genArr = genSt  === 'miss' ? (g.gen  < answer.gen  ? '▲' : '▼') : '';
  const evoArr = evoSt  === 'miss' ? (g.evo  < answer.evo  ? '▲' : '▼') : '';
  const lenArr = lenSt  === 'miss' ? (g[lf]  < answer[lf]  ? '▲' : '▼') : '';

  return (
    <div className="grow">
      {/* 포켓몬 */}
      <div className={`cell mon${isWin ? ' win' : ''}`}>
        <div className="sprite">
          <img
            src={spr(g.id)}
            alt={displayName(g, lang)}
            onError={e => {
              if (g.baseId && !e.target.dataset.fb) {
                e.target.dataset.fb = '1';
                e.target.src = spr(g.baseId);
              } else {
                e.target.style.display = 'none';
              }
            }}
          />
        </div>
        <div className="nm">{displayName(g, lang)}</div>
      </div>

      {/* 세대 */}
      <div className={`cell ${genSt}`}>
        <span className="cell-val">
          {isEn ? `Gen ${g.gen}` : `${g.gen}세대`}
          {genArr && <span className="arrow">{genArr}</span>}
        </span>
      </div>

      {/* 타입1 */}
      <div className={`cell ${t1St}`}>
        <TypeChip type={g.t1} lang={lang} />
      </div>

      {/* 타입2 */}
      <div className={`cell ${t2St}`}>
        <TypeChip type={g.t2} lang={lang} />
      </div>

      {/* 진화단계 */}
      <div className={`cell ${evoSt}`}>
        <span className="cell-val">
          {isEn ? `Stage ${g.evo}` : `${g.evo}단계`}
          {evoArr && <span className="arrow">{evoArr}</span>}
        </span>
      </div>

      {/* 글자수 */}
      <div className={`cell ${lenSt}`}>
        <span className="cell-val">
          {isEn ? `${g[lf]}ltrs` : `${g[lf]}글자`}
          {lenArr && <span className="arrow">{lenArr}</span>}
        </span>
      </div>

      {/* 폼 */}
      <div className={`cell ${fmSt}`}>
        <span className="cell-val">{formLabel(g.form, lang)}</span>
      </div>
    </div>
  );
}

export function GuessTable({ guesses, answer, lang = 'ko', showWinRow = false }) {
  if (!guesses.length && !showWinRow) return null;
  const isEn = lang === 'en';

  return (
    <div className="panel grid-card">
      <div className="ghead">
        <div>{isEn ? 'Pokémon' : '포켓몬'}</div>
        <div>{isEn ? 'Gen' : '세대'}</div>
        <div>{isEn ? 'Type 1' : '타입 1'}</div>
        <div>{isEn ? 'Type 2' : '타입 2'}</div>
        <div>{isEn ? 'Evo' : '진화단계'}</div>
        <div>{isEn ? 'Len' : '글자수'}</div>
        <div>{isEn ? 'Form' : '폼'}</div>
      </div>
      <div className="gbody">
        {showWinRow && (
          <GuessRow key="win-row" g={answer} answer={answer} lang={lang} isWin={true} />
        )}
        {[...guesses]
          .filter(g => !(showWinRow && g.id === answer?.id))
          .reverse()
          .map(g => (
            <GuessRow key={g.id} g={g} answer={answer} lang={lang} isWin={false} />
          ))}
      </div>
    </div>
  );
}
