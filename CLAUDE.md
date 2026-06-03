# PokeWordle 프로젝트 현황

## 프로젝트 구조
```
pokewordle/
├── frontend/          # React + Vite (메인 작업 폴더)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── data/
│   │   │   ├── pokemon.js   # 포켓몬 DB (1~6세대 + 메가/특수폼)
│   │   │   └── types.js     # 타입 색상/아이콘
│   │   ├── utils/
│   │   │   ├── game.js      # pickAnswer, computeFilter, compareForm, displayName 등
│   │   │   └── sprite.js    # spr(), padId()
│   │   ├── hooks/
│   │   │   ├── useGame.js   # 게임 상태 (submitGuess는 id 기반)
│   │   │   └── useDex.js    # 도감 localStorage
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── Footer.jsx
│   │       ├── GamePage.jsx
│   │       ├── GuessTable.jsx   # 폼 컬럼 조건부 표시
│   │       ├── Autocomplete.jsx # displayName으로 검색/표시, onSubmit(p.id)
│   │       ├── FilterModal.jsx
│   │       ├── ResultBanner.jsx # 다시하기 버튼 없음
│   │       ├── TypeBadge.jsx
│   │       ├── DexPage.jsx
│   │       └── DexModal.jsx
├── backend/           # Node.js + Express (스캐폴드만)
│   └── src/index.js
└── index.html         # 원본 (테스트용)
```

## 실행 방법
```powershell
cd "C:\Users\정연우\Desktop\PokeWordle - 포켓몬 추리 게임_files\pokewordle\frontend"
npm install
npm run dev
# → http://localhost:5173
```

---

## 핵심 설계 결정사항

### 포켓몬 DB (pokemon.js)
- 기본 필드: `{id, ko, en, gen, t1, t2, evo, len, enLen}`
- 특수폼 필드: `{form, baseId}` 추가
- `form` 미지정 = 기본폼으로 자동 처리 (기존 gen1~5 항목 수정 불필요)
- `len` = 한국어 글자수, `enLen` = 영어 글자수

### 폼(Form) 시스템
- **메가진화**: `form:'mega'`, `ko`에 "메가" 포함, id = `'mega/venusaur'` 형식 (스프라이트 경로와 일치)
- **원시회귀**: `form:'primal'`, `ko`에 "원시" 포함, id = PokeAPI 폼 번호 (`'10090'`, `'10091'`)
- **기타 특수폼**: `form:'origin'|'altered'|'heat'|...`, `ko` = 기본 이름만 저장
- `displayName(p)`: 메가/원시는 ko 그대로, 나머지는 `ko(폼이름)` 형식

### 글자수 규칙
- **메가진화**: 메가 이름 전체 길이 (예: 메가리자몽X = 6)
- **기타 특수폼**: 기본 포켓몬 이름 길이와 동일 (예: 기라티나 오리진폼 = 4)

### submitGuess
- `onSubmit(p.id)` — 이름이 아닌 id 기반으로 변경됨
- Autocomplete에서 클릭 시 `p.id` 전달

