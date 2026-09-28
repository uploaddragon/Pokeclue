// 정적 콘텐츠 페이지 생성기 — public/*.html 을 만든다. (애드센스/검색 크롤러가 JS 없이도 읽을 수 있게)
// 실행: node scripts/gen-static-pages.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIRS = [join(ROOT, 'public'), join(ROOT, 'frontend', 'public')];
const SITE = 'https://www.pokeclue.com';
const EMAIL = 'uploaddragon0723@gmail.com';

const NAV = [
  ['/', '게임 플레이'],
  ['/about.html', '사이트 소개'],
  ['/guide.html', '게임 방법'],
  ['/strategy.html', '추리 전략'],
  ['/faq.html', '자주 묻는 질문'],
  ['/privacy.html', '개인정보처리방침'],
  ['/terms.html', '이용약관'],
];

// ───────── 페이지 본문 ─────────
const PAGES = {
  'about.html': {
    title: '사이트 소개 - PokéClue(포케클루)',
    desc: 'PokéClue(포케클루)는 매일 새로운 포켓몬을 단서로 추리하는 무료 포켓몬 퀴즈 게임입니다. 만든 이유, 운영 방침, 문의 방법을 소개합니다.',
    body: `
<h1>PokéClue(포케클루) 소개</h1>
<p>PokéClue(포케클루)는 포켓몬을 좋아하는 사람들이 매일 부담 없이 즐길 수 있도록 만든 <strong>무료 브라우저 추리 게임</strong>입니다. 회원가입이나 설치 없이 웹 브라우저에서 바로 플레이할 수 있고, 로그인은 기록을 여러 기기에서 이어 하고 싶을 때만 선택적으로 사용하면 됩니다.</p>

<h2>어떤 게임인가요?</h2>
<p>게임 방식은 단어 추리 게임 &lsquo;Wordle&rsquo;에서 아이디어를 얻었습니다. 매일 자정(한국 시간) 정답 포켓몬이 하나 정해지고, 플레이어는 포켓몬 이름을 입력해 추측합니다. 추측할 때마다 <strong>세대, 타입 1, 타입 2, 진화 단계, 이름 글자 수, 폼</strong> 여섯 가지 항목이 정답과 얼마나 가까운지 색과 화살표로 알려줍니다. 초록색은 정확히 일치, 주황색은 부분 일치, 붉은색은 불일치이고, 세대·진화 단계·글자 수처럼 숫자로 비교되는 항목은 정답이 더 큰지 작은지를 ▲▼로 안내합니다.</p>
<p>이 단서를 조합해 후보를 줄여 나가는 과정이 핵심 재미입니다. 처음에는 이름 글자 수나 세대로 크게 범위를 좁히고, 타입 단서로 후보를 정리한 뒤, 마지막에 진화 단계와 폼으로 정답을 확정하는 식으로 추리를 진행하게 됩니다. 자세한 방법은 <a href="/guide.html">게임 방법</a>과 <a href="/strategy.html">추리 전략</a> 페이지에서 설명합니다.</p>

<h2>수록 범위</h2>
<p>1세대 관동 지방부터 최신 세대까지의 포켓몬과 알로라·갈라르·히스이·팔데아 리전폼, 메가진화, 거다이맥스, 오리진폼·달마모드 같은 특수 폼을 수록하고 있습니다. 새로운 게임이 출시되거나 신규 폼이 공개되면 PokeAPI 등 공개 자료로 타입과 이미지를 확인한 뒤 순차적으로 추가합니다.</p>

<h2>제공하는 모드</h2>
<ul>
<li><strong>데일리</strong> — 하루 한 문제. 모든 플레이어가 같은 정답을 풀고, 시도 횟수로 랭킹을 겨룹니다.</li>
<li><strong>엔드리스</strong> — 횟수 제한 없이 계속 플레이합니다. 하루 3회 도전하는 챌린지 모드는 클리어 시 도감에 등록됩니다.</li>
<li><strong>대전</strong> — 다른 플레이어와 실시간으로 번갈아 추측하며 먼저 맞히는 쪽이 이깁니다.</li>
<li><strong>타입 대전</strong> — 서로 고른 타입 두 개의 조합에 맞는 포켓몬을 먼저 입력하는 5선승제 대결입니다.</li>
</ul>
<p>그 밖에 발견한 포켓몬(이로치 포함)을 모으는 <strong>도감</strong>, 플레이 성과에 따라 얻는 <strong>칭호</strong>, 프로필에 설정할 수 있는 프로필 포켓몬 기능이 있습니다.</p>

<h2>운영 방침</h2>
<p>PokéClue는 개인이 운영하는 비상업적 팬 프로젝트입니다. 닌텐도, 게임프리크, 크리처스, 더 포켓몬 컴퍼니와 제휴 관계가 없으며, 포켓몬 및 관련 명칭·캐릭터·이미지의 권리는 각 권리자에게 있습니다. 서비스 유지 비용을 충당하기 위해 광고를 게재할 수 있으며, 광고와 개인정보 처리에 관한 내용은 <a href="/privacy.html">개인정보처리방침</a>에서 확인하실 수 있습니다.</p>

<h2>문의 및 제안</h2>
<p>오류 제보, 누락된 포켓몬·폼 제보, 기능 제안은 언제든 환영합니다. 이메일 <a href="mailto:${EMAIL}">${EMAIL}</a> 또는 <a href="https://www.instagram.com/poke_clue_/" rel="noopener">인스타그램 @poke_clue_</a>로 연락해 주세요.</p>`,
  },

  'guide.html': {
    title: '게임 방법 - PokéClue(포케클루)',
    desc: 'PokéClue 게임 방법을 단계별로 설명합니다. 여섯 가지 단서 항목의 의미, 색과 화살표 읽는 법, 필터와 이로치 확률, 각 모드의 규칙을 정리했습니다.',
    body: `
<h1>게임 방법</h1>
<p>PokéClue의 목표는 하나입니다. <strong>오늘 숨겨진 포켓몬이 무엇인지 최대한 적은 시도로 맞히는 것</strong>입니다. 시도 횟수에는 제한이 없지만, 랭킹은 적은 횟수로 맞힌 사람이 위에 오르므로 단서를 잘 읽는 것이 중요합니다.</p>

<h2>1단계. 아무 포켓몬이나 입력하기</h2>
<p>화면 위쪽 입력창에 포켓몬 이름을 입력하면 자동완성 목록이 나타납니다. 목록에서 포켓몬을 클릭하거나 Enter 키(또는 &lsquo;맞히기&rsquo; 버튼)를 눌러 제출하세요. 같은 이름의 폼(알로라폼, 갈라르폼, 메가진화 등)이 여러 개인 경우 목록에 폼 이름이 함께 표시되니 원하는 항목을 직접 선택해야 합니다.</p>

<h2>2단계. 여섯 가지 단서 읽기</h2>
<p>제출하면 표에 한 줄이 추가되고, 각 칸의 색으로 정답과의 관계를 알려줍니다.</p>
<ul>
<li><strong>세대</strong> — 처음 등장한 세대입니다. 메가진화·거다이맥스는 원래 포켓몬의 세대를 따릅니다. 숫자가 다르면 정답이 더 앞 세대인지 뒤 세대인지 ▲▼로 알려줍니다.</li>
<li><strong>타입 1 / 타입 2</strong> — 포켓몬의 첫째·둘째 타입입니다. 단일 타입 포켓몬의 타입 2는 &lsquo;없음&rsquo;입니다. 타입 순서가 바뀌어 있으면(정답이 물/땅인데 땅/물을 입력) 주황색 부분 일치로 표시됩니다.</li>
<li><strong>진화 단계</strong> — 1단계(기본), 2단계, 3단계 중 어디인지입니다. 진화하지 않는 포켓몬은 1단계로 취급합니다.</li>
<li><strong>글자 수</strong> — 한글 이름의 글자 수입니다. 영어 모드에서는 영문 철자 수를 기준으로 합니다.</li>
<li><strong>폼</strong> — 기본 폼인지, 리전폼·메가진화·거다이맥스 같은 특수 폼인지 구분합니다.</li>
</ul>

<h2>색과 화살표의 의미</h2>
<ul>
<li><strong style="color:#2e9e3f">초록</strong> — 정답과 정확히 일치합니다.</li>
<li><strong style="color:#d9822b">주황</strong> — 부분 일치입니다. 예를 들어 입력한 포켓몬의 타입 중 하나가 정답의 다른 타입 칸에 있는 경우입니다.</li>
<li><strong style="color:#c0392b">빨강</strong> — 일치하지 않습니다. 숫자 항목은 ▲(정답이 더 큼) 또는 ▼(정답이 더 작음)이 함께 표시됩니다.</li>
</ul>

<h2>3단계. 후보를 좁혀 정답 맞히기</h2>
<p>쌓인 단서를 모두 만족하는 포켓몬이 정답입니다. 막히면 <strong>필터</strong> 버튼을 눌러 지금까지의 단서에 맞는 후보 목록을 볼 수 있습니다. 다만 필터를 한 번이라도 열면 이로치 획득 확률이 10%에서 1%로 줄어드니, 도전 정신이 있다면 필터 없이 풀어 보세요.</p>

<h2>이로치 시스템</h2>
<p>데일리에서 정답을 맞히면 그 포켓몬이 도감에 등록됩니다. 이때 필터를 쓰지 않았다면 10%, 썼다면 1% 확률로 <strong>이로치(색이 다른 포켓몬)</strong>로 등록됩니다. 이로치로 등록되면 클리어 화면의 스프라이트도 이로치 모습으로 바뀝니다.</p>

<h2>모드별 규칙</h2>
<h3>데일리</h3>
<p>하루에 한 번, 모든 사람이 같은 정답을 풉니다. 매일 자정(KST)에 새 문제로 바뀌며, 로그인하면 오늘의 랭킹에 기록이 올라갑니다.</p>
<h3>엔드리스</h3>
<p>일반 모드는 필터를 쓰며 무제한으로 연습할 수 있고 도감에는 등록되지 않습니다. 챌린지 모드는 하루 3회, 8번 이내에 정답을 맞혀야 하며 필터를 쓸 수 없는 대신 클리어 시 도감에 등록됩니다.</p>
<h3>대전</h3>
<p>두 명이 같은 정답을 두고 번갈아 한 번씩 추측합니다. 추측 결과는 두 사람 모두에게 공개되므로 상대의 추측도 좋은 단서가 됩니다. 한 턴은 30초이며, 시간 안에 입력하지 않으면 턴이 넘어가고 3번 연속 넘기면 패배합니다.</p>
<h3>타입 대전</h3>
<p>매 라운드 각자 10초 안에 타입 하나를 고르고, 둘 다 고르면 3초 카운트다운 뒤 동시에 공개됩니다. 공개된 두 타입(순서 무관)을 모두 가진 포켓몬을 먼저 입력하는 사람이 라운드를 가져가며, 5라운드를 먼저 따면 승리합니다. 같은 타입을 두 번 고르면 해당 타입 단일 포켓몬이 정답이고, 조건에 맞는 포켓몬이 없는 조합이면 승자 없이 다음 라운드로 넘어갑니다.</p>

<p>더 잘 풀고 싶다면 <a href="/strategy.html">추리 전략</a>도 참고해 보세요.</p>`,
  },

  'strategy.html': {
    title: '포켓몬 추리 전략 가이드 - PokéClue(포케클루)',
    desc: '첫 추측 고르는 법, 단서 해석 요령, 타입 조합으로 후보 줄이기 등 PokéClue를 더 적은 횟수로 푸는 전략을 소개합니다.',
    body: `
<h1>추리 전략 가이드</h1>
<p>PokéClue는 운보다 <strong>정보를 얼마나 효율적으로 얻느냐</strong>가 승부를 가릅니다. 아래 요령을 익히면 평균 시도 횟수를 눈에 띄게 줄일 수 있습니다.</p>

<h2>1. 첫 추측은 &lsquo;정보량&rsquo;이 큰 포켓몬으로</h2>
<p>첫 추측의 목적은 맞히는 것이 아니라 <strong>범위를 크게 가르는 것</strong>입니다. 세대가 중간쯤이고, 진화 단계가 2단계이며, 흔한 타입 조합을 가진 포켓몬을 고르면 어떤 결과가 나와도 후보가 크게 줄어듭니다. 반대로 특수 폼이나 매우 드문 타입 조합은 첫 추측으로 좋지 않습니다. 정답과 다르다는 정보 외에는 얻는 게 적기 때문입니다.</p>

<h2>2. 세대 단서는 이분 탐색처럼</h2>
<p>세대 칸의 ▲▼는 정답이 더 앞/뒤 세대라는 뜻입니다. 3세대를 입력해 ▲가 나오면 1~2세대이거나 4세대 이후 중 방향이 정해지므로, 다음엔 방향에 맞는 중간 세대로 이동하면 몇 번 안에 세대를 확정할 수 있습니다.</p>

<h2>3. 타입은 &lsquo;부분 일치&rsquo;를 놓치지 말기</h2>
<p>주황색 타입 칸은 &ldquo;그 타입은 정답에 있지만 위치(타입 1/2)가 다르다&rdquo;는 뜻입니다. 이 정보만으로도 정답이 그 타입을 가졌다는 사실이 확정되므로 후보가 크게 줄어듭니다. 두 타입이 모두 주황이라면 정답은 그 두 타입의 순서를 바꾼 조합입니다.</p>

<h2>4. 글자 수와 진화 단계로 마무리</h2>
<p>세대와 타입이 정리되면 남은 후보는 보통 수십 마리 이하입니다. 이때 글자 수와 진화 단계를 함께 걸면 한두 마리로 압축됩니다. 이름이 3글자인 3단계 진화 포켓몬은 생각보다 많지 않습니다. 진화 계열(기본·중간·최종)을 떠올리며 단계에 맞는 포켓몬을 찾아보세요.</p>

<h2>5. 폼 단서 활용</h2>
<p>폼 칸이 &lsquo;기본&rsquo;으로 일치했다면 메가진화·리전폼·거다이맥스는 정답이 아닙니다. 반대로 폼이 불일치라면 정답이 특수 폼이라는 뜻이니, 알로라·갈라르·히스이·팔데아 리전폼이나 메가진화 목록을 먼저 떠올려 보세요. 같은 이름의 폼이 여러 개라면 타입이 달라지는 경우가 많다는 점도 힌트입니다(예: 알로라 나인테일은 얼음/페어리).</p>

<h2>6. 필터는 마지막 수단으로</h2>
<p>필터는 강력하지만 이로치 확률이 1%로 떨어집니다. 후보가 10마리 안쪽으로 줄었는데 결정을 못 하겠을 때만 여는 것을 권장합니다. 그전까지는 단서를 표로 정리하며 직접 추리해 보세요.</p>

<h2>대전 모드 팁</h2>
<ul>
<li>상대의 추측 결과도 공개되니, 상대가 고른 포켓몬이 어떤 정보를 주는지 함께 분석하세요.</li>
<li>내 턴에는 30초 제한이 있으므로, 상대 턴에 미리 다음 추측 후보를 정해두면 유리합니다.</li>
</ul>

<h2>타입 대전 팁</h2>
<ul>
<li>상대가 어떤 타입을 고를지 예측해 보세요. 자주 쓰이는 타입 조합(예: 물/땅, 불꽃/비행)은 정답 후보가 많아 빠르게 입력하기 좋습니다.</li>
<li>같은 타입을 두 번 고르는 단일 타입 라운드는 후보가 적어질 수 있으니 미리 단일 타입 포켓몬을 떠올려 보세요.</li>
<li>어떤 조합은 해당하는 포켓몬이 없습니다. 이 경우 승자 없이 넘어가므로 무리하게 입력하지 않아도 됩니다. 10초가 지나도 정답이 나오지 않으면 실루엣 힌트가 나타납니다.</li>
</ul>
`,
  },

  'faq.html': {
    title: '자주 묻는 질문(FAQ) - PokéClue(포케클루)',
    desc: 'PokéClue 이용 중 자주 묻는 질문: 로그인, 랭킹, 이로치 확률, 폼 표기, 오류 제보 방법 등을 정리했습니다.',
    body: `
<h1>자주 묻는 질문 (FAQ)</h1>

<h2>로그인을 꼭 해야 하나요?</h2>
<p>아니요. 로그인하지 않아도 모든 모드를 플레이할 수 있습니다. 다만 로그인하지 않으면 도감·칭호·랭킹 기록이 이 브라우저에만 저장되므로, 브라우저 데이터를 지우면 사라질 수 있습니다. Google 또는 Discord로 로그인하면 여러 기기에서 기록이 동기화됩니다.</p>

<h2>정답은 언제 바뀌나요?</h2>
<p>데일리 문제는 매일 자정(한국 표준시, KST)에 새로 바뀝니다. 모든 플레이어가 같은 정답을 풉니다.</p>

<h2>이로치 확률은 어떻게 정해지나요?</h2>
<p>데일리 정답을 맞힐 때 필터를 한 번도 열지 않았다면 10%, 한 번이라도 열었다면 1%입니다. 대전 모드에서 승리한 경우에는 1% 확률이 적용됩니다.</p>

<h2>같은 이름의 포켓몬이 여러 개 나오는데요?</h2>
<p>알로라·갈라르·히스이·팔데아 리전폼, 메가진화, 거다이맥스처럼 이름이 같은 폼은 자동완성 목록에 폼 이름이 함께 표시됩니다. 원하는 항목을 직접 클릭해서 선택하세요. 정답도 폼까지 정확히 일치해야 정답으로 인정됩니다.</p>

<h2>메가진화나 특수 폼의 세대는 어떻게 분류되나요?</h2>
<p>원래(기본 폼) 포켓몬이 처음 등장한 세대를 기준으로 분류합니다. 예를 들어 메가리자몽은 1세대로 취급합니다.</p>

<h2>스프라이트(이미지)가 안 보여요.</h2>
<p>이미지는 외부 저장소(PokeAPI)에서 불러옵니다. 네트워크 상태에 따라 일시적으로 보이지 않을 수 있으니 새로고침해 보시고, 계속 안 보이는 포켓몬이 있다면 이름과 함께 제보해 주세요.</p>

<h2>대전 중에 상대가 나가면 어떻게 되나요?</h2>
<p>상대의 연결이 끊기면 남은 플레이어의 승리로 처리됩니다. 다만 게임이 사실상 시작되기 전(3턴 이하)에 끝난 경우 전적에는 기록되지 않습니다.</p>

<h2>누락되었거나 잘못된 포켓몬 정보를 발견했어요.</h2>
<p>타입, 진화 단계, 세대, 폼 정보가 틀렸거나 새로 추가되어야 할 포켓몬이 있다면 <a href="mailto:${EMAIL}">${EMAIL}</a> 또는 <a href="https://www.instagram.com/poke_clue_/" rel="noopener">인스타그램</a>으로 알려주세요. 확인 후 반영합니다.</p>

<h2>광고는 어떻게 사용되나요?</h2>
<p>서비스 운영 비용을 위해 광고를 게재할 수 있습니다. 자세한 내용은 <a href="/privacy.html">개인정보처리방침</a>을 참고해 주세요.</p>`,
  },

  'privacy.html': {
    title: '개인정보처리방침 - PokéClue(포케클루)',
    desc: 'PokéClue(포케클루)가 수집하는 정보, 이용 목적, 제3자 서비스(Supabase, Google 애드센스), 이용자의 권리에 대한 개인정보처리방침입니다.',
    body: `
<h1>개인정보처리방침</h1>
<p>최종 수정일: 2026-01-01</p>
<p>PokéClue(이하 &ldquo;본 사이트&rdquo;)는 이용자의 개인정보를 소중히 다룹니다. 본 방침은 본 사이트가 수집하는 정보의 종류와 이용 목적, 이용자가 행사할 수 있는 권리를 안내합니다.</p>

<h2>1. 수집하는 정보</h2>
<ul>
<li><strong>계정 정보:</strong> Google 또는 Discord로 로그인하는 경우, Supabase Authentication을 통해 해당 서비스로부터 이메일 주소, 표시 이름, 프로필 사진을 전달받습니다.</li>
<li><strong>게임 플레이 데이터:</strong> 랭킹, 통계, 진행 상황 동기화를 위해 추측 기록, 시도 횟수, 도감 등록 내역, 획득 칭호, 데일리/대전 결과가 저장됩니다.</li>
<li><strong>로컬 저장소 / 쿠키:</strong> 언어 설정, 익명 세션 식별자, 튜토리얼 확인 여부, 방문 간 게임 상태를 기억하는 데 사용됩니다.</li>
</ul>

<h2>2. 정보 이용 목적</h2>
<p>수집된 정보는 로그인 인증, 진행 상황 저장, 랭킹 표시, 칭호/도감 표시 등 사이트의 핵심 기능 제공을 위해서만 사용되며, 개인정보를 제3자에게 판매하지 않습니다.</p>

<h2>3. 제3자 서비스</h2>
<ul>
<li><strong>Supabase</strong> — 로그인 인증 및 데이터베이스 호스팅에 사용됩니다.</li>
<li><strong>Vercel</strong> — 웹사이트 호스팅에 사용됩니다.</li>
<li><strong>Google 애드센스</strong> — 본 사이트에 광고를 게재합니다. Google과 광고 파트너는 이전 방문 기록을 바탕으로 맞춤 광고를 제공하기 위해 쿠키를 사용할 수 있습니다. <a href="https://adssettings.google.com" rel="noopener">Google 광고 설정</a>에서 맞춤 광고 수신을 거부할 수 있습니다.</li>
</ul>

<h2>4. 이용자의 권리</h2>
<p>언제든지 로그아웃할 수 있으며, 계정 데이터 삭제를 원하시면 <a href="mailto:${EMAIL}">${EMAIL}</a>으로 이메일을 보내주세요. 브라우저 설정에서 쿠키와 로컬 저장소를 직접 삭제할 수도 있습니다.</p>

<h2>5. 아동의 개인정보</h2>
<p>본 사이트는 만 13세 미만 아동을 대상으로 하지 않으며, 고의로 아동의 개인정보를 수집하지 않습니다.</p>

<h2>6. 방침의 변경</h2>
<p>본 방침은 법령이나 서비스 변경에 따라 수정될 수 있으며, 변경 시 이 페이지의 최종 수정일을 갱신합니다.</p>

<h2>7. 문의</h2>
<p>본 방침에 대한 문의는 <a href="mailto:${EMAIL}">${EMAIL}</a>으로 연락해주세요.</p>`,
  },

  'terms.html': {
    title: '이용약관 - PokéClue(포케클루)',
    desc: 'PokéClue(포케클루) 서비스 이용약관: 서비스 이용 규칙, 계정, 지식재산권, 면책 조항 등을 안내합니다.',
    body: `
<h1>이용약관</h1>
<p>최종 수정일: 2026-01-01</p>
<p>PokéClue에 접속하거나 이를 이용함으로써 아래 약관에 동의하는 것으로 간주됩니다.</p>

<h2>1. 서비스 이용</h2>
<p>PokéClue는 개인적, 비상업적 오락 목적으로 무료 제공됩니다. 서비스를 악용하거나 방해하는 행위, 리버스 엔지니어링, 자동화 도구를 이용한 랭킹/대전 결과 조작 행위를 해서는 안 됩니다.</p>

<h2>2. 계정</h2>
<p>로그인은 선택 사항입니다. Google 또는 Discord로 계정을 생성한 경우 로그인 정보 보안에 대한 책임은 이용자 본인에게 있습니다. 랭킹 또는 대전 시스템을 악용한 것으로 확인되는 계정은 진행 상황이 초기화되거나 이용이 제한될 수 있습니다.</p>

<h2>3. 지식재산권</h2>
<p>PokéClue는 비공식 팬 프로젝트입니다. 포켓몬 명칭, 캐릭터 디자인, 스프라이트 이미지의 권리는 닌텐도, 게임프리크, 크리처스, 더 포켓몬 컴퍼니에 있으며 비상업적인 정보 제공 목적으로만 사용됩니다. 사이트의 코드, 레이아웃, 텍스트 등 원 저작물의 권리는 사이트 운영자에게 있습니다.</p>

<h2>4. 면책 조항</h2>
<p>본 서비스는 &ldquo;있는 그대로&rdquo; 제공되며, 중단 없는 이용이나 오류 없는 동작을 보장하지 않습니다.</p>

<h2>5. 약관 변경</h2>
<p>본 약관은 변경될 수 있으며, 변경 후에도 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 간주됩니다.</p>

<h2>6. 문의</h2>
<p>본 약관에 대한 문의는 <a href="mailto:${EMAIL}">${EMAIL}</a>으로 연락해주세요.</p>`,
  },
};

