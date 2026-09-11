const CONTACT_EMAIL = 'uploaddragon0723@gmail.com';

function AboutContent({ isEn }) {
  if (isEn) {
    return (
      <>
        <h1>About PokéClue</h1>
        <p>
          PokéClue is a free browser-based deduction game for Pokémon fans. Every day, a new
          Pokémon is chosen as the answer, and players guess it by narrowing down clues such as
          generation, type, evolution stage and name length — inspired by word-guessing games
          like Wordle.
        </p>
        <h2>Game Modes</h2>
        <ul>
          <li><b>Daily</b> — One shared puzzle per day. Compare your try count with other players on the ranking board.</li>
          <li><b>Endless</b> — Play unlimited rounds back to back, any time.</li>
          <li><b>Battle</b> — Real-time 1v1 matches against other players via Supabase Realtime.</li>
        </ul>
        <h2>Other Features</h2>
        <ul>
          <li>A Pokédex that tracks every Pokémon (including shiny variants) you've discovered.</li>
          <li>Collectible titles earned through gameplay milestones.</li>
          <li>Optional Google / Discord sign-in to sync your progress across devices.</li>
        </ul>
        <p>
          PokéClue is an independent fan project and is not affiliated with, endorsed by, or
          sponsored by Nintendo, Game Freak, Creatures Inc., or The Pokémon Company. Pokémon and
          all related names, character designs and sprites are trademarks of their respective
          owners, used here for non-commercial, informational fan purposes.
        </p>
        <p>Questions or feedback? Reach out at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or on <a href="https://www.instagram.com/poke_clue_/" target="_blank" rel="noopener noreferrer">Instagram</a>.</p>
      </>
    );
  }
  return (
    <>
      <h1>PokéClue 소개</h1>
      <p>
        PokéClue(포케클루)는 포켓몬 팬을 위한 무료 브라우저 추리 게임입니다. 매일 새로운 정답
        포켓몬이 정해지고, 플레이어는 세대·타입·진화 단계·이름 글자 수 등의 단서를 좁혀가며
        정답을 맞힙니다. Wordle 같은 단어 추리 게임에서 아이디어를 얻었습니다.
      </p>
      <h2>게임 모드</h2>
      <ul>
        <li><b>데일리</b> — 하루에 하나씩 공개되는 공통 문제입니다. 다른 플레이어들과 시도 횟수를 랭킹으로 비교할 수 있어요.</li>
        <li><b>엔드리스</b> — 횟수 제한 없이 언제든 연속으로 플레이할 수 있습니다.</li>
        <li><b>대전</b> — Supabase Realtime을 이용해 다른 플레이어와 실시간 1:1 대결을 펼칩니다.</li>
      </ul>
      <h2>그 외 기능</h2>
      <ul>
        <li>발견한 모든 포켓몬(이로치 포함)을 기록하는 도감 기능.</li>
        <li>게임 플레이 성과에 따라 획득하는 수집형 칭호 시스템.</li>
        <li>Google / Discord 로그인을 통해 기기 간 진행 상황 동기화(선택 사항).</li>
      </ul>
      <p>
        PokéClue는 개인이 만든 비공식 팬 프로젝트이며, 닌텐도·게임프리크·크리처스·더 포켓몬 컴퍼니와
        아무런 제휴 관계가 없습니다. 포켓몬 및 관련 명칭, 캐릭터 디자인, 스프라이트 이미지의
        저작권은 각 권리자에게 있으며, 비상업적인 팬 활동 목적으로만 사용되었습니다.
      </p>
      <p>문의나 의견이 있으시면 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 또는 <a href="https://www.instagram.com/poke_clue_/" target="_blank" rel="noopener noreferrer">인스타그램</a>으로 연락해주세요.</p>
    </>
  );
}

