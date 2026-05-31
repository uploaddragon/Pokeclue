import { useState, useRef, useEffect } from 'react';
import { UserMenu } from './UserMenu.jsx';

export function Header({ page, onNav, gameTab, onGameTab, lang, onLangSet, user, authLoading, onLoginClick, onSignOut, onUpdateNickname }) {
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
            ? <UserMenu user={user} onSignOut={onSignOut} onUpdateNickname={onUpdateNickname} lang={lang} />
            : <button className="nav-btn login-btn" onClick={onLoginClick}>{isEn ? 'Login' : '로그인'}</button>
          }
        </div>
      </div>
      {page === 'game' ? (
        <div className="game-tabs">
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
        </div>
      ) : (
        <div className="header-yellow-bar" />
      )}
    </header>
  );
}
