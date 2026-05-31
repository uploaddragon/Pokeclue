import { useState, useRef, useEffect } from 'react';
import DB from '../data/pokemon.js';
import { spr, padId } from '../utils/sprite.js';
import { TypeBadge } from './TypeBadge.jsx';
import { TICON } from '../data/types.js';
import { displayName } from '../utils/game.js';

export function Autocomplete({ onSubmit, disabled, lang = 'ko' }) {
  const [value, setValue] = useState('');
  const [matches, setMatches] = useState([]);
  const [sel, setSel] = useState(-1);
  const wrapRef = useRef(null);

  function search(input) {
    const v = input.trim().toLowerCase();
    if (!v) return [];
    return DB.filter(p => {
      const base = lang === 'en' ? (p.en || '').toLowerCase() : p.ko.toLowerCase();
      const full = displayName(p, lang).toLowerCase();
      return base.includes(v) || full.includes(v);
    }).slice(0, 8);
  }

  function handleInput(e) {
    const v = e.target.value;
    setValue(v);
    setSel(-1);
    setMatches(search(v, lang));
  }

  function pick(p) {
    onSubmit(p.id);
    setValue('');
    setMatches([]);
    setSel(-1);
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel(s => Math.min(s + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      if (sel >= 0 && matches[sel]) {
        pick(matches[sel]);
      } else if (matches.length > 0) {
        pick(matches[0]);
      }
    } else if (e.key === 'Escape') {
      setMatches([]);
    }
  }

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMatches([]);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="search-wrap" ref={wrapRef}>
      <input
        id="inp"
        type="text"
        placeholder={lang === 'en' ? 'Enter Pokémon name...' : '포켓몬 이름 입력...'}
        autoComplete="off"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      {matches.length > 0 && (
        <div className="ac" style={{ display: 'block' }}>
          {matches.map((p, i) => (
            <div
              key={p.id}
              className={`ac-item${i === sel ? ' sel' : ''}`}
              onClick={() => pick(p)}
            >
              <div className="ac-img">
                <img
                  src={spr(p.id)}
                  alt={displayName(p)}
                  onError={e => { e.target.parentNode.innerHTML = `<span style="font-size:26px">${TICON[p.t1] || '?'}</span>`; }}
                />
              </div>
              <div className="ac-info">
                <span className="ac-num">#{padId(p.baseId ?? p.id)}</span>
                <span className="ac-name">{displayName(p, lang)}</span>
                <div className="ac-types">
                  <TypeBadge type={p.t1} mini lang={lang} />
                  {p.t2 !== '없음' && <TypeBadge type={p.t2} mini lang={lang} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
