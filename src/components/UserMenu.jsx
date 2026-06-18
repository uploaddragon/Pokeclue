import { useState, useRef, useEffect } from 'react';
import { ProfileModal } from './ProfileModal.jsx';

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

  const avatar = user.user_metadata?.avatar_url;
  const name =
    user.user_metadata?.pokeclue_nickname ||
    user.user_metadata?.full_name ||
    user.email;

  return (
    <div className="user-menu-wrap" ref={ref}>
      <button className="user-avatar-btn" onClick={() => setOpen(o => !o)}>
        {avatar
          ? <img src={avatar} alt={name} className="user-avatar-img" />
          : <span className="user-avatar-fallback">{name[0].toUpperCase()}</span>}
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-info">
            {avatar && <img src={avatar} alt={name} className="user-dropdown-avatar" />}
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