// ───────── 템플릿 ─────────
const STYLE = `
*{box-sizing:border-box}
body{margin:0;background:#ece5d4;color:#1a1a1a;font-family:'Pretendard','Noto Sans KR',system-ui,sans-serif;line-height:1.8;font-size:16px}
header{background:#c8322c;border-bottom:4px solid #1a1a1a}
.hd{max-width:920px;margin:0 auto;padding:14px 20px;display:flex;flex-wrap:wrap;align-items:center;gap:14px}
.logo{font-weight:900;font-size:22px;color:#fff;text-decoration:none;letter-spacing:.06em}
.logo span{color:#ffd23f}
nav{display:flex;flex-wrap:wrap;gap:6px 14px}
nav a{color:#fff;text-decoration:none;font-size:14px;opacity:.9}
nav a:hover,nav a.on{opacity:1;text-decoration:underline}
main{max-width:820px;margin:28px auto;padding:0 20px}
article{background:#fff;border:3px solid #1a1a1a;box-shadow:6px 6px 0 #1a1a1a;border-radius:6px;padding:32px 36px}
h1{font-size:28px;margin:0 0 16px}
h2{font-size:20px;margin:30px 0 8px;padding-bottom:4px;border-bottom:2px solid #eee}
h3{font-size:17px;margin:20px 0 4px}
p{margin:0 0 14px}
ul{margin:0 0 14px 22px;padding:0}
li{margin-bottom:6px}
a{color:#c8322c}
.tbl{overflow-x:auto;margin-bottom:14px}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{border:1px solid #ddd;padding:8px 10px;text-align:left;vertical-align:top}
thead th{background:#1a1a1a;color:#fff}
tbody th{background:#f6f2e7;white-space:nowrap}
.cta{display:inline-block;margin:6px 0 24px;padding:12px 22px;background:#2e9e3f;color:#fff;font-weight:700;text-decoration:none;border:3px solid #1a1a1a;box-shadow:3px 3px 0 #1a1a1a;border-radius:6px}
footer{max-width:820px;margin:0 auto 40px;padding:0 20px;font-size:13px;color:#666;text-align:center}
footer a{color:#666}
@media(max-width:600px){article{padding:22px 18px}h1{font-size:24px}}
`;

