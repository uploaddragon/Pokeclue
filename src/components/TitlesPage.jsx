import { GENERAL_TITLES, TYPE_TIERS, RARITY } from '../data/titles.js';

const RARITY_LABEL_KO = {
  common: '일반', rare: '레어', epic: '에픽', legendary: '전설',
};

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
      <div className="title-card-desc">{title.desc_ko ?? `${title.type}타입 ${title.threshold}마리 도감 등록`}</div>
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

export function TitlesPage({ user, earnedIds = [], onEquipTitle, lang = 'ko' }) {
  const equippedTitle = user?.user_metadata?.equipped_title ?? null;

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
          {TYPE_TIERS.map(({ type, tiers }) => (
            <div key={type} className="type-tier-row">
              <div className="type-tier-label">{type}</div>
              <div className="type-tier-cards">
                {tiers.map(t =>
                  earnedIds.includes(t.id)
                    ? <TitleCard key={t.id} title={t} isEquipped={equippedTitle === t.id} onEquip={handleEquip} user={user} />
                    : <LockedCard key={t.id} title={t} descOverride={`${type}타입 ${t.threshold}마리 도감 등록`} />
                )}
              </div>
            </div>
          ))}
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
