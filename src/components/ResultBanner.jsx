import { useEffect, useState } from 'react';
import { spr, sprShiny } from '../utils/sprite.js';
import { displayName, getTodayStr } from '../utils/game.js';
import { supabasePublic } from '../lib/supabase.js';
import { TITLE_MAP, RARITY } from '../data/titles.js';

/* ── 칭호 뱃지 (미니 인라인) ── */
function TitleBadge({ titleId }) {
  const t = TITLE_MAP[titleId];
  if (!t) return null;
  const s = RARITY[t.rarity];
  return (
    <span
      className="rank-title-badge"
      style={{ color: s.color, background: s.bg, borderColor: s.border }}
    >
      {t.emoji} {t.ko}
    </span>
  );
}

const MEDAL = ['🥇', '🥈', '🥉'];

function Pokeball() {
  return (
    <svg viewBox="0 0 40 40" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
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
    ? (profilePokemon.endsWith('-shiny') ? sprShiny(profilePokemon.slice(0, -6)) : spr(profilePokemon))
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

/* ── Ranking data hook ── */
export function useInlineRanking(win) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!win) return;
    async function fetchRanking() {
      const { data } = await supabasePublic
        .from('daily_results')
        .select('id, user_id, anon_id, tries, nickname, used_filter, equipped_title, profile_pokemon')
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

const PAGE_SIZE = 10;

/* ── Ranking Panel (오른쪽 aside) ── */
export function RankingPanel({ win, user, lang = 'ko' }) {
  const { rows, loading } = useInlineRanking(win);
  const [page, setPage] = useState(1);
  const isEn = lang === 'en';

  const anonId = (() => {
    try { return JSON.parse(localStorage.getItem('pokeclue_anon') || 'null')?.id; } catch { return null; }
  })();

  const total = rows.length;
  const avg = total > 0 ? (rows.reduce((s, r) => s + r.tries, 0) / total).toFixed(1) : '-';
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          pageRows.map((r, i) => {
            const globalIdx = (page - 1) * PAGE_SIZE + i;
            const isMe = (user && r.user_id === user.id) || (anonId && r.anon_id === anonId);
            return (
              <div key={r.id ?? globalIdx} className={`ritem${isMe ? ' me' : ''}`}>
                <RankAvatar rank={globalIdx + 1} profilePokemon={r.profile_pokemon} />
                <div className="who">
                  <span className="who-name">{r.nickname || (isEn ? 'Trainer' : '트레이너')}</span>
                  {r.equipped_title && TITLE_MAP[r.equipped_title] && (
                    <TitleBadge titleId={r.equipped_title} />
                  )}
                </div>
                <div className="tries">
                  {!r.used_filter && (
                    <span className="nofilter">✓ {isEn ? 'No filter' : '필터 미사용'}</span>
                  )}
                  {r.tries}<small>{isEn ? ' tries' : '번'}</small>
                </div>
              </div>
            );
          })
        )}
      </div>
      {totalPages > 1 && (
        <div className="rank-pagination">
          <button
            className="rank-page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >◀</button>
          <span className="rank-page-info">{page} / {totalPages}</span>
          <button
            className="rank-page-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >▶</button>
        </div>
      )}
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
export function ResultBanner({ answer, result, guessCount, lang = 'ko', user, newTitleIds = [] }) {
  if (!result) return null;
  const { win, shinyPct, gotShiny } = result;
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

        {/* 이로치 획득 알림 */}
        {gotShiny && (
          <div className="shiny-unlock-wrap">
            <span className="shiny-unlock-icon">✨</span>
            <div>
              <div className="shiny-unlock-title">{isEn ? 'Shiny unlocked!' : '이로치 획득!'}</div>
              <div className="shiny-unlock-desc">{isEn ? `✨ ${name} added to your Pokédex` : `✨ ${name}이(가) 도감에 등록되었어요`}</div>
            </div>
          </div>
        )}

        {/* 새 칭호 획득 알림 */}
        {newTitleIds.length > 0 && (
          <div className="new-titles-wrap">
            <div className="new-titles-header">
              🎖️ {isEn ? 'New title unlocked!' : '칭호 획득!'}
            </div>
            <div className="new-titles-list">
              {newTitleIds.map(id => {
                const t = TITLE_MAP[id];
                if (!t) return null;
                const s = RARITY[t.rarity];
                return (
                  <div
                    key={id}
                    className="new-title-item"
                    style={{ '--tc': s.color, '--tbg': s.bg, '--tb': s.border }}
                  >
                    <span className="new-title-emoji">{t.emoji}</span>
                    <div>
                      <div className="new-title-name">{isEn ? t.en : t.ko}</div>
                      <div className="new-title-desc">{isEn ? t.desc_en : t.desc_ko}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="new-titles-hint">
              {isEn ? '→ Equip from Profile settings' : '→ 프로필 설정에서 장착할 수 있어요'}
            </div>
          </div>
        )}
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
