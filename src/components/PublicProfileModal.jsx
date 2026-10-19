import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabasePublic } from '../lib/supabase.js';
import { spr, sprShiny } from '../utils/sprite.js';
import { TITLES, TITLE_MAP, RARITY } from '../data/titles.js';

const CACHE_MS = 60_000;
const cache = new Map(); // uid -> { at, data }
const MYSTERY_VISIBLE = new Set(['hello']); // 히든 칭호는 남의 프로필에서 '???' 로 가린다 (내 칭호 페이지 규칙과 동일)

async function loadProfile(uid) {
  const hit = cache.get(uid);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;
  const { data, error } = await supabasePublic.rpc('get_public_profile', { p_user: uid });
  if (error) throw error;
  cache.set(uid, { at: Date.now(), data: data ?? null });
  return data ?? null;
}

/** 랭킹 행의 닉네임. 로그인 유저(userId 있음)면 눌러서 프로필을 열 수 있다. 익명이면 그냥 텍스트. */
export function PlayerLink({ userId, nickname, onOpen, lang = 'ko' }) {
  if (!userId) return <>{nickname}</>;
  return (
    <button
      type="button"
      className="pp-name-btn"
      title={lang === 'en' ? 'View profile' : '프로필 보기'}
      onClick={e => { e.stopPropagation(); onOpen({ uid: userId, nickname }); }}
    >
      {nickname}
    </button>
  );
}

function Pokeball() {
  return (
    <svg viewBox="0 0 40 40" width="56" height="56" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#fff" stroke="#222" strokeWidth="2" />
      <path d="M2 20 Q2 2 20 2 Q38 2 38 20Z" fill="#e63329" />
      <rect x="2" y="18.5" width="36" height="3" fill="#222" />
      <circle cx="20" cy="20" r="5.5" fill="#fff" stroke="#222" strokeWidth="2.5" />
      <circle cx="20" cy="20" r="2.5" fill="#ddd" />
    </svg>
  );
}

export function PublicProfileModal({ target, onClose, lang = 'ko' }) {
  const isEn = lang === 'en';
  const uid = target?.uid;
  const [state, setState] = useState({ status: 'loading', data: null });
  const [imgError, setImgError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setState({ status: 'loading', data: null });
    setImgError(false);
    loadProfile(uid)
      .then(data => { if (!cancelled) setState({ status: data ? 'ready' : 'missing', data }); })
      .catch(() => { if (!cancelled) setState({ status: 'error', data: null }); });
    return () => { cancelled = true; };
  }, [uid, attempt]);

  useEffect(() => {
    if (!uid) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [uid, onClose]);

  if (!uid) return null;

  const p = state.data;
  // 서버가 돌려준 값은 사용자가 조작할 수 있으므로 우리가 아는 칭호만 표시한다
  const earned = p ? [...new Set(p.earned_titles)].map(id => TITLE_MAP[id]).filter(Boolean) : [];
  const equipped = p?.equipped_title ? TITLE_MAP[p.equipped_title] : null;
  const name = target.nickname || p?.nickname || (isEn ? 'Trainer' : '트레이너');

  const pokeId = p?.profile_pokemon;
  const isShiny = !!pokeId?.endsWith('-shiny');
  const pid = pokeId ? (isShiny ? pokeId.slice(0, -6) : pokeId) : null;
  const sprSrc = pid ? (isShiny ? sprShiny(pid) : spr(pid)) : null;

  const modal = (
    <div className="pp-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="profile-modal pp-modal" role="dialog" aria-label={isEn ? 'Player profile' : '플레이어 프로필'}>
        <button className="auth-modal-close" onClick={onClose}>✕</button>
        <div className="profile-modal-title">{isEn ? 'Player Profile' : '플레이어 프로필'}</div>

        <div className="profile-avatar-wrap">
          {sprSrc && !imgError
            ? <img src={sprSrc} alt="" className="profile-avatar-img profile-avatar-poke" onError={() => setImgError(true)} />
            : <div className="profile-avatar-fallback profile-avatar-ball"><Pokeball /></div>}
        </div>

        <div className="pp-name">{name}</div>
        {equipped && (() => {
          const s = RARITY[equipped.rarity];
          return (
            <span className="rank-title-badge" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
              {equipped.emoji} {isEn ? equipped.en : equipped.ko}
            </span>
          );
        })()}

        {state.status === 'loading' && <div className="pp-msg">{isEn ? 'Loading…' : '불러오는 중…'}</div>}
        {state.status === 'missing' && <div className="pp-msg">{isEn ? 'This player could not be found.' : '플레이어 정보를 찾을 수 없어요.'}</div>}
        {state.status === 'error' && (
          <div className="pp-msg">
            {isEn ? "Couldn't load this profile." : '프로필을 불러오지 못했어요.'}
            <div><button className="btn go" style={{ marginTop: 12 }} onClick={() => setAttempt(n => n + 1)}>{isEn ? 'Retry' : '다시 시도'}</button></div>
          </div>
        )}

        {state.status === 'ready' && p && (
          <>
            <div className="profile-stats-section" style={{ marginTop: 18 }}>
              <div className="profile-stats-grid">
                <div className="profile-stat-item">
                  <div className="profile-stat-val">{p.dex_count}</div>
                  <div className="profile-stat-label">{isEn ? 'Dex' : '도감'}</div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-val">{p.daily_clears}</div>
                  <div className="profile-stat-label">{isEn ? 'Daily' : '데일리'}</div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-val">{p.challenge_clears}</div>
                  <div className="profile-stat-label">{isEn ? 'Challenge' : '챌린지'}</div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-val">{p.battle_wins}{isEn ? 'W' : '승'} {p.battle_losses}{isEn ? 'L' : '패'}</div>
                  <div className="profile-stat-label">{isEn ? 'Battle' : '대전'}</div>
                </div>
              </div>
              <div className="profile-stat-join">
                {p.shiny_count > 0 && <>✨ {isEn ? `${p.shiny_count} shiny` : `이로치 ${p.shiny_count}마리`} · </>}
                {isEn ? 'Joined ' : '가입일 '}
                {new Date(p.joined + 'T00:00:00').toLocaleDateString(isEn ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div className="profile-titles-section">
              <div className="profile-titles-header">
                <span className="profile-label">{isEn ? 'Titles' : '칭호'}</span>
                <span className="profile-titles-count">{earned.length} / {TITLES.length}</span>
              </div>
              {earned.length === 0 ? (
                <div className="profile-titles-empty">{isEn ? 'No titles yet.' : '아직 획득한 칭호가 없어요.'}</div>
              ) : (
                <div className="profile-titles-scroll">
                  <div className="profile-titles-grid">
                    {earned.map(t => {
                      const s = RARITY[t.rarity];
                      const hidden = t.rarity === 'mystery' && !MYSTERY_VISIBLE.has(t.id);
                      return (
                        <span
                          key={t.id}
                          className={`title-chip pp-chip${t.id === p.equipped_title ? ' equipped' : ''}`}
                          style={{ '--tc': s.color, '--tbg': s.bg, '--tb': s.border }}
                          title={hidden ? '???' : (isEn ? t.desc_en : t.desc_ko)}
                        >
                          <span className="title-chip-emoji">{hidden ? '❓' : t.emoji}</span>
                          <span className="title-chip-name">{hidden ? '???' : (isEn ? t.en : t.ko)}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}
