// ── 칭호 정의 ──────────────────────────────────────

// 타입별 3티어 구조
// threshold: 해당 티어 달성에 필요한 도감 등록 수
export const TYPE_TIERS = [
  {
    type: '노말',
    tiers: [
      { id: 'type_normal_1', ko: '비즈니스맨',    emoji: '💼', threshold: 10,  rarity: 'common' },
      { id: 'type_normal_2', ko: '꼭두',          emoji: '💼', threshold: 59,  rarity: 'rare'   },
      { id: 'type_normal_3', ko: '순백플레이트',  emoji: '💼', threshold: 118, rarity: 'epic'   },
    ],
  },
  {
    type: '불꽃',
    tiers: [
      { id: 'type_fire_1', ko: '불놀이꾼',       emoji: '🔥', threshold: 10, rarity: 'common' },
      { id: 'type_fire_2', ko: '민지',           emoji: '🔥', threshold: 40, rarity: 'rare'   },
      { id: 'type_fire_3', ko: '불구슬플레이트', emoji: '🔥', threshold: 80, rarity: 'epic'   },
    ],
  },
  {
    type: '물',
    tiers: [
      { id: 'type_water_1', ko: '비키니 아가씨',   emoji: '💧', threshold: 10,  rarity: 'common' },
      { id: 'type_water_2', ko: '이슬',            emoji: '💧', threshold: 69,  rarity: 'rare'   },
      { id: 'type_water_3', ko: '물방울플레이트',  emoji: '💧', threshold: 138, rarity: 'epic'   },
    ],
  },
  {
    type: '풀',
    tiers: [
      { id: 'type_grass_1', ko: '아로마 아가씨',  emoji: '🌿', threshold: 10,  rarity: 'common' },
      { id: 'type_grass_2', ko: '민화',           emoji: '🌿', threshold: 57,  rarity: 'rare'   },
      { id: 'type_grass_3', ko: '초록플레이트',   emoji: '🌿', threshold: 114, rarity: 'epic'   },
    ],
  },
  {
    type: '전기',
    tiers: [
      { id: 'type_electric_1', ko: '전기 작업원',  emoji: '⚡', threshold: 10, rarity: 'common' },
      { id: 'type_electric_2', ko: '모야모',       emoji: '⚡', threshold: 34, rarity: 'rare'   },
      { id: 'type_electric_3', ko: '우뢰플레이트', emoji: '⚡', threshold: 69, rarity: 'epic'   },
    ],
  },
  {
    type: '얼음',
    tiers: [
      { id: 'type_ice_1', ko: '스키선수',        emoji: '❄️', threshold: 10, rarity: 'common' },
      { id: 'type_ice_2', ko: '멜론',            emoji: '❄️', threshold: 25, rarity: 'rare'   },
      { id: 'type_ice_3', ko: '고드름플레이트',  emoji: '❄️', threshold: 50, rarity: 'epic'   },
    ],
  },
  {
    type: '격투',
    tiers: [
      { id: 'type_fighting_1', ko: '태권왕',      emoji: '🥊', threshold: 10, rarity: 'common' },
      { id: 'type_fighting_2', ko: '코르니',      emoji: '🥊', threshold: 37, rarity: 'rare'   },
      { id: 'type_fighting_3', ko: '주먹플레이트', emoji: '🥊', threshold: 74, rarity: 'epic'   },
    ],
  },
  {
    type: '독',
    tiers: [
      { id: 'type_poison_1', ko: '닌자놀이',    emoji: '☠️', threshold: 10, rarity: 'common' },
      { id: 'type_poison_2', ko: '보미카',      emoji: '☠️', threshold: 39, rarity: 'rare'   },
      { id: 'type_poison_3', ko: '맹독플레이트', emoji: '☠️', threshold: 78, rarity: 'epic'   },
    ],
  },
  {
    type: '땅',
    tiers: [
      { id: 'type_ground_1', ko: '등산가',      emoji: '⛰️', threshold: 10, rarity: 'common' },
      { id: 'type_ground_2', ko: '비주기',      emoji: '⛰️', threshold: 35, rarity: 'rare'   },
      { id: 'type_ground_3', ko: '대지플레이트', emoji: '⛰️', threshold: 70, rarity: 'epic'   },
    ],
  },
  {
    type: '비행',
    tiers: [
      { id: 'type_flying_1', ko: '새 조련사',       emoji: '🦅', threshold: 10,  rarity: 'common' },
      { id: 'type_flying_2', ko: '풍란',            emoji: '🦅', threshold: 52,  rarity: 'rare'   },
      { id: 'type_flying_3', ko: '푸른하늘플레이트', emoji: '🦅', threshold: 105, rarity: 'epic'   },
    ],
  },
  {
    type: '에스퍼',
    tiers: [
      { id: 'type_psychic_1', ko: '초능력자',      emoji: '🔮', threshold: 10,  rarity: 'common' },
      { id: 'type_psychic_2', ko: '초련',          emoji: '🔮', threshold: 53,  rarity: 'rare'   },
      { id: 'type_psychic_3', ko: '이상한플레이트', emoji: '🔮', threshold: 106, rarity: 'epic'   },
    ],
  },
  {
    type: '벌레',
    tiers: [
      { id: 'type_bug_1', ko: '곤충채집소년',     emoji: '🐛', threshold: 10, rarity: 'common' },
      { id: 'type_bug_2', ko: '단풍',            emoji: '🐛', threshold: 40, rarity: 'rare'   },
      { id: 'type_bug_3', ko: '비단벌레플레이트', emoji: '🐛', threshold: 79, rarity: 'epic'   },
    ],
  },
  {
    type: '바위',
    tiers: [
      { id: 'type_rock_1', ko: '스톤숍',      emoji: '🪨', threshold: 10, rarity: 'common' },
      { id: 'type_rock_2', ko: '원규',        emoji: '🪨', threshold: 34, rarity: 'rare'   },
      { id: 'type_rock_3', ko: '암석플레이트', emoji: '🪨', threshold: 69, rarity: 'epic'   },
    ],
  },
  {
    type: '고스트',
    tiers: [
      { id: 'type_ghost_1', ko: '오컬트마니아',  emoji: '👻', threshold: 10, rarity: 'common' },
      { id: 'type_ghost_2', ko: '무쿠',         emoji: '👻', threshold: 31, rarity: 'rare'   },
      { id: 'type_ghost_3', ko: '원령플레이트',  emoji: '👻', threshold: 62, rarity: 'epic'   },
    ],
  },
  {
    type: '드래곤',
    tiers: [
      { id: 'type_dragon_1', ko: '드래곤 조련사', emoji: '🐉', threshold: 10, rarity: 'rare'   },
      { id: 'type_dragon_2', ko: '이향',         emoji: '🐉', threshold: 36, rarity: 'epic'   },
      { id: 'type_dragon_3', ko: '용의플레이트',  emoji: '🐉', threshold: 72, rarity: 'legendary' },
    ],
  },
  {
    type: '악',
    tiers: [
      { id: 'type_dark_1', ko: '조무래기',    emoji: '🌑', threshold: 10, rarity: 'common' },
      { id: 'type_dark_2', ko: '마리',        emoji: '🌑', threshold: 35, rarity: 'rare'   },
      { id: 'type_dark_3', ko: '공포플레이트', emoji: '🌑', threshold: 70, rarity: 'epic'   },
    ],
  },
  {
    type: '강철',
    tiers: [
      { id: 'type_steel_1', ko: '작업원',      emoji: '⚙️', threshold: 10, rarity: 'common' },
      { id: 'type_steel_2', ko: '규리',        emoji: '⚙️', threshold: 34, rarity: 'rare'   },
      { id: 'type_steel_3', ko: '강철플레이트', emoji: '⚙️', threshold: 68, rarity: 'epic'   },
    ],
  },
  {
    type: '페어리',
    tiers: [
      { id: 'type_fairy_1', ko: '애호가클럽',   emoji: '🌸', threshold: 10, rarity: 'common' },
      { id: 'type_fairy_2', ko: '릴리에',       emoji: '🌸', threshold: 30, rarity: 'rare'   },
      { id: 'type_fairy_3', ko: '정령플레이트',  emoji: '🌸', threshold: 61, rarity: 'epic'   },
    ],
  },
];

