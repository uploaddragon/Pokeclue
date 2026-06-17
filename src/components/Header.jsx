import { useState, useRef, useEffect } from 'react';
import { UserMenu } from './UserMenu.jsx';

export function Header({ page, onNav, gameTab, onGameTab, lang, onLangSet, user, authLoading, onLoginClick, onSignOut, onUpdateNickname, earnedIds, onEquipTitle }) {
  const isEn = lang === 'en';
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectLang(l) {
    onLangSet(l);
    setLangOpen(false);
  }

  return (
    <header>
      <div className="header-top">
        <div className="logo">
          <div className="logo-tiles">
            {'POKE'.split('').map((c, i) => (
              <div key={i} className="lt red">{c}</div>
            ))}
            {'CLUE'.split('').map((c, i) => (
              <div key={i} className="lt wht">{c}</div>
            ))}
          </div>
          <div className="logo-ball">
            <div className="pokeball">
              <div className="pokeball-top" />
              <div className="pokeball-mid">
                <div className="pokeball-btn" />
              </div>
              <div className="pokeball-bot" />
            </div>
          </div>
        </div>
        <div className="nav">
          <button className={`nav-btn${page === 'game' ? ' on' : ''}`} onClick={() => onNav('game')}>{isEn ? 'Game' : '게임'}</button>
          <button className={`nav-btn${page === 'dex' ? ' on' : ''}`} onClick={() => onNav('dex')}>{isEn ? 'Dex' : '도감'}</button>
          <button className={`nav-btn${page === 'titles' ? ' on' : ''}`} onClick={() => onNav('titles')}>{isEn ? 'Titles' : '칭호'}</button>
          <div className="nav-divider" />
          <div className="lang-wrap" ref={langRef}>
            <button className={`nav-btn lang-btn${langOpen ? ' on' : ''}`} onClick={() => setLangOpen(o => !o)}>
              {isEn ? 'Language' : '언어'} ▾
            </button>
            {langOpen && (
              <div className="lang-dropdown">
                <button className={`lang-option${lang === 'ko' ? ' active' : ''}`} onClick={() => selectLang('ko')}>한국어</button>
                <button className={`lang-option${lang === 'en' ? ' active' : ''}`} onClick={() => selectLang('en')}>English</button>
              </div>
            )}
          </div>
          {authLoading ? null : user
            ? <UserMenu user={user} onSignOut={onSignOut} onUpdateNickname={onUpdateNickname} lang={lang} earnedIds={earnedIds ?? []} onEquipTitle={onEquipTitle} />
            : <button className="nav-btn login-btn" onClick={onLoginClick}>{isEn ? 'Login' : '로그인'}</button>
          }
          <div className="nav-divider" />
          <a className="nav-social-btn" href="https://www.instagram.com/poke_clue_/" target="_blank" rel="noopener noreferrer" title="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a className="nav-social-btn" href="https://toon.at/donate/pokeclue" target="_blank" rel="noopener noreferrer" title={isEn ? 'Support' : '후원'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
          </a>
        </div>
      </div>
      {page === 'titles' ? (
        <div className="header-yellow-bar" />
      ) : page === 'game' ? (
        <div className="game-tabs">
          <div className="tab-inner">
            <button
              className={`game-tab-btn${gameTab === 'daily' ? ' on' : ''}`}
              onClick={() => onGameTab('daily')}
            >
              {isEn ? '📅 Daily' : '📅 데일리'}
            </button>
            <button
              className={`game-tab-btn${gameTab === 'endless' ? ' on' : ''}`}
              onClick={() => onGameTab('endless')}
            >
              {isEn ? '∞ Endless' : '∞ 엔드리스'}
            </button>
            <button
              className={`game-tab-btn${gameTab === 'battle' ? ' on' : ''}`}
              onClick={() => onGameTab('battle')}
            >
              {isEn ? '⚔ Battle' : '⚔ 대전'}
            </button>
          </div>
        </div>
      ) : (
        <div className="header-yellow-bar" />
      )}
    </header>
  );
}