### 스프라이트 URL
```js
// sprite.js
spr(id) → `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
// 메가: spr('mega/venusaur') → pokemon/mega/venusaur.png
// 원시: spr('10090') → pokemon/10090.png
// 일반폼: spr('487-origin') → pokemon/487-origin.png
```

---

## 포켓몬 DB 현황

### 세대별 수록 범위
- **1세대**: 선택적 수록 (주요 포켓몬) + 캥카(#115), 쁘사이저(#127), 프테라(#142) 추가
- **2세대**: 선택적 수록
- **3세대**: 선택적 수록 + 캐스퐁(#351), 입치트(#303), 보스로라(#306), 요가램(#308), 썬더볼트(#310) 추가
- **4세대**: 선택적 수록
- **5세대**: 선택적 수록
- **6세대**: 전체 수록 (#650~#721)

### 특수폼 수록 현황
| 포켓몬 | 폼 |
|--------|-----|
| 꼬렛 / 레트라 | 기본 / 알로라폼 |
| 라이츄 | 기본 / 알로라폼 |
| 모래두지 / 고지 | 기본 / 알로라폼 |
| 식스테일 | 기본 / 알로라폼 |
| 디그다 / 닥트리오 | 기본 / 알로라폼 |
| 나옹 / 페르시온 | 기본 / 알로라폼 |
| 꼬마돌 / 데구리 / 딱구리 | 기본 / 알로라폼 |
| 질퍽이 / 질뻐기 | 기본 / 알로라폼 |
| 나시 | 기본 / 알로라폼 |
| 텅구리 | 기본 / 알로라폼 |
| 기라티나 | 어나더폼 / 오리진폼 |
| 로토무 | 기본 / 히트 / 워시 / 프로스트 / 커트 / 스핀 |
| 쉐이미 | 랜드폼 / 스카이폼 |
| 불비달마 | 노말모드 / 달마모드 |
| 토네로스 / 볼트로스 / 랜드로스 | 화신폼 / 영물폼 |
| 큐레무 | 기본 / 블랙 / 화이트 |
| 테오키스 | 노말폼 / 어택폼 / 디펜스폼 / 스피드폼 |
| 캐스퐁 | 기본 / 태양의 모습 / 빗방울의 모습 / 설운의 모습 |

### 메가진화 수록 현황 (6세대 기준 전체)
1세대: 이상해꽃, 리자몽X/Y, 거북왕, 독침붕, 피죤투, 후딘, 야도란, 팬텀, 캥카, 쁘사이저, 갸라도스, 프테라, 뮤츠X/Y
2세대: 전룡, 강철톤, 핫삼, 헤라크로스, 헬가, 마기라스
3세대: 나무킹, 번치코, 대짱이, 가디안, 깜까미, 입치트, 보스로라, 요가램, 썬더볼트, 파비코리, 앱솔, 라티아스, 라티오스, 레쿠쟈, 보만다, 메타그로스 + 원시가이오가/그란돈
4세대: 이어롭, 엘레이드
5세대: 다부니
6세대: 디안시

---

## 남은 작업 (로드맵)

### Phase 1 — 프론트엔드 (진행 중)
- [x] 6세대 포켓몬 추가 (#650~#721)
- [x] 7세대 포켓몬 추가 (#722~#809)
- [x] 8세대 포켓몬 추가 (#810~#905, 리전폼/특수폼 제외)
- [x] 9세대 포켓몬 추가 (#906~#1025, 리전폼/특수폼 제외)
- [x] 언어 선택 (ko/en 토글) 구현
  - gen1~5+ 포켓몬 `en`, `enLen` 필드 이미 존재 확인
  - `computeFilter`에서 lang 파라미터로 `len`/`enLen` 분기
  - `displayName(p, lang)`, `FORM_LABEL_EN` 추가
  - Autocomplete, GuessTable, FilterModal, ResultBanner 모두 lang 적용
- [ ] 데일리 1문제 고정 + 엔드리스 모드 UI

### Phase 2 — 백엔드 & 인증
- [ ] Supabase Auth (회원가입/로그인/로그아웃)
- [ ] 도감 Supabase 동기화 (현재 localStorage)
- [ ] 데일리 결과 저장 (`daily_results` 테이블)
- [ ] 오늘의 랭킹 (내 순위, 평균 시도 횟수)

### Phase 3 — 게임 모드
- [ ] 엔드리스 모드 완성
- [ ] 실시간 대전 모드 (WebSocket)

---

## DB 스키마 (Supabase, 미구현)
```sql
create table daily_results (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users,
  date       date not null,
  tries      int  not null,
  solved     bool not null,
  used_filter bool not null,
  created_at timestamptz default now(),
  unique (user_id, date)
);
```

---

## 알려진 이슈 / 미확인 사항
- gen1~5 포켓몬 일부 ID가 실제 도감번호와 다를 수 있음 (원본 HTML 기반, 발견 시 수정)
  - ~~잉어킹 id:128, 갸라도스 id:129~~ → 수정 완료 (잉어킹:#129, 갸라도스:#130, 켄타로스:#128 추가)
- ~~메가 스프라이트 ID 오류~~ → 수정 완료 (PokeAPI 실제 ID로 전체 재검증, 39개 항목 수정)
- ~~원시회귀 스프라이트 ID 오류~~ → 수정 완료 (가이오가:10077, 그란돈:10078)
- gen1~5 `en`/`enLen` 필드 미추가 (언어 기능 구현 시 일괄 추가 예정)
