import DB from '../data/pokemon.js';
import ANSWERS from '../data/answers.json';
import { TYPE_EN } from '../data/types.js';

export function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  // Wang hash mixing — 연속된 날짜가 연속된 인덱스로 매핑되지 않도록
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0;
  h ^= (h >>> 16);
  return Math.abs(h);
}

export function pickAnswer() {
  const today = getTodayStr();
  // answers.json 고정 매핑 우선 사용 — DB 변경에도 날짜별 정답 불변
  const id = ANSWERS[today];
  if (id !== undefined) {
    const p = DB.find(p => p.id === id);
    if (p) return p;
  }
  // fallback: 기존 해시 방식 (answers.json 범위 밖 날짜)
  const idx = dateHash(today + 'GJHJ') % DB.length;
  return DB[idx];
}

export const FORM_LABEL_EN = {
  base:     'Base',
  mega:     'Mega',
  origin:   'Origin Forme',
  altered:  'Altered Forme',
  regional: 'Regional Form',
  alola:    'Alolan Form',
  galar:    'Galarian Form',
  gmax:     'Gigantamax',
  primal:   'Primal',
  ultra:    'Ultra',
  totem:    'Totem',
  single:         'Single Strike Style',
  rapid:          'Rapid Strike Style',
  hero:           'Hero of Many Battles',
  'crowned-sword':'Crowned Sword',
  'crowned-shield':'Crowned Shield',
  eternamax:      'Eternamax',
  bloodmoon:      'Bloodmoon',
  'ice-rider':    'Ice Rider',
  'shadow-rider': 'Shadow Rider',
  heat:     'Heat',
  wash:     'Wash',
  frost:    'Frost',
  mow:      'Mow',
  fan:      'Fan',
  baile:    'Baile Style',
  pompom:   'Pom-Pom Style',
  pau:      "Pa'u Style",
  sensu:    'Sensu Style',
  black:    'Black',
  white:    'White',
  dusk:     'Dusk Mane',
  dawn:     'Dawn Wings',
  incarnate:'Incarnate Forme',
  therian:  'Therian Forme',
  normal:   'Normal Forme',
  attack:   'Attack Forme',
  defense:  'Defense Forme',
  speed:    'Speed Forme',
  standard: 'Standard Mode',
  zen:      'Zen Mode',
  sunny:    'Sunny Form',
  rainy:    'Rainy Form',
  snowy:    'Snowy Form',
  land:     'Land Forme',
  sky:      'Sky Forme',
  'teal-mask':        'Teal Mask',
  'wellspring-mask':  'Wellspring Mask',
  'hearthflame-mask': 'Hearthflame Mask',
  'cornerstone-mask': 'Cornerstone Mask',
  terastal: 'Terastal Form',
  stellar:  'Stellar Form',
  naive:    'Naïve Form',
  mighty:   'Mighty Form',
  hisui:    'Hisuian Form',
  confined: 'Confined',
  unbound:  'Unbound',
  paldea:   'Paldean Form',
  combat:   'Combat Breed',
  blaze:    'Blaze Breed',
  aqua:     'Aqua Breed',
};

export const FORM_LABEL = {
  base:     '기본',
  mega:     '메가',
  origin:   '오리진',
  altered:  '어나더',
  regional: '리전',
  alola:    '리전폼',
  galar:    '리전폼',
  gmax:     '거다이맥스',
  primal:   '원시',
  ultra:    '울트라',
  totem:    '토템',
  // 우라오스
  single:         '일격의 태세',
  rapid:          '연격의 태세',
  // 자시안/자마젠타
  hero:           '역전의 용사',
  'crowned-sword':'검왕',
  'crowned-shield':'방패왕',
  // 무한다이노
  eternamax:      '무한다이맥스',
  // 다투곰
  bloodmoon:      '붉은 달',
  // 버드렉스
  'ice-rider':    '백마 탄 모습',
  'shadow-rider': '흑마 탄 모습',
  // 로토무
  heat:     '히트',
  wash:     '워시',
  frost:    '프로스트',
  mow:      '커트',
  fan:      '스핀',
  // 춤추새
  baile:    '이글이글스타일',
  pompom:   '파칙파칙스타일',
  pau:      '훌라훌라스타일',
  sensu:    '하늘하늘스타일',
  // 큐레무
  black:    '블랙',
  white:    '화이트',
  // 네크로즈마
  dusk:     '황혼의 갈기',
  dawn:     '새벽의 날개',
  // 자연의 힘 세 신수
  incarnate:'화신폼',
  therian:  '영물폼',
  // 테오키스
  normal:   '노말폼',
  attack:   '어택폼',
  defense:  '디펜스폼',
  speed:    '스피드폼',
  // 불비달마
  standard: '노말모드',
  zen:      '달마모드',
  // 캐스퐁
  sunny:    '태양의 모습',
  rainy:    '빗방울의 모습',
  snowy:    '설운의 모습',
  // 쉐이미
  land:     '랜드폼',
  sky:      '스카이폼',
  // 오거폰
  'teal-mask':        '벽록의 가면',
  'wellspring-mask':  '우물의 가면',
  'hearthflame-mask': '화덕의 가면',
  'cornerstone-mask': '주춧돌의 가면',
  // 테라파고스
  terastal: '테라스탈폼',
  stellar:  '스텔라폼',
  // 돌핀맨
  naive:    '나이브폼',
  mighty:   '마이티폼',
  // 히스이폼
  hisui:    '리전폼',
  // 후파
  confined: '굴레에 빠진',
  unbound:  '굴레를 벗어난',
  // 팔데아 리전폼
  paldea:   '리전폼',
  // 켄타로스 팔데아 종
  combat:   '컴뱃종',
  blaze:    '블레이즈종',
  aqua:     '워터종',
};