// 모든 타입 티어를 flat하게 모은 배열
export const TYPE_TIER_FLAT = TYPE_TIERS.flatMap(t => t.tiers.map(tier => ({ ...tier, type: t.type })));

// ── 일반 칭호 ──────────────────────────────────────
export const GENERAL_TITLES = [
  {
    id: 'quick',
    ko: '신속',
    en: 'Swift',
    emoji: '⚡',
    desc_ko: '자정 10분 이내(00:00~00:10 KST) 클리어',
    desc_en: 'Cleared within 10 min of midnight (KST)',
    rarity: 'rare',
  },
  {
    id: 'earlybird',
    ko: '일찍기상',
    en: 'Early Bird',
    emoji: '🌅',
    desc_ko: '오전 6시~8시 사이에 클리어',
    desc_en: 'Cleared between 6:00 AM and 8:00 AM',
    rarity: 'common',
  },
  {
    id: 'slowstart',
    ko: '슬로스타트',
    en: 'Slow Start',
    emoji: '🐢',
    desc_ko: '23:50~23:59 사이에 클리어',
    desc_en: 'Cleared between 23:50 and 23:59',
    rarity: 'rare',
  },
  {
    id: 'insomnia',
    ko: '불면',
    en: 'Insomnia',
    emoji: '🌙',
    desc_ko: '새벽 4시~5시 59분 사이에 클리어',
    desc_en: 'Cleared between 4:00 AM and 5:59 AM',
    rarity: 'rare',
  },
  {
    id: 'onehit',
    ko: '일격필살!',
    en: 'One-Hit KO!',
    emoji: '⚔️',
    desc_ko: '엔드리스/대전에서 첫 번째 시도에 정답! (데일리 제외)',
    desc_en: 'First try correct in Endless or Battle! (Daily excluded)',
    rarity: 'legendary',
  },
  {
    id: 'reckless',
    ko: '막말내뱉기',
    en: 'Reckless',
    emoji: '💢',
    desc_ko: '30회 이상 시도 끝에 클리어',
    desc_en: 'Cleared after 30+ attempts',
    rarity: 'common',
  },
  {
    id: 'pallet',
    ko: '태초마을',
    en: 'Pallet Town',
    emoji: '🏠',
    desc_ko: '계정 연동 시 지급',
    desc_en: 'Awarded upon linking your account',
    rarity: 'common',
  },
  {
    id: 'shortpants',
    ko: '반바지 꼬마',
    en: 'Youngster',
    emoji: '👦',
    desc_ko: '데일리 10회 이상 정답',
    desc_en: '10+ total daily clears',
    rarity: 'common',
    progressGroup: 'daily_clears',
    threshold: 10,
  },
  {
    id: 'elitetrainer',
    ko: '엘리트 트레이너',
    en: 'Elite Trainer',
    emoji: '🎖️',
    desc_ko: '데일리 100회 이상 정답',
    desc_en: '100+ total daily clears',
    rarity: 'epic',
    progressGroup: 'daily_clears',
    threshold: 100,
  },
  {
    id: 'champion',
    ko: '챔피언',
    en: 'Champion',
    emoji: '🏆',
    desc_ko: '데일리 365회 이상 정답',
    desc_en: '365+ total daily clears',
    rarity: 'legendary',
    progressGroup: 'daily_clears',
    threshold: 365,
  },
  {
    id: 'gapseok',
    ko: '틈새포착',
    en: 'Gap Finder',
    emoji: '🎯',
    desc_ko: '대전에서 20턴 이상 지난 후 정답 맞히기',
    desc_en: 'Win a battle after 20+ total turns',
    rarity: 'epic',
  },
  {
    id: 'nombungi',
    ko: '놈붕이',
    en: '???',
    emoji: '👾',
    desc_ko: '제가 2월달에..',
    desc_en: 'Back in February..',
    rarity: 'mystery',
  },
  {
    id: 'sparkdust',
    ko: '반짝가루',
    en: 'Stardust',
    emoji: '✨',
    desc_ko: '모든 속성이 일치하지만 정답이 아닌 추측을 10회 이상 누적',
    desc_en: 'Accumulated 10+ guesses matching all attributes but not the answer',
    rarity: 'legendary',
    progressGroup: 'near_miss',
    threshold: 10,
  },
];

// 전체 칭호 배열 (일반 + 타입 전체)
export const TITLES = [...GENERAL_TITLES, ...TYPE_TIER_FLAT];

export const TITLE_MAP = Object.fromEntries(TITLES.map(t => [t.id, t]));

// rarity별 스타일 토큰
export const RARITY = {
  common:    { color: '#5C5852', bg: '#F0EDE6', border: '#C0B89A' },
  rare:      { color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD' },
  epic:      { color: '#6D28D9', bg: '#F5F3FF', border: '#C4B5FD' },
  legendary: { color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
  mystery:   { color: '#E0E0E0', bg: '#1A1A2E', border: '#9B59B6' },
};
