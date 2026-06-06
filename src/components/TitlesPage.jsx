import { TITLES, TITLE_MAP, RARITY } from '../data/titles.js';

export function TitlesPage({ user, earnedIds = [], onEquipTitle, lang = 'ko' }) {
  const isEn = lang === 'en';
  const equippedTitle = user?.user_metadata?.equipped_title ?? null;

  async function handleEquip(titleId) {
    if (!onEquipTitle || !user) return;
    const next = equippedTitle === titleId ? null : titleId;
    await onEquipTitle(next);
  }

  const earned = TITLES.filter(t => earnedIds.includes(t.id));
  const locked = TITLES.filter(t => !earnedIds.includes(t.id));

  return (
    <main className="titles-page">
      <div className="titles-page-header">
        <h2 className="titles-page-title px">
          🎖️ {isEn ? 'Titles' : '칭호'}
        </h2>
        <p className="titles-page-sub">
          {isEn
            ? 'Earn titles by completing special conditions. Equip one to show it in rankings!'
            : '특별한 조건을 달성하면 칭호를 얻어요. 하나를 장착하면 랭킹에 표시돼요!'}
        </p>
        <div className="titles-page-progress">
          <div
            className="titles-page-progress-bar"
            style={{ width: `${(earned.length / TITLES.length) * 100}%` }}
          />
          <span className="titles-page-progress-text">
            {earned.length} / {TITLES.length}
          </span>
        </div>
      </div>

      {/* 보유 칭호 */}
      {earned.length > 0 && (
        <section className="titles-section">
          <div className="titles-section-label">
            {isEn ? '✅ Earned' : '✅ 보유 칭호'}
          </div>
          <div className="titles-cards">
            {earned.map(t => {
              const s = RARITY[t.rarity];
              const isEquipped = equippedTitle === t.id;
              return (
                <div
                  key={t.id}
                  className={`title-card${isEquipped ? ' equipped' : ''}`}
                  style={{ '--tc': s.color, '--tbg': s.bg, '--tb': s.border }}
                  onClick={() => handleEquip(t.id)}
                >
                  <div className="title-card-top">
                    <span className="title-card-emoji">{t.emoji}</span>
                    <span className={`title-card-rarity rarity-${t.rarity}`}>
                      {isEn ? t.rarity : RARITY_LABEL_KO[t.rarity]}
                    </span>
                  </div>
                  <div className="title-card-name px">{isEn ? t.en : t.ko}</div>
                  <div className="title-card-desc">{isEn ? t.desc_en : t.desc_ko}</div>
                  {user && (
                    <button className={`title-card-equip-btn${isEquipped ? ' on' : ''}`}>
                      {isEquipped
                        ? (isEn ? '✓ Equipped' : '✓ 장착 중')
                        : (isEn ? 'Equip' : '장착하기')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 미획득 칭호 */}
      {locked.length > 0 && (
        <section className="titles-section">
          <div className="titles-section-label">
            {isEn ? '🔒 Locked' : '🔒 미획득 칭호'}
          </div>
          <div className="titles-cards">
            {locked.map(t => (
              <div key={t.id} className="title-card locked">
                <div className="title-card-top">
                  <span className="title-card-emoji locked-emoji">🔒</span>
                  <span className={`title-card-rarity rarity-${t.rarity}`}>
                    {isEn ? t.rarity : RARITY_LABEL_KO[t.rarity]}
                  </span>
                </div>
                <div className="title-card-name px locked-name">{isEn ? t.en : t.ko}</div>
                <div className="title-card-desc">{isEn ? t.desc_en : t.desc_ko}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!user && (
        <div className="titles-login-notice">
          {isEn ? '🔑 Log in to earn and equip titles!' : '🔑 로그인하면 칭호를 획득하고 장착할 수 있어요!'}
        </div>
      )}
    </main>
  );
}

const RARITY_LABEL_KO = {
  common:    '일반',
  rare:      '레어',
  epic:      '에픽',
  legendary: '전설',
};