function render(file, p) {
  const url = `${SITE}/${file}`;
  const nav = NAV.map(([href, label]) =>
    `<a href="${href}"${href === '/' + file ? ' class="on"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<link rel="canonical" href="${url}">
<link rel="icon" type="image/png" href="/favicon.png">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${STYLE}</style>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2182640585423147" crossorigin="anonymous"></script>
</head>
<body>
<header><div class="hd"><a class="logo" href="/">POKÉ<span>CLUE</span></a><nav>${nav}</nav></div></header>
<main>
<article>
${p.body}
<p><a class="cta" href="/">▶ 지금 게임 플레이하기</a></p>
</article>
</main>
<footer>© 2026 PokéClue · 비공식 팬 프로젝트이며 닌텐도·게임프리크·더 포켓몬 컴퍼니와 무관합니다.<br>문의: <a href="mailto:${EMAIL}">${EMAIL}</a></footer>
</body>
</html>
`;
}

for (const dir of OUT_DIRS) mkdirSync(dir, { recursive: true });
for (const [file, p] of Object.entries(PAGES)) {
  const html = render(file, p);
  for (const dir of OUT_DIRS) writeFileSync(join(dir, file), html);
}

const urls = ['/', ...Object.keys(PAGES).map(f => '/' + f)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE}${u}</loc>
    <changefreq>${u === '/' ? 'daily' : 'monthly'}</changefreq>
    <priority>${u === '/' ? '1.0' : '0.7'}</priority>
  </url>`).join('\n')}
</urlset>
`;
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
for (const dir of OUT_DIRS) {
  writeFileSync(join(dir, 'sitemap.xml'), sitemap);
  writeFileSync(join(dir, 'robots.txt'), robots);
}
console.log('generated', Object.keys(PAGES).length, 'pages');
