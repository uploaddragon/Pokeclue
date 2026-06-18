import { useState, useRef, useEffect } from 'react';
import { ProfileModal } from './ProfileModal.jsx';
import { spr, sprShiny } from '../utils/sprite.js';

export function UserMenu({ user, onSignOut, onUpdateNickname, lang, earnedIds, onEquipTitle, dex, onUpdateProfilePokemon }) {
  const isEn = lang === 'en';
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const profilePokemon = user.user_metadata?.profile_pokemon ?? null;
  const name =
    user.user_metadata?.pokeclue_nickname ||
    user.user_metadata?.full_name ||
    user.email;

  const avatarSrc = (() => {
    if (profilePokemon) {
      const isShiny = profilePokemon.endsWith('-shiny');
      const pid = isShiny ? profilePokemon.slice(0, -6) : profilePokemon;
      return { type: 'poke', src: isShiny ? sprShiny(pid) : spr(pid) };
    }
    return { type: 'ball' };
  })();

  return (
    <div className="user-menu-wrap" ref={ref}>
      <button className="user-avatar-btn" onClick={() => setOpen(o => !o)}>
        {avatarSrc.type === 'poke'
          ? <img src={avatarSrc.src} alt={name} className="user-avatar-img user-avatar-poke" />
          : <span className="user-avatar-ball">
              <svg viewBox="0 0 40 40" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#fff" stroke="#222" strokeWidth="2"/>
                <path d="M2 20 Q2 2 20 2 Q38 2 38 20Z" fill="#e63329"/>
                <rect x="2" y="18.5" width="36" height="3" fill="#222"/>
                <circle cx="20" cy="20" r="5.5" fill="#fff" stroke="#222" strokeWidth="2.5"/>
                <circle cx="20" cy="20" r="2.5" fill="#ddd"/>
              </svg>
            </span>}
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-info">
            {avatarSrc.type === 'poke' && <img src={avatarSrc.src} alt={name} className="user-dropdown-avatar user-avatar-poke" />}
            <div>
              <div className="user-dropdown-name">{name}</div>
              <div className="user-dropdown-email">{user.email}</div>
            </div>
          </div>
          <div className="user-dropdown-divider" />
          <button className="user-dropdown-btn" onClick={() => { setOpen(false); setProfileOpen(true); }}>
            {isEn ? '⚙ Profile' : '⚙ 프로필 설정'}
          </button>
          <div className="user-dropdown-divider" />
          <button className="user-dropdown-btn signout" onClick={() => { setOpen(false); onSignOut(); }}>
            {isEn ? 'Sign out' : '로그아웃'}
          </button>
        </div>
      )}

      {profileOpen && (
        <ProfileModal
          user={user}
          lang={lang}
          onClose={() => setProfileOpen(false)}
          onSave={onUpdateNickname}
          earnedIds={earnedIds ?? []}
          onEquipTitle={onEquipTitle}
          dex={dex ?? {}}
          onUpdateProfilePokemon={onUpdateProfilePokemon}
        />
      )}
    </div>
  );
}