export function formLabel(form, lang = 'ko') {
  if (lang === 'en') return FORM_LABEL_EN[form ?? 'base'] ?? form ?? 'Base';
  return FORM_LABEL[form ?? 'base'] ?? form ?? '기본';
}

export function displayName(p, lang = 'ko') {
  if (lang === 'en') {
    if (!p.form || p.form === 'mega' || p.form === 'primal' || p.form === 'ultra') return p.en;
    const label = FORM_LABEL_EN[p.form] ?? p.form;
    return `${p.en} (${label})`;
  }
  // 메가/원시는 ko에 이미 "메가"/"원시" 포함 → 접미사 불필요
  if (!p.form || p.form === 'mega' || p.form === 'primal' || p.form === 'ultra') return p.ko;
  return `${p.ko}(${formLabel(p.form)})`;
}

// 리전폼 판별 집합 (alola / galar / paldea 및 팔데아 종 포함)
const REGIONAL = new Set(['alola', 'galar', 'hisui', 'paldea', 'combat', 'blaze', 'aqua']);

export function compareForm(guess, answer) {
  const gForm  = guess.form  ?? 'base';
  const aForm  = answer.form ?? 'base';
  const gBase  = guess.baseId  ?? guess.id;
  const aBase  = answer.baseId ?? answer.id;

  if (gForm === aForm)                             return 'cc'; // 완전 일치
  if (REGIONAL.has(gForm) && REGIONAL.has(aForm)) return 'cc'; // 둘 다 리전폼 → 폼 정보 일치
  if (gBase === aBase)                             return 'cp'; // 같은 포켓몬, 다른 폼
  return 'cw';                                                  // 무관
}

export function arrow(val, ans) {
  if (val === ans) return '';
  return val < ans ? ' ↑' : ' ↓';
}

