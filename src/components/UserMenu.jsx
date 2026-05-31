import { useState, useRef, useEffect } from 'react';

export function UserMenu({ user, onSignOut, lang }) {
  const isEn = lang === 'en';
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const avatar = user.user_metadata?.avatar_url;
  const name   = user.user_metadata?.full_name || user.email;

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
          <button className="user-dropdown-btn signout" onClick={() => { setOpen(false); onSignOut(); }}>
            {isEn ? 'Sign out' : '로그아웃'}
          </button>
        </div>
      )}
    </div>
  );
}
