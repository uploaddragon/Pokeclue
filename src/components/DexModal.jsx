import { useState } from 'react';
import { spr, sprShiny, padId } from '../utils/sprite.js';
import { TypeBadge } from './TypeBadge.jsx';
import { displayName } from '../utils/game.js';

export function DexModal({ pokemon, entry, onClose, lang = 'ko' }) {
  const [showShiny, setShowShiny] = useState(false);
  if (!pokemon || !entry) return null;
  const isEn = lang === 'en';
  const lf = isEn ? 'enLen' : 'len';
  const name = displayName(pokemon, lang);

  return (
    <div className="dex-modal-bg show" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dex-modal">
        <button className="dex-modal-close" onClick={onClose}>✕</button>
        <div className="dex-modal-num">#{padId(pokemon.id)}</div>

        {entry.shiny && (
          <div className="dex-modal-toggle">
            <button
              className={`dex-toggle-btn${!showShiny ? ' active' : ''}`}
              onClick={() => setShowShiny(false)}
            >
              {isEn ? 'Normal' : '기본'}
            </button>
            <button
              className={`dex-toggle-btn shiny${showShiny ? ' active' : ''}`}
              onClick={() => setShowShiny(true)}
            >
              ✨ {isEn ? 'Shiny' : '색이 다른'}
            </button>
          </div>
        )}

        <img
          src={showShiny ? sprShiny(pokemon.id) : spr(pokemon.id)}
          alt={name}
          className={showShiny ? 'shiny-sprite' : ''}
        />

        <div className="dex-modal-name">{name}</div>
        <div className="dex-modal-row">
          <TypeBadge type={pokemon.t1} lang={lang} />
          {pokemon.t2 !== '없음' && <TypeBadge type={pokemon.t2} lang={lang} />}
        </div>
        <div className="dex-modal-info">
          {isEn
            ? `Gen ${pokemon.gen} · Evo ${pokemon.evo} · ${pokemon[lf]} letters`
            : `${pokemon.gen}세대 · 진화 ${pokemon.evo}단계 · ${pokemon[lf]}글자`}
        </div>
        <div className="dex-modal-cleared">
          {isEn
            ? `Unlocked: ${entry.date} / ${entry.tries} tries`
            : `해금일: ${entry.date}  /  ${entry.tries}번 만에 클리어`}
        </div>
      </div>
    </div>
  );
}
