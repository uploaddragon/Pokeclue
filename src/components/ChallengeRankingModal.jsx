import { useEffect, useState } from 'react';
import { supabasePublic } from '../lib/supabase.js';
import { spr, sprShiny } from '../utils/sprite.js';
import { TITLE_MAP, RARITY } from '../data/titles.js';

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
  const sprSrc = profilePokemon
    ? (profilePokemon.endsWith('-shiny') ? sprShiny(profilePokemon.slice(0, -6)) : spr(profilePokemon))
    : null;
  return (
    <div className="rank-avatar-wrap">
      <div className={`rank-avatar-circle rank${rank <= 3 ? rank : ''}`}>
        {sprSrc ? <img src={sprSrc} className="rank-avatar-spr" alt="" /> : <Pokeball />}
      </div>
      {medal
        ? <span className="rank-avatar-medal">{medal}</span>
        : <span className="rank-avatar-num">#{rank}</span>}
    </div>
  );
}

function useChallengeRanking(tab) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      let query = supabasePublic
        .from('challenge_clears')
        .select('user_id, tries, nickname, equipped_title, profile_pokemon');

      if (tab === 'monthly') {
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        query = query.gte('date', monthStart);
      }

      const { data, error } = await query;
      if (error) { console.error('challenge ranking error', error); setRows([]); setLoading(false); return; }

      const map = {};
      (data || []).forEach(r => {
        if (!map[r.user_id]) {
          map[r.user_id] = {
            clears: 0, totalTries: 0,
            nickname: r.nickname || '트레이너',
            equippedTitle: r.equipped_title,
            profilePokemon: r.profile_pokemon,
          };
        }
        map[r.user_id].clears++;
        map[r.user_id].totalTries += r.tries;
        if (r.nickname) map[r.user_id].nickname = r.nickname;
        if (r.equipped_title) map[r.user_id].equippedTitle = r.equipped_title;
        if (r.profile_pokemon) map[r.user_id].profilePokemon = r.profile_pokemon;
      });

      const ranked = Object.entries(map).map(([uid, d]) => ({
        userId: uid,
        nickname: d.nickname,
        equippedTitle: d.equippedTitle,
        profilePokemon: d.profilePokemon,
        clears: d.clears,
        avgTries: (d.totalTries / d.clears).toFixed(1),
      })).sort((a, b) => b.clears - a.clears || parseFloat(a.avgTries) - parseFloat(b.avgTries));

      setRows(ranked.slice(0, 20));
      setLoading(false);
    })();
  }, [tab]);

  return { rows, loading };
}

function RankingRows({ rows, user, lang }) {
  const isEn = lang === 'en';
  if (rows.length === 0) return <div className="ranking-empty">{isEn ? 'No records yet.' : '아직 기록이 없어요.'}</div>;
  return rows.map((r, i) => {
    const isMe = user && r.userId === user.id;
    return (
      <div key={r.userId} className={`ranking-row${isMe ? ' me' : ''}`}>
        <RankAvatar rank={i + 1} profilePokemon={r.profilePokemon} />
        <div className="ranking-info">
          <span className="ranking-nickname">
            {r.nickname}
            {isMe && <span className="ranking-me-badge">{isEn ? 'ME' : '나'}</span>}
          </span>
          {r.equippedTitle && TITLE_MAP[r.equippedTitle] && (
            <TitleBadge titleId={r.equippedTitle} />
          )}
        </div>
        <span className="ranking-tries-wrap">
          <span className="ranking-tries">{r.clears}{isEn ? ' clears' : '회 클리어'}</span>
          <span className="ranking-no-filter">{isEn ? `avg ${r.avgTries}` : `평균 ${r.avgTries}번`}</span>
        </span>
      </div>
    );
  });
}

export function ChallengeRankingPanel({ user, lang }) {
  const isEn = lang === 'en';
  const [tab, setTab] = useState('monthly');
  const { rows, loading } = useChallengeRanking(tab);

  const now = new Date();
  const monthLabel = isEn
    ? `${now.toLocaleString('en', { month: 'short' })} ${now.getFullYear()}`
    : `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

  return (
    <div className="challenge-rank-panel">
      <div className="challenge-rank-panel-title">★ {isEn ? 'Challenge Ranking' : '챌린지 랭킹'}</div>

      <div className="challenge-rank-tabs">
        <button className={`challenge-rank-tab${tab === 'monthly' ? ' on' : ''}`} onClick={() => setTab('monthly')}>
          {isEn ? 'Monthly' : '월간'}
        </button>
        <button className={`challenge-rank-tab${tab === 'all' ? ' on' : ''}`} onClick={() => setTab('all')}>
          {isEn ? 'All Time' : '전체'}
        </button>
      </div>

      <div className="challenge-rank-panel-sub">{tab === 'monthly' ? monthLabel : (isEn ? 'All Time' : '전체 기간')}</div>

      <div className="challenge-rank-list">
        {loading
          ? <div className="ranking-empty">{isEn ? 'Loading...' : '불러오는 중...'}</div>
          : <RankingRows rows={rows} user={user} lang={lang} />}
      </div>
    </div>
  );
}