function PrivacyContent({ isEn }) {
  if (isEn) {
    return (
      <>
        <h1>Privacy Policy</h1>
        <p>Last updated: 2026-01-01</p>
        <p>
          PokéClue ("we", "the site") respects your privacy. This page explains what information
          we collect, how it is used, and the choices available to you.
        </p>
        <h2>1. Information We Collect</h2>
        <ul>
          <li><b>Account info:</b> If you sign in with Google or Discord, we receive your email address, display name, and profile picture from that provider via Supabase Authentication.</li>
          <li><b>Gameplay data:</b> Your guesses, try counts, Pokédex entries, earned titles, and daily/battle results are stored to power rankings, statistics, and progress sync.</li>
          <li><b>Local storage / cookies:</b> Used to remember your language preference, anonymous session ID, and game state between visits.</li>
        </ul>
        <h2>2. How We Use Information</h2>
        <p>Collected data is used solely to operate core site features: authentication, saving your progress, showing rankings, and displaying titles/Pokédex entries. We do not sell your personal data.</p>
        <h2>3. Third-Party Services</h2>
        <ul>
          <li><b>Supabase</b> — authentication and database hosting.</li>
          <li><b>Google AdSense</b> — displays advertising on this site. Google and its partners may use cookies to serve ads based on your prior visits to this or other websites. You can opt out of personalized advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</li>
        </ul>
        <h2>4. Your Choices</h2>
        <p>You may sign out at any time, and you can request deletion of your account data by emailing us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
        <h2>5. Children's Privacy</h2>
        <p>This site is not directed at children under 13, and we do not knowingly collect personal information from children.</p>
        <h2>6. Contact</h2>
        <p>Questions about this policy can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </>
    );
  }
  return (
    <>
      <h1>개인정보처리방침</h1>
      <p>최종 수정일: 2026-01-01</p>
      <p>
        PokéClue(이하 "본 사이트")는 이용자의 개인정보를 소중히 다룹니다. 본 방침은 본 사이트가
        수집하는 정보의 종류와 이용 목적, 이용자가 행사할 수 있는 권리를 안내합니다.
      </p>
      <h2>1. 수집하는 정보</h2>
      <ul>
        <li><b>계정 정보:</b> Google 또는 Discord로 로그인하는 경우, Supabase Authentication을 통해 해당 서비스로부터 이메일 주소, 표시 이름, 프로필 사진을 전달받습니다.</li>
        <li><b>게임 플레이 데이터:</b> 랭킹, 통계, 진행 상황 동기화를 위해 추측 기록, 시도 횟수, 도감 등록 내역, 획득 칭호, 데일리/대전 결과가 저장됩니다.</li>
        <li><b>로컬 저장소 / 쿠키:</b> 언어 설정, 익명 세션 식별자, 방문 간 게임 상태를 기억하는 데 사용됩니다.</li>
      </ul>
      <h2>2. 정보 이용 목적</h2>
      <p>수집된 정보는 로그인 인증, 진행 상황 저장, 랭킹 표시, 칭호/도감 표시 등 사이트의 핵심 기능 제공을 위해서만 사용되며, 개인정보를 제3자에게 판매하지 않습니다.</p>
      <h2>3. 제3자 서비스</h2>
      <ul>
        <li><b>Supabase</b> — 로그인 인증 및 데이터베이스 호스팅에 사용됩니다.</li>
        <li><b>Google 애드센스</b> — 본 사이트에 광고를 게재합니다. Google과 광고 파트너는 이전 방문 기록을 바탕으로 맞춤 광고를 제공하기 위해 쿠키를 사용할 수 있습니다. <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google 광고 설정</a>에서 맞춤 광고 수신을 거부할 수 있습니다.</li>
      </ul>
      <h2>4. 이용자의 권리</h2>
      <p>언제든지 로그아웃할 수 있으며, 계정 데이터 삭제를 원하시면 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>으로 이메일을 보내주세요.</p>
      <h2>5. 아동의 개인정보</h2>
      <p>본 사이트는 만 13세 미만 아동을 대상으로 하지 않으며, 고의로 아동의 개인정보를 수집하지 않습니다.</p>
      <h2>6. 문의</h2>
      <p>본 방침에 대한 문의는 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>으로 연락해주세요.</p>
    </>
  );
}

function TermsContent({ isEn }) {
  if (isEn) {
    return (
      <>
        <h1>Terms of Service</h1>
        <p>Last updated: 2026-01-01</p>
        <p>By accessing or using PokéClue, you agree to the following terms.</p>
        <h2>1. Use of Service</h2>
        <p>PokéClue is provided free of charge for personal, non-commercial entertainment. You agree not to abuse, disrupt, or attempt to reverse-engineer the service, or use automated tools to manipulate rankings or battle results.</p>
        <h2>2. Accounts</h2>
        <p>Signing in is optional. If you create an account via Google or Discord, you are responsible for keeping your login credentials secure. We may reset progress or suspend accounts found to be abusing the ranking or battle systems.</p>
        <h2>3. Intellectual Property</h2>
        <p>PokéClue is an unofficial fan project. Pokémon names, character designs, and sprite artwork belong to Nintendo, Game Freak, Creatures Inc., and The Pokémon Company, and are used here for non-commercial, informational purposes only. All original site code, layout, and text are owned by the site operator.</p>
        <h2>4. Disclaimer</h2>
        <p>The service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted availability or error-free operation.</p>
        <h2>5. Changes</h2>
        <p>These terms may be updated from time to time; continued use of the site after changes constitutes acceptance of the revised terms.</p>
        <h2>6. Contact</h2>
        <p>Questions about these terms can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </>
    );
  }
  return (
    <>
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
      <p>본 서비스는 "있는 그대로" 제공되며, 중단 없는 이용이나 오류 없는 동작을 보장하지 않습니다.</p>
      <h2>5. 약관 변경</h2>
      <p>본 약관은 사전 고지 없이 변경될 수 있으며, 변경 후에도 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 간주됩니다.</p>
      <h2>6. 문의</h2>
      <p>본 약관에 대한 문의는 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>으로 연락해주세요.</p>
    </>
  );
}

export function InfoPage({ type, lang = 'ko' }) {
  const isEn = lang === 'en';
  return (
    <div className="panel info-page">
      {type === 'about' && <AboutContent isEn={isEn} />}
      {type === 'privacy' && <PrivacyContent isEn={isEn} />}
      {type === 'terms' && <TermsContent isEn={isEn} />}
    </div>
  );
}
