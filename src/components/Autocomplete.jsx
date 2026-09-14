import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import DB from '../data/pokemon.js';
import { spr, padId } from '../utils/sprite.js';
import { TypeBadge } from './TypeBadge.jsx';
import { TICON } from '../data/types.js';
import { displayName } from '../utils/game.js';

// 이스터에그: 특정 단어 입력 시 몰래 다른 포켓몬 제출 (추천엔 표시 안 됨)
const EASTER_EGGS = {
  '병1신': 401, // 귀뚤뚜기
  '노목이': 225, // 딜리버드
};

export const Autocomplete = forwardRef(function Autocomplete({ onSubmit, disabled, lang = 'ko', onEasterEgg }, ref) {
  const [value, setValue] = useState('');
  const [matches, setMatches] = useState([]);
  const [sel, setSel] = useState(-1);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // 내 차례가 되어 입력창이 활성화되면 클릭 없이 바로 타이핑할 수 있도록 자동 포커스
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  function search(input) {
    const v = input.trim().toLowerCase();
    if (!v) return [];
    // 정확히 이름이 일치하는 포켓몬을 최우선으로 — 짧은 이름(예: "라이츄")이
    // 새로 추가된 폼("메가라이츄X" 등)의 부분 문자열에 걸려 엔터 시
    // 엉뚱한 포켓몬이 제출되는 것을 방지
    return DB
      .filter(p => {
        const base = lang === 'en' ? (p.en || '').toLowerCase() : p.ko.toLowerCase();
        const full = displayName(p, lang).toLowerCase();
        return base.includes(v) || full.includes(v);
      })
      .sort((a, b) => {
        const aBase = lang === 'en' ? (a.en || '').toLowerCase() : a.ko.toLowerCase();
        const bBase = lang === 'en' ? (b.en || '').toLowerCase() : b.ko.toLowerCase();
        const aFull = displayName(a, lang).toLowerCase();
        const bFull = displayName(b, lang).toLowerCase();
        const aExact = aBase === v || aFull === v;
        const bExact = bBase === v || bFull === v;
        if (aExact !== bExact) return aExact ? -1 : 1;
        return aFull.length - bFull.length;
      })
      .slice(0, 8);
  }

  function handleInput(e) {
    const v = e.target.value;
    setValue(v);
    setSel(-1);
    // 이스터에그 단어는 추천 목록에 표시하지 않음
    if (EASTER_EGGS[v.trim()]) {
      setMatches([]);
    } else {
      setMatches(search(v, lang));
    }
  }

  function pick(p, isEgg = false) {
    onSubmit(p.id);
    if (isEgg) onEasterEgg?.();
    setValue('');
    setMatches([]);
    setSel(-1);
  }

  function trySubmit() {
    // 이스터에그 확인
    const eggId = EASTER_EGGS[value.trim()];
    if (eggId) {
      const eggPoke = DB.find(p => p.id === eggId);
      if (eggPoke) { pick(eggPoke, true); return; }
    }
    if (sel >= 0 && matches[sel]) { pick(matches[sel]); }
    else if (matches.length > 0)  { pick(matches[0]); }
  }

  useImperativeHandle(ref, () => ({ submit: trySubmit }), [matches, sel]);

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel(s => Math.min(s + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      // 한글 입력기(IME) 조합 중 마지막 글자를 확정하는 엔터는 무시
      // (그렇지 않으면 아직 완성되지 않은 글자로 검색되어 매칭이 안 되고,
      //  결과적으로 정답을 입력해도 아무 반응이 없는 것처럼 보임)
      if (e.nativeEvent?.isComposing || e.keyCode === 229) return;
      const eggId = EASTER_EGGS[value.trim()];
      if (eggId) {
        const eggPoke = DB.find(p => p.id === eggId);
        if (eggPoke) { pick(eggPoke, true); return; }
      }
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
        ref={inputRef}
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
});
