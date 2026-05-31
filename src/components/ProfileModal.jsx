import { useState } from 'react';

export function ProfileModal({ user, onClose, onSave, lang }) {
  const isEn = lang === 'en';
  const currentNickname =
    user.user_metadata?.pokeclue_nickname ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] || '';

  const [nickname, setNickname] = useState(currentNickname);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const avatar = user.user_metadata?.avatar_url;

  async function handleSave() {
    const trimmed = nickname.trim();
    if (!trimmed) { setError(isEn ? 'Nickname cannot be empty.' : '닉네임을 입력해주세요.'); return; }
    if (trimmed.length > 20) { setError(isEn ? 'Max 20 characters.' : '최대 20자까지 입력 가능해요.'); return; }
    setSaving(true);
    setError('');
    const err = await onSave(trimmed);
    setSaving(false);
    if (err) { setError(isEn ? 'Failed to save.' : '저장에 실패했어요.'); return; }
    onClose();
  }

  return (
    <div className="auth-modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="profile-modal">
        <button className="auth-modal-close" onClick={onClose}>✕</button>
        <div className="profile-modal-title">{isEn ? 'Profile' : '프로필 설정'}</div>

        <div className="profile-avatar-wrap">
          {avatar
            ? <img src={avatar} alt="" className="profile-avatar-img" />
            : <div className="profile-avatar-fallback">{currentNickname[0]?.toUpperCase()}</div>}
        </div>

        <div className="profile-email">{user.email}</div>

        <div className="profile-field">
          <label className="profile-label">{isEn ? 'Nickname' : '닉네임'}</label>
          <input
            className="profile-input"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            maxLength={20}
            placeholder={isEn ? 'Enter nickname' : '닉네임 입력'}
          />
          {error && <div className="profile-error">{error}</div>}
        </div>

        <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? (isEn ? 'Saving...' : '저장 중...') : (isEn ? 'Save' : '저장하기')}
        </button>
      </div>
    </div>
  );
}
