import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { getTodayStr } from '../utils/game.js';

export function RankingModal({ onClose, user, lang }) {
  const isEn = lang === 'en';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      const { data, error } = await supabase
        .from('daily_results')
        .select('id, user_id, anon_id, tries, solved, used_filter, nickname')
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
  // 내 행 찾기 (로그인 or 익명)
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
                  <span className="ranking-pos">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span className="ranking-nickname">{r.nickname || '트레이너'}</span>
                  <span className="ranking-tries-wrap">
                    <span className="ranking-tries">{r.tries}{isEn ? ' tries' : '번'}</span>
                    {!r.used_filter && (
                      <span className="ranking-no-filter">{isEn ? 'no filter!' : '필터 미사용!'}</span>
                    )}
                  </span>
                  {isMe && (
                    <span className="ranking-me-badge">{isEn ? 'ME' : '나'}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
