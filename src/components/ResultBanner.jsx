import { useEffect, useState } from 'react';
import { spr } from '../utils/sprite.js';
import { displayName, getTodayStr } from '../utils/game.js';
import { supabasePublic } from '../lib/supabase.js';

/* ── Ranking data hook ── */
export function useInlineRanking(win) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!win) return;
    async function fetchRanking() {
      const { data } = await supabasePublic
        .from('daily_results')
        .select('id, user_id, anon_id, tries, nickname, used_filter')
        .eq('date', getTodayStr())
        .eq('solved', true)
        .order('tries', { ascending: true })
        .limit(50);
      setRows(data || []);
      setLoading(false);
    }
    const timer = setTimeout(fetchRanking, 1500);
    return () => clearTimeout(timer);
  }, [win]);

  return { rows, loading };
}

/* ── Ranking Panel (오른쪽 aside) ── */
export function RankingPanel({ win, user, lang = 'ko' }) {
  const { rows, loading } = useInlineRanking(win);
  const isEn = lang === 'en';

  const anonId = (() => {
    try { return JSON.parse(localStorage.getItem('pokeclue_anon') || 'null')?.id; } catch { return null; }
  })();

  const total = rows.length;
  const avg = total > 0 ? (rows.reduce((s, r) => s + r.tries, 0) / total).toFixed(1) : '-';

  return (
    <div className="panel rank-panel">
      <div className="rhead">
        <span className="rt">🏆 {isEn ? "Today's Ranking" : '오늘의 랭킹'}</span>
        <span className="rstat">
          {isEn ? 'Solvers ' : '클리어 '}<b>{total}</b>
          {' · '}
          {isEn ? 'Avg ' : '평균 '}<b>{avg}{isEn ? '' : '번'}</b>
        </span>
      </div>
      <div className="rlist">
        {loading ? (
          <div className="rank-loading">{isEn ? 'Loading...' : '불러오는 중...'}</div>
        ) : rows.length === 0 ? (
          <div className="rank-loading">{isEn ? 'No records yet.' : '아직 기록이 없어요.'}</div>
        ) : (
          rows.slice(0, 20).map((r, i) => {
            const isMe = (user && r.user_id === user.id) || (anonId && r.anon_id === anonId);
            return (
              <div key={r.id ?? i} className={`ritem${isMe ? ' me' : ''}`}>
                {i === 0 ? <div className="medal">🥇</div>
                 : i === 1 ? <div className="medal">🥈</div>
                 : i === 2 ? <div className="medal">🥉</div>
                 : <div className="pos">{i + 1}</div>}
                <div className="who">
                  {r.nickname || (isEn ? 'Trainer' : '트레이너')}
                  {!r.used_filter && (
                    <span className="nofilter">✓ {isEn ? 'No filter' : '필터 미사용'}</span>
                  )}
                </div>
                <div className="tries">{r.tries}<small>{isEn ? ' tries' : '번'}</small></div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── Legend Panel ── */
export function LegendPanel({ lang = 'ko' }) {
  const isEn = lang === 'en';
  return (
    <div className="panel new-legend">
      <span className="lg-lab">{isEn ? 'Hint' : '힌트 색'}</span>
      <span className="lg">
        <span className="sw" style={{ background: 'var(--correct)' }} />
        {isEn ? 'Exact' : '정확'}
      </span>
      <span className="lg">
        <span className="sw" style={{ background: 'var(--partial)' }} />
        {isEn ? 'Partial' : '부분 일치'}
      </span>
      <span className="lg">
        <span className="sw" style={{ background: 'var(--miss)' }} />
        {isEn ? 'Miss · ▲▼' : '불일치 · ▲▼'}
      </span>
    </div>
  );
}

/* ── Reveal Card (정답 공개) ── */
export function ResultBanner({ answer, result, guessCount, lang = 'ko', user }) {
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

  if (win) {
    return (
      <div className={`panel reveal win-reveal`}>
        <div className="spritebig">
          <img src={spr(answer.id)} alt={name}
            onError={e => {
              if (answer.baseId && !e.target.dataset.fb) {
                e.target.dataset.fb = '1';
                e.target.src = spr(answer.baseId);
              }
            }}
          />
        </div>
        <h2><span className="star">★</span> {name} {isEn ? 'correct!' : '정답!'}</h2>
        <div className="sub">
          <b>{guessCount}{isEn ? '' : '번'}</b>{isEn ? ` tr${guessCount === 1 ? 'y' : 'ies'} to clear!` : ' 만에 클리어했어요'}
        </div>
        <div className="pills">
          <span className="pill">
            <span className="k">{isEn ? "Today's solvers" : '오늘의 클리어'}</span>
            <span className="vv px">{loading ? '...' : `${total}${isEn ? '' : '명'}`}</span>
          </span>
          <span className="pill">
            <span className="k">{isEn ? 'Avg' : '평균'}</span>
            <span className="vv px">{loading ? '...' : `${avg}${isEn ? ' tries' : '번'}`}</span>
          </span>
          <span className="pill shiny">
            <span className="k">✦ {isEn ? 'Shiny rate' : '이로치 확률'}</span>
            <span className="vv px">{shinyPct}</span>
          </span>
        </div>
      </div>
    );
  }

  // fail
  return (
    <div className="panel reveal fail-reveal">
      <div className="spritebig">
        <img src={spr(answer.id)} alt={name}
          onError={e => {
            if (answer.baseId && !e.target.dataset.fb) {
              e.target.dataset.fb = '1';
              e.target.src = spr(answer.baseId);
            }
          }}
        />
      </div>
      <h2>{isEn ? 'Answer: ' : '정답: '}{name}</h2>
      <div className="sub">{isEn ? 'Better luck next time!' : '다음에 다시 도전해보세요!'}</div>
    </div>
  );
}
