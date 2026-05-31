import { useEffect, useState } from 'react';
import { spr } from '../utils/sprite.js';
import { displayName, getTodayStr } from '../utils/game.js';
import { supabase } from '../lib/supabase.js';

function useInlineRanking(win) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!win) return;
    async function fetch() {
      const { data } = await supabase
        .from('daily_results')
        .select('id, user_id, anon_id, tries, nickname')
        .eq('date', getTodayStr())
        .eq('solved', true)
        .order('tries', { ascending: true })
        .limit(10);
      setRows(data || []);
      setLoading(false);
    }
    fetch();
  }, [win]);

  return { rows, loading };
}

export function ResultBanner({ answer, result, guessCount, onReset, lang = 'ko', user }) {
  if (!result) return null;
  const { win, shinyPct } = result;
  const isEn = lang === 'en';
  const name = displayName(answer, lang);

  const { rows, loading } = useInlineRanking(win);

  const anonId = (() => {
    try { return JSON.parse(localStorage.getItem('pokeclue_anon') || 'null')?.id; } catch { return null; }
  })();

  const total = rows.length;
  const avg = total > 0 ? (rows.reduce((s, r) => s + r.tries, 0) / total).toFixed(1) : '-';
  const myRow = rows.find(r =>
    (user && r.user_id === user.id) || (!user && anonId && r.anon_id === anonId)
  );
  const myRank = myRow ? rows.indexOf(myRow) + 1 : null;

  return (
    <div className={`result-banner show${win ? '' : ' fail'}`}>
      {/* 포켓몬 + 결과 */}
      <div className="res-poke">
        <img src={spr(answer.id)} alt={name} />
        <div>
          <div className="res-t">
            {win
              ? `★ ${name} ${isEn ? 'correct!' : '정답!'}`
              : `${isEn ? 'Answer: ' : '정답: '}${name}`}
          </div>
          <div className="res-s">
            {win
              ? (isEn ? `Cleared in ${guessCount} tries!  Shiny rate: ${shinyPct}` : `${guessCount}번 만에 클리어!  이로치 확률: ${shinyPct}`)
              : (isEn ? 'Better luck next time!' : '다음에 다시 도전해보세요!')}
          </div>
        </div>
      </div>

      {/* 랭킹 인라인 (정답일 때만) */}
      {win && (
        <div className="res-ranking">
          <div className="res-ranking-header">
            <span className="res-ranking-title">🏆 {isEn ? "Today's Ranking" : '오늘의 랭킹'}</span>
            <div className="res-ranking-stats">
              <span>{isEn ? 'Solvers' : '클리어'} <strong>{total}</strong></span>
              <span>{isEn ? 'Avg' : '평균'} <strong>{avg}{isEn ? ' tries' : '번'}</strong></span>
              {myRank && <span className="res-my-rank">{isEn ? 'My rank' : '내 순위'} <strong>#{myRank}</strong></span>}
            </div>
          </div>

          <div className="res-ranking-list">
            {loading ? (
              <div className="res-ranking-empty">{isEn ? 'Loading...' : '불러오는 중...'}</div>
            ) : rows.length === 0 ? (
              <div className="res-ranking-empty">{isEn ? 'No records yet.' : '아직 기록이 없어요.'}</div>
            ) : (
              rows.map((r, i) => {
                const isMe = (user && r.user_id === user.id) || (!user && anonId && r.anon_id === anonId);
                return (
                  <div key={r.id ?? i} className={`res-ranking-row${isMe ? ' me' : ''}`}>
                    <span className="res-rank-pos">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <span className="res-rank-name">{r.nickname || (isEn ? 'Trainer' : '트레이너')}</span>
                    <span className="res-rank-tries">{r.tries}{isEn ? ' tries' : '번'}</span>
                    {isMe && <span className="res-rank-me">{isEn ? 'ME' : '나'}</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
