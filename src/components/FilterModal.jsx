import { spr, padId } from '../utils/sprite.js';
import { computeFilter, displayName } from '../utils/game.js';

export function FilterModal({ open, answer, guesses, onClose, onPick, lang = 'ko' }) {
  if (!open) return null;
  const { conds, filtered } = computeFilter(answer, guesses, lang);
  const isEn = lang === 'en';

  return (
    <div className="fp-modal-bg show" id="fp-modal-bg">
      <div className="fp-modal">
        <div className="fp-modal-head">
          <div className="fp-modal-head-left">
            <div className="fp-modal-title">{isEn ? 'Hint · Filter · Dex' : '힌트   필터   도감'}</div>
            <div className="fp-modal-sub">
              <span className="warn">▲</span> {isEn ? 'Opening filter fixes shiny rate at ' : '필터 도감 열람 시 이로치 확률 '}<span className="warn">1%</span>{isEn ? '' : ' 고정'}
            </div>
          </div>
          <div className="fp-modal-right">
            <span className="fp-modal-count">{isEn ? `${filtered.length} candidates` : `후보 ${filtered.length}마리`}</span>
            <button className="fp-close-btn" onClick={onClose}>{isEn ? 'Close' : '닫기'}</button>
          </div>
        </div>

        <div className={`fp-tags-bar${conds.length === 0 ? ' empty-tags' : ''}`}>
          {conds.length === 0
            ? (isEn ? 'No guesses yet. Try entering a Pokémon!' : '아직 추측이 없어요. 포켓몬을 입력해보세요!')
            : conds.map((c, i) => (
              <span key={i} className={`ctag ${c.cls}`}>{c.text}</span>
            ))}
        </div>

        <div className="fp-grid">
          {filtered.length === 0
            ? <div className="fp-empty">{isEn ? 'No Pokémon match the conditions!' : '조건에 맞는 포켓몬이 없어요!'}</div>
            : filtered.map(p => (
              <div key={p.id} className="fp-card" onClick={() => onPick(p.id)}>
                <img src={spr(p.id)} alt={displayName(p, lang)} onError={e => e.target.style.opacity = '0.3'} />
                <div className="fp-card-name">{displayName(p, lang)}</div>
                <div className="fp-card-num">#{padId(p.baseId ?? p.id)}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