export function computeFilter(answer, guesses, lang = 'ko') {
  const lf = lang === 'en' ? 'enLen' : 'len';

  const maxEvo = Math.max(...DB.map(p => p.evo));
  const maxLen = Math.max(...DB.map(p => p[lf]));
  const minEvoGlobal = Math.min(...DB.map(p => p.evo));
  const minLenGlobal = Math.min(...DB.map(p => p[lf]));

  let genOk = null, t1Ok = null, t2Ok = null, evoOk = null;
  const genNot = new Set(), t1Not = new Set(), t2Not = new Set();
  let evoMin = minEvoGlobal, evoMax = maxEvo, lenMin = minLenGlobal, lenMax = maxLen;
  let lenOk = null;
  let formOk = null;
  const formNot = new Set();

  const aForm = answer.form ?? 'base';

  guesses.forEach(g => {
    if (g.gen === answer.gen) genOk = g.gen;
    else genNot.add(g.gen);

    if (g.t1 === answer.t1) t1Ok = g.t1;
    else if (g.t1 !== answer.t2) t1Not.add(g.t1);

    if (g.t2 === answer.t2) t2Ok = g.t2;
    else if (g.t2 !== answer.t1) t2Not.add(g.t2);

    if (g.evo === answer.evo) evoOk = g.evo;
    else if (g.evo < answer.evo) evoMin = Math.max(evoMin, g.evo + 1);
    else evoMax = Math.min(evoMax, g.evo - 1);

    if (g[lf] === answer[lf]) lenOk = g[lf];
    else if (g[lf] < answer[lf]) lenMin = Math.max(lenMin, g[lf] + 1);
    else lenMax = Math.min(lenMax, g[lf] - 1);

    const gForm = g.form ?? 'base';
    const result = compareForm(g, answer);
    if (result === 'cc') formOk = aForm;
    else {
      const gGroup = REGIONAL.has(gForm) ? 'regional' : gForm;
      formNot.add(gGroup);
    }
  });

  const isEn = lang === 'en';
  const tn = t => isEn ? (TYPE_EN[t] || t) : t;
  const conds = [];
  if (genOk) conds.push({ cls: 'ok', text: isEn ? `Gen = ${genOk}` : `세대 = ${genOk}세대` });
  else if (genNot.size) conds.push({ cls: 'no', text: isEn ? `Gen ≠ ${[...genNot].join(',')}` : `세대 ≠ ${[...genNot].join(',')}세대` });

  if (t1Ok) conds.push({ cls: 'ok', text: isEn ? `Type1 = ${tn(t1Ok)}` : `타입1 = ${t1Ok}` });
  else if (t1Not.size) conds.push({ cls: 'no', text: isEn ? `Type1 ≠ ${[...t1Not].map(tn).join(',')}` : `타입1 ≠ ${[...t1Not].join(',')}` });

  if (t2Ok) conds.push({ cls: 'ok', text: isEn ? `Type2 = ${tn(t2Ok)}` : `타입2 = ${t2Ok}` });
  else if (t2Not.size) conds.push({ cls: 'no', text: isEn ? `Type2 ≠ ${[...t2Not].map(tn).join(',')}` : `타입2 ≠ ${[...t2Not].join(',')}` });

  if (evoOk) conds.push({ cls: 'ok', text: isEn ? `Evo = Stage ${evoOk}` : `진화 = ${evoOk}단계` });
  else if (evoMin > minEvoGlobal || evoMax < maxEvo) conds.push({ cls: 'rng', text: isEn ? `Evo Stage ${evoMin}~${evoMax}` : `진화 ${evoMin}~${evoMax}단계` });

  if (lenOk) conds.push({ cls: 'ok', text: isEn ? `Length = ${lenOk}` : `글자수 = ${lenOk}자` });
  else if (lenMin > minLenGlobal || lenMax < maxLen) conds.push({ cls: 'rng', text: isEn ? `Length ${lenMin}~${lenMax}` : `글자수 ${lenMin}~${lenMax}자` });

  const formGroupLabel = (f) => {
    if (f === 'base') return isEn ? 'Base' : '기본';
    if (f === 'mega') return isEn ? 'Mega' : '메가진화';
    if (f === 'gmax') return isEn ? 'G-Max' : '거다이맥스';
    if (f === 'regional') return isEn ? 'Regional' : '리전폼';
    return formLabel(f, lang);
  };
  if (formOk) {
    const grp = REGIONAL.has(aForm) ? 'regional' : aForm;
    conds.push({ cls: 'ok', text: isEn ? `Form = ${formGroupLabel(grp)}` : `폼 = ${formGroupLabel(grp)}` });
  } else if (formNot.size) {
    conds.push({ cls: 'no', text: isEn ? `Form ≠ ${[...formNot].map(formGroupLabel).join(',')}` : `폼 ≠ ${[...formNot].map(formGroupLabel).join(',')}` });
  }

  const filtered = DB.filter(p => {
    if (guesses.find(g => g.id === p.id)) return false;
    if (genOk && p.gen !== genOk) return false;
    if (!genOk && genNot.has(p.gen)) return false;
    if (t1Ok && p.t1 !== t1Ok) return false;
    if (!t1Ok && t1Not.has(p.t1)) return false;
    if (t2Ok && p.t2 !== t2Ok) return false;
    if (!t2Ok && t2Not.has(p.t2)) return false;
    if (evoOk) { if (p.evo !== evoOk) return false; }
    else { if (p.evo < evoMin || p.evo > evoMax) return false; }
    if (lenOk) { if (p[lf] !== lenOk) return false; }
    else { if (p[lf] < lenMin || p[lf] > lenMax) return false; }
    const pForm = p.form ?? 'base';
    const pGroup = REGIONAL.has(pForm) ? 'regional' : pForm;
    if (formOk) {
      const aGroup = REGIONAL.has(aForm) ? 'regional' : aForm;
      if (pGroup !== aGroup) return false;
    } else if (formNot.size) {
      if (formNot.has(pGroup)) return false;
    }
    return true;
  });

  return { conds, filtered };
}
