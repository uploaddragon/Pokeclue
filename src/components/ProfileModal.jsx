import { useState } from 'react';
import { TITLES, TITLE_MAP, RARITY } from '../data/titles.js';

export function ProfileModal({ user, onClose, onSave, lang, earnedIds = [], onEquipTitle }) {
  const isEn = lang === 'en';
  const currentNickname =
    user.user_metadata?.pokeclue_nickname ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] || '';

  const [nickname, setNickname] = useState(currentNickname);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [equipping, setEquipping] = useState(false);

  const avatar = user.user_metadata?.avatar_url;
  const equippedTitle = user.user_metadata?.equipped_title ?? null;

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

  async function handleEquip(titleId) {
    if (!onEquipTitle || equipping) return;
    setEquipping(true);
    // 이미 장착된 칭호 클릭 → 해제
    const next = equippedTitle === titleId ? null : titleId;
    await onEquipTitle(next);
    setEquipping(false);
  }

  // 보유 칭호 (정의된 순서 유지)
  const earned = TITLES.filter(t => earnedIds.includes(t.id));

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

        {/* ── 칭호 섹션 ── */}
        <div className="profile-titles-section">
          <div className="profile-titles-header">
            <span className="profile-label">{isEn ? 'Titles' : '칭호'}</span>
            <span className="profile-titles-count">
              {earned.length} / {TITLES.length}
            </span>
          </div>

          {earned.length === 0 ? (
            <div className="profile-titles-empty">
              {isEn ? 'No titles yet. Clear the daily to earn some!' : '아직 획득한 칭호가 없어요. 데일리를 클리어해보세요!'}
            </div>
          ) : (
            <div className="profile-titles-scroll">
              <div className="profile-titles-grid">
                {earned.map(t => {
                  const style = RARITY[t.rarity];
                  const isEquipped = equippedTitle === t.id;
                  return (
                    <button
                      key={t.id}
                      className={`title-chip${isEquipped ? ' equipped' : ''}`}
                      style={{
                        '--tc': style.color,
                        '--tbg': style.bg,
                        '--tb': style.border,
                      }}
                      onClick={() => handleEquip(t.id)}
                      title={isEn ? t.desc_en : t.desc_ko}
                      disabled={equipping}
                    >
                      <span className="title-chip-emoji">{t.emoji}</span>
                      <span className="title-chip-name">{isEn ? t.en : t.ko}</span>
                      {isEquipped && <span className="title-chip-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? (isEn ? 'Saving...' : '저장 중...') : (isEn ? 'Save' : '저장하기')}
        </button>
      </div>
    </div>
  );
}
