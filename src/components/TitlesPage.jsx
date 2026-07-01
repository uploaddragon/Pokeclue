import { useMemo, useState, useEffect } from 'react';
import { GENERAL_TITLES, TYPE_TIERS, RARITY } from '../data/titles.js';
import DB from '../data/pokemon.js';
import { supabase } from '../lib/supabase.js';

const RARITY_LABEL_KO = {
  common: '일반', rare: '레어', epic: '에픽', legendary: '전설', mythic: '신화', mystery: '???',
};

// 타입별 DB 총 수 (한 번만 계산)
const TYPE_TOTAL = (() => {
  const map = {};
  const REAL = new Set(TYPE_TIERS.map(t => t.type));
  DB.forEach(p => {
    [p.t1, p.t2].filter(t => t && REAL.has(t)).forEach(t => {
      map[t] = (map[t] || 0) + 1;
    });
  });
  return map;
})();

/* progress: 현재 값, max: 목표값 (있을 때만 렌더) */
function CardProgress({ progress, max }) {
  if (max == null) return null;
  const pct = Math.min(100, Math.round((progress / max) * 100));
  return (
    <div className="title-card-progress-wrap">
      <div className="title-card-progress-bar" style={{ width: `${pct}%` }} />
      <span className="title-card-progress-text">{progress} / {max}</span>
    </div>
  );
}

function TitleCard({ title, isEquipped, onEquip, user, progress, progressMax }) {
  const s = RARITY[title.rarity];
  const isMystery = title.rarity === 'mystery';
  return (
    <div
      className={`title-card${isEquipped ? ' equipped' : ''}${isMystery ? ' mystery' : ''}`}
      style={{ '--tc': s.color, '--tbg': s.bg, '--tb': s.border }}
      onClick={() => user && onEquip(title.id)}
    >
      <div className="title-card-top">
        <span className="title-card-emoji">{isMystery ? '👾' : title.emoji}</span>
        <span className={`title-card-rarity rarity-${title.rarity}`}>
          {RARITY_LABEL_KO[title.rarity]}
        </span>
      </div>
      <div className="title-card-name px">{title.ko}</div>
      <div className="title-card-desc">{title.desc_ko ?? '달성 조건'}</div>
      <CardProgress progress={progress} max={progressMax} />
      {user && (
        <button className={`title-card-equip-btn${isEquipped ? ' on' : ''}`}>
          {isEquipped ? '✓ 장착 중' : '장착하기'}
        </button>
      )}
    </div>
  );
}

const MYSTERY_VISIBLE = new Set(['hello']);

function LockedCard({ title, descOverride, progress, progressMax }) {
  const s = RARITY[title.rarity];
  const isMystery = title.rarity === 'mystery' && !MYSTERY_VISIBLE.has(title.id);
  return (
    <div className={`title-card locked${isMystery ? ' mystery' : ''}`} style={{ '--tc': s.color, '--tbg': s.bg, '--tb': s.border }}>
      <div className="title-card-top">
        <span className="title-card-emoji locked-emoji">{isMystery ? '❓' : '🔒'}</span>
        <span className={`title-card-rarity rarity-${title.rarity}`}>
          {RARITY_LABEL_KO[title.rarity]}
        </span>
      </div>
      <div className="title-card-name px locked-name">{isMystery ? '???' : title.ko}</div>
      <div className="title-card-desc">{isMystery ? '???' : (descOverride ?? title.desc_ko)}</div>
      <CardProgress progress={progress} max={progressMax} />
    </div>
  );
}

