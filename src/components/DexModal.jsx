import { spr, padId } from '../utils/sprite.js';
import { TypeBadge } from './TypeBadge.jsx';
import { displayName } from '../utils/game.js';

export function DexModal({ pokemon, entry, onClose, lang = 'ko' }) {
  if (!pokemon || !entry) return null;
  const isEn = lang === 'en';
  const lf = isEn ? 'enLen' : 'len';

  return (
    <div className="dex-modal-bg show" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dex-modal">
        <button className="dex-modal-close" onClick={onClose}>✕</button>
        <div className="dex-modal-num">#{padId(pokemon.id)}</div>
        <img src={spr(pokemon.id)} alt={displayName(pokemon, lang)} />
        <div className="dex-modal-name">{displayName(pokemon, lang)}</div>
        <div className="dex-modal-row">
          <TypeBadge type={pokemon.t1} lang={lang} />
          {pokemon.t2 !== '없음' && <TypeBadge type={pokemon.t2} lang={lang} />}
        </div>
        <div className="dex-modal-row">
          <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: '8px', color: 'var(--muted)' }}>
            {isEn
              ? `Gen ${pokemon.gen} · Evo Stage ${pokemon.evo} · ${pokemon[lf]} letters`
              : `${pokemon.gen}세대 · 진화 ${pokemon.evo}단계 · ${pokemon[lf]}글자`}
          </span>
        </div>
        {entry.shiny && (
          <div className="dex-modal-shiny">{isEn ? '✨ Shiny caught!' : '✨ 이로치 포획!'}</div>
        )}
        <div className="dex-modal-cleared">
          {isEn
            ? `Unlocked: ${entry.date} / Cleared in ${entry.tries} tries`
            : `해금일: ${entry.date}  /  ${entry.tries}번 만에 클리어`}
        </div>
      </div>
    </div>
  );
}
