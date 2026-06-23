import { useEffect, useState } from 'react';
import { supabasePublic } from '../lib/supabase.js';

export function ChallengeRankingModal({ onClose, user, lang }) {
  const isEn = lang === 'en';
  const [tab, setTab] = useState('monthly');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      let query = supabasePublic
        .from('challenge_clears')
        .select('user_id, tries');

      if (tab === 'monthly') {
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        query = query.gte('date', monthStart);
      }

      const { data, error } = await query;
      if (error) { console.error('challenge ranking error', error); setRows([]); setLoading(false); return; }

      const map = {};
      (data || []).forEach(r => {
        if (!map[r.user_id]) map[r.user_id] = { clears: 0, totalTries: 0 };
        map[r.user_id].clears++;
        map[r.user_id].totalTries += r.tries;
      });

      const userIds = Object.keys(map);
      let nickMap = {};
      if (userIds.length > 0) {
        const { data: results } = await supabasePublic
          .from('daily_results')
          .select('user_id, nickname')
          .in('user_id', userIds)
          .order('date', { ascending: false });
        (results || []).forEach(r => {
          if (!nickMap[r.user_id]) nickMap[r.user_id] = r.nickname;
        });
      }

      const ranked = userIds.map(uid => ({
        userId: uid,
        nickname: nickMap[uid] || '트레이너',
        clears: map[uid].clears,
        avgTries: (map[uid].totalTries / map[uid].clears).toFixed(1),
      })).sort((a, b) => b.clears - a.clears || parseFloat(a.avgTries) - parseFloat(b.avgTries));

      setRows(ranked.slice(0, 20));
      setLoading(false);
    })();
  }, [tab]);

  const myRow = user ? rows.find(r => r.userId === user.id) : null;
  const myRank = myRow ? rows.indexOf(myRow) + 1 : null;

  const now = new Date();
  const monthLabel = isEn
    ? `${now.toLocaleString('en', { month: 'long' })} ${now.getFullYear()}`
    : `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

  return (
    <div className="auth-modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ranking-modal">
        <button className="auth-modal-close" onClick={onClose}>✕</button>
        <div className="ranking-title">★ {isEn ? 'Challenge Ranking' : '챌린지 랭킹'}</div>

        <div className="challenge-rank-tabs">
          <button
            className={`challenge-rank-tab${tab === 'monthly' ? ' on' : ''}`}
            onClick={() => setTab('monthly')}
          >
            {isEn ? 'Monthly' : '월간'} ({monthLabel})
          </button>
          <button
            className={`challenge-rank-tab${tab === 'all' ? ' on' : ''}`}
            onClick={() => setTab('all')}
          >
            {isEn ? 'All Time' : '전체'}
          </button>
        </div>

        <div className="ranking-list">
          {loading ? (
            <div className="ranking-empty">{isEn ? 'Loading...' : '불러오는 중...'}</div>
          ) : rows.length === 0 ? (
            <div className="ranking-empty">{isEn ? 'No records yet.' : '아직 기록이 없어요.'}</div>
          ) : (
            rows.map((r, i) => {
              const isMe = user && r.userId === user.id;
              return (
                <div key={r.userId} className={`ranking-row${isMe ? ' me' : ''}`}>
                  <span className="ranking-pos">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <div className="ranking-info">
                    <span className="ranking-nickname">
                      {r.nickname}
                      {isMe && <span className="ranking-me-badge">{isEn ? 'ME' : '나'}</span>}
                    </span>
                  </div>
                  <span className="ranking-tries-wrap">
                    <span className="ranking-tries">{r.clears}{isEn ? ' clears' : '회 클리어'}</span>
                    <span className="ranking-no-filter">{isEn ? `avg ${r.avgTries}` : `평균 ${r.avgTries}번`}</span>
                  </span>
                </div>
              );
            })
          )}
        </div>

        {myRank && (
          <div className="challenge-rank-myrank">
            {isEn ? 'My rank: ' : '내 순위: '}#{myRank}
          </div>
        )}
      </div>
    </div>
  );
}