export function TitlesPage({ user, earnedIds = [], onEquipTitle, lang = 'ko', dex = {} }) {
  const equippedTitle = user?.user_metadata?.equipped_title ?? null;

  const [dailyClearCount, setDailyClearCount] = useState(0);
  const [challengeClearCount, setChallengeClearCount] = useState(0);
  const [battleStats, setBattleStats] = useState({ wins: 0, losses: 0 });
  const nearMissCount = user?.user_metadata?.near_miss_count ?? 0;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('daily_results')
      .select('date', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('solved', true)
      .then(({ count }) => { if (count != null) setDailyClearCount(count); });
    supabase
      .from('challenge_clears')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => { if (count != null) setChallengeClearCount(count); });
    supabase
      .from('battle_stats')
      .select('wins, losses')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setBattleStats(data); });
  }, [user?.id]);

  // progressGroup → 현재 카운트 맵
  const progressCounts = {
    daily_clears: dailyClearCount,
    challenge_clears: challengeClearCount,
    battle_wins: battleStats.wins,
    battle_plays: battleStats.wins + battleStats.losses,
    near_miss: nearMissCount,
  };

  const typeCounts = useMemo(() => {
    const map = {};
    const REAL = new Set(TYPE_TIERS.map(t => t.type));
    Object.keys(dex).forEach(id => {
      const p = DB.find(p => String(p.id) === String(id));
      if (!p) return;
      [p.t1, p.t2].filter(t => t && REAL.has(t)).forEach(t => {
        map[t] = (map[t] || 0) + 1;
      });
    });
    return map;
  }, [dex]);

  async function handleEquip(titleId) {
    if (!onEquipTitle || !user) return;
    await onEquipTitle(equippedTitle === titleId ? null : titleId);
  }

  const totalCount = GENERAL_TITLES.length + TYPE_TIERS.reduce((s, t) => s + t.tiers.length, 0);

  return (
    <main className="titles-page">
      <div className="titles-page-header">
        <h2 className="titles-page-title px">🎖️ 칭호</h2>
        <p className="titles-page-sub">
          특별한 조건을 달성하면 칭호를 얻어요. 하나를 장착하면 랭킹에 표시돼요!
        </p>
        <div className="titles-page-progress">
          <div className="titles-page-progress-bar" style={{ width: `${(earnedIds.length / totalCount) * 100}%` }} />
          <span className="titles-page-progress-text">{earnedIds.length} / {totalCount}</span>
        </div>
      </div>

      {/* ── 카테고리별 칭호 ── */}
      {[
        { label: '📅 데일리 칭호', ids: ['quick','earlybird','slowstart','reckless','insomnia','shortpants','elitetrainer','champion'] },
        { label: '★ 챌린지 칭호', ids: ['challenge_30','challenge_50','challenge_100','challenge_300'] },
        { label: '⚔ 대전 칭호', ids: ['battle_1','battle_10','battle_50','battle_100','battle_play_100','battle_play_200','gapseok'] },
        { label: '🌐 공통 칭호', ids: ['pallet','nombungi','sparkdust','onehit','hello'] },
      ].map(cat => {
        const titles = cat.ids.map(id => GENERAL_TITLES.find(t => t.id === id)).filter(Boolean);
        if (titles.length === 0) return null;
        return (
          <section key={cat.label} className="titles-section">
            <div className="titles-section-label">{cat.label}</div>
            <div className="titles-cards">
              {titles.map(t => {
                const current = t.progressGroup ? (progressCounts[t.progressGroup] ?? 0) : undefined;
                const max = t.threshold ?? undefined;
                return earnedIds.includes(t.id)
                  ? <TitleCard key={t.id} title={t} isEquipped={equippedTitle === t.id} onEquip={handleEquip} user={user} progress={current} progressMax={max} />
                  : <LockedCard key={t.id} title={t} progress={current} progressMax={max} />;
              })}
            </div>
          </section>
        );
      })}

      {/* ── 타입별 칭호 ── */}
      <section className="titles-section">
        <div className="titles-section-label">🏅 타입 도감 칭호</div>
        <div className="type-tiers-list">
          {TYPE_TIERS.map(({ type, tiers }) => {
            const caught = typeCounts[type] || 0;
            const total  = TYPE_TOTAL[type] || 1;
            const pct    = Math.min(100, Math.round((caught / total) * 100));
            const nextTier = tiers.find(t => caught < t.threshold);

            return (
              <div key={type} className="type-tier-row">
                <div className="type-tier-header">
                  <span className="type-tier-label">{type}</span>
                  <span className="type-tier-progress-text">
                    {caught} / {total} ({pct}%)
                    {nextTier && <span className="type-tier-next"> · 다음 칭호까지 {nextTier.threshold - caught}마리</span>}
                  </span>
                </div>
                <div className="type-tier-bar-wrap">
                  <div className="type-tier-bar" style={{ width: `${pct}%` }} />
                  {tiers.map(t => (
                    <div
                      key={t.id}
                      className={`type-tier-marker${caught >= t.threshold ? ' done' : ''}`}
                      style={{ left: `${Math.min(100, (t.threshold / total) * 100)}%` }}
                      title={`${t.ko} (${t.threshold}마리)`}
                    />
                  ))}
                </div>
                <div className="type-tier-cards">
                  {tiers.map(t =>
                    earnedIds.includes(t.id)
                      ? <TitleCard key={t.id} title={t} isEquipped={equippedTitle === t.id} onEquip={handleEquip} user={user} />
                      : <LockedCard key={t.id} title={t} descOverride={`${type}타입 ${t.threshold}마리 도감 등록`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {!user && (
        <div className="titles-login-notice">
          🔑 로그인하면 칭호를 획득하고 장착할 수 있어요!
        </div>
      )}
    </main>
  );
}
