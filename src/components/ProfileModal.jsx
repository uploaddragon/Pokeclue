import { useState, useEffect } from 'react';
import { TITLES, TITLE_MAP, RARITY } from '../data/titles.js';
import { spr, sprShiny } from '../utils/sprite.js';
import { supabasePublic } from '../lib/supabase.js';
import DB from '../data/pokemon.js';

export function ProfileModal({ user, onClose, onSave, lang, earnedIds = [], onEquipTitle, dex = {}, onUpdateProfilePokemon }) {
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
  const [selectedProfile, setSelectedProfile] = useState(user.user_metadata?.profile_pokemon ?? null);

  const avatar = user.user_metadata?.avatar_url;
  const equippedTitle = user.user_metadata?.equipped_title ?? null;

  // 통계 로드
  const [stats, setStats] = useState(null);
  useEffect(() => {
    (async () => {
      const [dailyRes, challengeRes, battleRes] = await Promise.all([
        supabasePublic.from('daily_results').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('solved', true),
        supabasePublic.from('challenge_clears').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabasePublic.from('battle_stats').select('wins, losses').eq('user_id', user.id).maybeSingle(),
      ]);
      setStats({
        dailyClears: dailyRes.count ?? 0,
        challengeClears: challengeRes.count ?? 0,
        battleWins: battleRes.data?.wins ?? 0,
        battleLosses: battleRes.data?.losses ?? 0,
      });
    })();
  }, [user.id]);

  // 도감 등록된 포켓몬 목록
  const dexPokemon = Object.entries(dex).map(([id, entry]) => {
    const p = DB.find(p => String(p.id) === String(id));
    return p ? { ...p, dexEntry: entry } : null;
  }).filter(Boolean);

  async function handleSave() {
    const trimmed = nickname.trim();
    if (!trimmed) { setError(isEn ? 'Nickname cannot be empty.' : '닉네임을 입력해주세요.'); return; }
    if (trimmed.length > 20) { setError(isEn ? 'Max 20 characters.' : '최대 20자까지 입력 가능해요.'); return; }
    setSaving(true);
    setError('');
    const err = await onSave(trimmed);
    if (!err && onUpdateProfilePokemon) {
      const isShiny = selectedProfile?.endsWith('-shiny') ?? false;
      const pid = selectedProfile ? (isShiny ? selectedProfile.slice(0, -6) : selectedProfile) : null;
      await onUpdateProfilePokemon(pid, isShiny);
    }
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

  // 진행도 그룹별 현재 값
  const progressValues = stats ? {
    daily_clears: stats.dailyClears,
    battle_wins: stats.battleWins,
    battle_plays: stats.battleWins + stats.battleLosses,
    near_miss: user.user_metadata?.near_miss_count ?? 0,
  } : {};

  // 진행도가 있는 미획득 칭호
  const progressTitles = TITLES.filter(t =>
    t.progressGroup && t.threshold && !earnedIds.includes(t.id) && progressValues[t.progressGroup] !== undefined
  );

  return (
    <div className="auth-modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="profile-modal">
        <button className="auth-modal-close" onClick={onClose}>✕</button>
        <div className="profile-modal-title">{isEn ? 'Profile' : '프로필 설정'}</div>

        <div className="profile-avatar-wrap">
          {(() => {
            if (selectedProfile) {
              const isShiny = selectedProfile.endsWith('-shiny');
              const pid = isShiny ? selectedProfile.slice(0, -6) : selectedProfile;
              return <img src={isShiny ? sprShiny(pid) : spr(pid)} alt="" className="profile-avatar-img profile-avatar-poke" />;
            }
            return (
              <div className="profile-avatar-fallback profile-avatar-ball">
                <svg viewBox="0 0 40 40" width="56" height="56" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#fff" stroke="#222" strokeWidth="2"/>
                  <path d="M2 20 Q2 2 20 2 Q38 2 38 20Z" fill="#e63329"/>
                  <rect x="2" y="18.5" width="36" height="3" fill="#222"/>
                  <circle cx="20" cy="20" r="5.5" fill="#fff" stroke="#222" strokeWidth="2.5"/>
                  <circle cx="20" cy="20" r="2.5" fill="#ddd"/>
                </svg>
              </div>
            );
          })()}
        </div>

        <div className="profile-email">{user.email}</div>

        {/* ── 통계 섹션 ── */}
        <div className="profile-stats-section">
          <div className="profile-stats-grid">
            <div className="profile-stat-item">
              <div className="profile-stat-val">{Object.keys(dex).length}</div>
              <div className="profile-stat-label">{isEn ? 'Dex' : '도감'}</div>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-val">{stats?.dailyClears ?? '–'}</div>
              <div className="profile-stat-label">{isEn ? 'Daily' : '데일리'}</div>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-val">{stats?.challengeClears ?? '–'}</div>
              <div className="profile-stat-label">{isEn ? 'Challenge' : '챌린지'}</div>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-val">{stats ? `${stats.battleWins}${isEn ? 'W' : '승'} ${stats.battleLosses}${isEn ? 'L' : '패'}` : '–'}</div>
              <div className="profile-stat-label">{isEn ? 'Battle' : '대전'}</div>
            </div>
          </div>
          <div className="profile-stat-join">
            {isEn ? 'Joined ' : '가입일 '}
            {new Date(user.created_at).toLocaleDateString(isEn ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

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

        {/* ── 프로필 포켓몬 섹션 ── */}
        <div className="profile-titles-section">
          <div className="profile-titles-header">
            <span className="profile-label">{isEn ? 'Profile Pokémon' : '프로필 포켓몬'}</span>
            {selectedProfile && (
              <button className="profile-pokemon-clear" onClick={() => setSelectedProfile(null)}>
                {isEn ? 'Clear' : '해제'}
              </button>
            )}
          </div>
          {dexPokemon.length === 0 ? (
            <div className="profile-titles-empty">
              {isEn ? 'Clear the daily to register Pokémon to your Dex!' : '데일리를 클리어하면 도감에 포켓몬이 등록돼요!'}
            </div>
          ) : (
            <div className="profile-pokemon-grid">
              {dexPokemon.map(p => {
                const normalKey = String(p.id);
                const shinyKey = `${p.id}-shiny`;
                const hasShiny = p.dexEntry.shiny;
                return (
                  <div key={p.id} className="profile-pokemon-item">
                    <button
                      className={`profile-pokemon-btn${selectedProfile === normalKey ? ' selected' : ''}`}
                      onClick={() => setSelectedProfile(selectedProfile === normalKey ? null : normalKey)}
                      title={isEn ? p.en : p.ko}
                    >
                      <img src={spr(p.id)} alt={p.ko} className="profile-pokemon-spr" />
                    </button>
                    {hasShiny && (
                      <button
                        className={`profile-pokemon-btn shiny${selectedProfile === shinyKey ? ' selected' : ''}`}
                        onClick={() => setSelectedProfile(selectedProfile === shinyKey ? null : shinyKey)}
                        title={`✨ ${isEn ? p.en : p.ko}`}
                      >
                        <img src={sprShiny(p.id)} alt={`✨${p.ko}`} className="profile-pokemon-spr" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 칭호 섹션 ── */}
        <div className="profile-titles-section">
          <div className="profile-titles-header">
            <span className="profile-label">{isEn ? 'Titles' : '칭호'}</span>
            <span className="profile-titles-count">
              {earned.length} / {TITLES.length}
            </span>
          </div>

          {earned.length === 0 && progressTitles.length === 0 ? (
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
                {progressTitles.map(t => {
                  const style = RARITY[t.rarity];
                  const current = progressValues[t.progressGroup] ?? 0;
                  const pct = Math.min(100, Math.round((current / t.threshold) * 100));
                  return (
                    <div key={t.id} className="title-chip locked" style={{ '--tc': style.color, '--tbg': style.bg, '--tb': style.border }}
                      title={isEn ? t.desc_en : t.desc_ko}>
                      <span className="title-chip-emoji">{t.emoji}</span>
                      <span className="title-chip-name">{isEn ? t.en : t.ko}</span>
                      <div className="title-progress-wrap">
                        <div className="title-progress-bar" style={{ width: `${pct}%`, background: style.color }} />
                      </div>
                      <span className="title-progress-text">{current}/{t.threshold}</span>
                    </div>
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
