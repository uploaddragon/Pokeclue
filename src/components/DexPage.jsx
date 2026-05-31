import { useState } from 'react';
import DB from '../data/pokemon.js';
import { spr, padId } from '../utils/sprite.js';
import { DexModal } from './DexModal.jsx';

export function DexPage({ dex, lang = 'ko' }) {
  const [filter, setFilter] = useState('all');
  const [modalId, setModalId] = useState(null);
  const isEn = lang === 'en';

  const total = DB.length;
  const unlockedCount = Object.keys(dex).length;

  let list = DB;
  if (filter === 'unlocked') list = DB.filter(p => dex[p.id]);
  if (filter === 'locked') list = DB.filter(p => !dex[p.id]);

  const modalPoke = modalId ? DB.find(p => p.id === modalId) : null;
  const modalEntry = modalId ? dex[modalId] : null;

  return (
    <main>
      <div className="dex-header">
        <div className="dex-breadcrumb">{isEn ? 'Pokémon Dex' : '포켓몬 도감'}</div>
        <div className="dex-total">{unlockedCount}/{total}</div>
      </div>

      <div className="dex-filters">
        {['all', 'unlocked', 'locked'].map(f => (
          <button
            key={f}
            className={`dex-filter-btn${filter === f ? ' on' : ''}`}
            onClick={() => setFilter(f)}
          >
            {isEn
              ? (f === 'all' ? 'All' : f === 'unlocked' ? 'Collected' : 'Missing')
              : (f === 'all' ? '전체' : f === 'unlocked' ? '수집완료' : '미수집')}
          </button>
        ))}
      </div>

      <div className="dex-grid">
        {list.map(p => {
          const u = dex[p.id];
          const name = isEn ? (p.en || p.ko) : p.ko;
          return u ? (
            <div key={p.id} className="dex-card unlocked" onClick={() => setModalId(p.id)}>
              {u.shiny && <div className="shiny-star">✨</div>}
              <img src={spr(p.id)} alt={name} onError={e => e.target.style.opacity = '0.3'} />
              <div className="dex-card-num">#{padId(p.id)}</div>
              <div className="dex-card-name">{name}</div>
            </div>
          ) : (
            <div key={p.id} className="dex-card">
              <img className="silhouette" src={spr(p.id)} alt="???" />
              <div className="dex-card-num">#{padId(p.id)}</div>
              <div className="dex-card-name hidden">???</div>
            </div>
          );
        })}
      </div>

      {modalPoke && modalEntry && (
        <DexModal
          pokemon={modalPoke}
          entry={modalEntry}
          onClose={() => setModalId(null)}
          lang={lang}
        />
      )}
    </main>
  );
}
