import { useEffect, useState } from 'react';
import { supabasePublic } from '../lib/supabase.js';
import { getTodayStr } from '../utils/game.js';
import { TITLE_MAP, RARITY } from '../data/titles.js';
import { spr, sprShiny } from '../utils/sprite.js';

const MEDAL = ['🥇', '🥈', '🥉'];

function TitleBadge({ titleId }) {
  const t = TITLE_MAP[titleId];
  if (!t) return null;
  const s = RARITY[t.rarity];
  return (
    <span className="rank-title-badge" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
      {t.emoji} {t.ko}
    </span>
  );
}

function Pokeball() {
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#fff" stroke="#222" strokeWidth="2"/>
      <path d="M2 20 Q2 2 20 2 Q38 2 38 20Z" fill="#e63329"/>
      <rect x="2" y="18.5" width="36" height="3" fill="#222"/>
      <circle cx="20" cy="20" r="5.5" fill="#fff" stroke="#222" strokeWidth="2.5"/>
      <circle cx="20" cy="20" r="2.5" fill="#ddd"/>
    </svg>
  );
}

function RankAvatar({ rank, profilePokemon }) {
  const medal = rank <= 3 ? MEDAL[rank - 1] : null;
  const [imgError, setImgError] = useState(false);
  const sprSrc = profilePokemon
    ? (profilePokemon.endsWith('-shiny')
        ? sprShiny(profilePokemon.slice(0, -6))
        : spr(profilePokemon))
    : null;

  return (
    <div className="rank-avatar-wrap">
      <div className={`rank-avatar-circle rank${rank <= 3 ? rank : ''}`}>
        {sprSrc && !imgError
          ? <img src={sprSrc} className="rank-avatar-spr" alt="" onError={() => setImgError(true)} />
          : <Pokeball />}
      </div>
      {medal
        ? <span className="rank-avatar-medal">{medal}</span>
        : <span className="rank-avatar-num">#{rank}</span>}
    </div>
  );
}

export function RankingModal({ onClose, user, lang }) {
  const isEn = lang === 'en';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      const { data, error } = await supabasePublic
        .from('daily_results')
        .select('id, user_id, anon_id, tries, solved, used_filter, nickname, equipped_title, profile_pokemon')
        .eq('date', getTodayStr())
        .eq('solved', true)
        .order('tries', { ascending: true })
        .limit(50);

      if (error) { console.error('ranking fetch error', error); }
      setRows(data ?? []);
      setLoading(false);
    }
    fetchRanking();
  }, []);

  const total = rows.length;
  const avg = total > 0 ? (rows.reduce((s, r) => s + r.tries, 0) / total).toFixed(1) : '-';
  const anonId = (() => {
    try { return JSON.parse(localStorage.getItem('pokeclue_anon') || 'null')?.id; } catch { return null; }
  })();
  const myRow = rows.find(r =>
    (user && r.user_id === user.id) || (anonId && r.anon_id === anonId)
  );
  const myRank = myRow ? rows.indexOf(myRow) + 1 : null;

  return (
    <div className="auth-modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ranking-modal">
        <button className="auth-modal-close" onClick={onClose}>✕</button>
        <div className="ranking-title">{isEn ? "Today's Ranking" : '오늘의 랭킹'}</div>

        <div className="ranking-stats">
          <div className="ranking-stat-box">
            <div className="ranking-stat-val">{total}</div>
            <div className="ranking-stat-label">{isEn ? 'Solvers' : '클리어'}</div>
          </div>
          <div className="ranking-stat-box">
            <div className="ranking-stat-val">{avg}</div>
            <div className="ranking-stat-label">{isEn ? 'Avg tries' : '평균 시도'}</div>
          </div>
          {myRank && (
            <div className="ranking-stat-box highlight">
              <div className="ranking-stat-val">#{myRank}</div>
              <div className="ranking-stat-label">{isEn ? 'My rank' : '내 순위'}</div>
            </div>
          )}
        </div>

        <div className="ranking-list">
          {loading ? (
            <div className="ranking-empty">{isEn ? 'Loading...' : '불러오는 중...'}</div>
          ) : rows.length === 0 ? (
            <div className="ranking-empty">{isEn ? 'No records yet today.' : '오늘 아직 클리어한 사람이 없어요.'}</div>
          ) : (
            rows.slice(0, 20).map((r, i) => {
              const isMe = (user && r.user_id === user.id) || (anonId && r.anon_id === anonId);
              return (
                <div key={r.id ?? i} className={`ranking-row${isMe ? ' me' : ''}`}>
                  <RankAvatar rank={i + 1} profilePokemon={r.profile_pokemon} />
                  <div className="ranking-info">
                    <span className="ranking-nickname">
                      {r.nickname || '트레이너'}
                      {isMe && <span className="ranking-me-badge">{isEn ? 'ME' : '나'}</span>}
                    </span>
                    {r.equipped_title && TITLE_MAP[r.equipped_title] && (
                      <TitleBadge titleId={r.equipped_title} />
                    )}
                  </div>
                  <span className="ranking-tries-wrap">
                    {!r.used_filter && (
                      <span className="ranking-no-filter">{isEn ? 'no filter!' : '필터 미사용!'}</span>
                    )}
                    <span className="ranking-tries">{r.tries}{isEn ? ' tries' : '번'}</span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
