import { useMemo } from 'react';
import { GENERAL_TITLES, TYPE_TIERS, RARITY } from '../data/titles.js';
import DB from '../data/pokemon.js';

const RARITY_LABEL_KO = {
  common: '일반', rare: '레어', epic: '에픽', legendary: '전설',
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

function TitleCard({ title, isEquipped, onEquip, user }) {
  const s = RARITY[title.rarity];
  return (
    <div
      className={`title-card${isEquipped ? ' equipped' : ''}`}
      style={{ '--tc': s.color, '--tbg': s.bg, '--tb': s.border }}
      onClick={() => user && onEquip(title.id)}
    >
      <div className="title-card-top">
        <span className="title-card-emoji">{title.emoji}</span>
        <span className={`title-card-rarity rarity-${title.rarity}`}>
          {RARITY_LABEL_KO[title.rarity]}
        </span>
      </div>
      <div className="title-card-name px">{title.ko}</div>
      <div className="title-card-desc">{title.desc_ko ?? `${title.threshold}마리 도감 등록`}</div>
      {user && (
        <button className={`title-card-equip-btn${isEquipped ? ' on' : ''}`}>
          {isEquipped ? '✓ 장착 중' : '장착하기'}
        </button>
      )}
    </div>
  );
}

function LockedCard({ title, descOverride }) {
  const s = RARITY[title.rarity];
  return (
    <div className="title-card locked" style={{ '--tc': s.color, '--tbg': s.bg, '--tb': s.border }}>
      <div className="title-card-top">
        <span className="title-card-emoji locked-emoji">🔒</span>
        <span className={`title-card-rarity rarity-${title.rarity}`}>
          {RARITY_LABEL_KO[title.rarity]}
        </span>
      </div>
      <div className="title-card-name px locked-name">{title.ko}</div>
      <div className="title-card-desc">{descOverride ?? title.desc_ko}</div>
    </div>
  );
}

export function TitlesPage({ user, earnedIds = [], onEquipTitle, lang = 'ko', dex = {} }) {
  const equippedTitle = user?.user_metadata?.equipped_title ?? null;

  // 도감에서 타입별 등록 수 계산
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

      {/* ── 일반 칭호 ── */}
      <section className="titles-section">
        <div className="titles-section-label">📋 일반 칭호</div>
        <div className="titles-cards">
          {GENERAL_TITLES.map(t =>
            earnedIds.includes(t.id)
              ? <TitleCard key={t.id} title={t} isEquipped={equippedTitle === t.id} onEquip={handleEquip} user={user} />
              : <LockedCard key={t.id} title={t} />
          )}
        </div>
      </section>

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
                {/* 타입 헤더 + 진행도 */}
                <div className="type-tier-header">
                  <span className="type-tier-label">{type}</span>
                  <span className="type-tier-progress-text">
                    {caught} / {total} ({pct}%)
                    {nextTier && <span className="type-tier-next"> · 다음 칭호까지 {nextTier.threshold - caught}마리</span>}
                  </span>
                </div>
                {/* 진행도 바 */}
                <div className="type-tier-bar-wrap">
                  <div className="type-tier-bar" style={{ width: `${pct}%` }} />
                  {/* 티어 마커 */}
                  {tiers.map(t => (
                    <div
                      key={t.id}
                      className={`type-tier-marker${caught >= t.threshold ? ' done' : ''}`}
                      style={{ left: `${Math.min(100, (t.threshold / total) * 100)}%` }}
                      title={`${t.ko} (${t.threshold}마리)`}
                    />
                  ))}
                </div>
                {/* 칭호 카드 3개 */}
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
