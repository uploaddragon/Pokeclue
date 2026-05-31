import { spr } from '../utils/sprite.js';
import { TypeBadge } from './TypeBadge.jsx';
import { arrow, compareForm, formLabel, displayName } from '../utils/game.js';

export function GuessTable({ guesses, answer, lang = 'ko' }) {
  if (!guesses.length) return null;

  const isEn = lang === 'en';
  const lf = isEn ? 'enLen' : 'len';

  // 추측이 있으면 항상 폼 컬럼 표시 (기본폼도 힌트)
  const showForm = guesses.length > 0;

  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>{isEn ? 'Pokémon' : '포켓몬'}</th>
            <th>{isEn ? 'Gen' : '세대'}</th>
            <th>{isEn ? 'Type 1' : '타입 1'}</th>
            <th>{isEn ? 'Type 2' : '타입 2'}</th>
            <th>{isEn ? 'Evo' : '진화단계'}</th>
            <th>{isEn ? 'Length' : '글자수'}</th>
            {showForm && <th>{isEn ? 'Form' : '폼'}</th>}
          </tr>
        </thead>
        <tbody>
          {[...guesses].reverse().map(g => {
            return (
              <tr key={g.id}>
                <td>
                  <div className="pk">
                    <img
                      src={spr(g.id)}
                      alt={displayName(g, lang)}
                      onError={e => {
                        if (g.baseId && !e.target.dataset.fallback) {
                          e.target.dataset.fallback = '1';
                          e.target.src = spr(g.baseId);
                        } else {
                          e.target.style.display = 'none';
                        }
                      }}
                    />
                    <span>{displayName(g, lang)}</span>
                  </div>
                </td>
                <td className={g.gen === answer.gen ? 'cc' : 'cw'}>
                  {isEn ? `Gen ${g.gen}` : `${g.gen}세대`}{arrow(g.gen, answer.gen)}
                </td>
                <td className={g.t1 === answer.t1 ? 'cc' : g.t1 === answer.t2 ? 'cp' : 'cw'}>
                  <TypeBadge type={g.t1} lang={lang} />
                </td>
                <td className={g.t2 === answer.t2 ? 'cc' : g.t2 === answer.t1 ? 'cp' : 'cw'}>
                  <TypeBadge type={g.t2} lang={lang} />
                </td>
                <td className={g.evo === answer.evo ? 'cc' : 'cw'}>
                  {isEn ? `Stage ${g.evo}` : `${g.evo}단계`}{arrow(g.evo, answer.evo)}
                </td>
                <td className={g[lf] === answer[lf] ? 'cc' : 'cw'}>
                  {isEn ? `${g[lf]} letters` : `${g[lf]}글자`}{arrow(g[lf], answer[lf])}
                </td>
                {showForm && (
                  <td className={compareForm(g, answer)}>
                    {formLabel(g.form)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
