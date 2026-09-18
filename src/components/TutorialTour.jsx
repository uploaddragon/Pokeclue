import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pokeclue_tutorial_hidden';

const STEPS = [
  {
    target: 'nav-game',
    title: { ko: '게임 탭', en: 'Game tab' },
    desc: {
      ko: '언제든 여기를 눌러 게임 화면으로 돌아올 수 있어요.',
      en: 'Click here anytime to return to the game screen.',
    },
  },
  {
    target: 'nav-dex',
    title: { ko: '도감 탭', en: 'Dex tab' },
    desc: {
      ko: '지금까지 발견한 포켓몬(이로치 포함)을 모아볼 수 있어요.',
      en: 'See every Pokémon (including shinies) you\'ve discovered so far.',
    },
  },
  {
    target: 'nav-titles',
    title: { ko: '칭호 탭', en: 'Titles tab' },
    desc: {
      ko: '플레이하며 모은 칭호를 확인하고 프로필에 장착할 수 있어요.',
      en: 'Check the titles you\'ve earned and equip one on your profile.',
    },
  },
  {
    target: 'nav-lang',
    title: { ko: '언어 전환', en: 'Language switch' },
    desc: {
      ko: '한국어 / English 표시 언어를 바꿀 수 있어요.',
      en: 'Switch the display language between Korean and English.',
    },
  },
  {
    target: 'nav-login',
    title: { ko: '로그인', en: 'Login' },
    desc: {
      ko: 'Google/Discord로 로그인하면 기록이 기기 간에 동기화되고, 랭킹·칭호·도감이 저장돼요.',
      en: 'Sign in with Google/Discord to sync your progress and save rankings, titles, and your Dex.',
    },
  },
  {
    target: 'game-tabs',
    title: { ko: '게임 모드', en: 'Game modes' },
    desc: {
      ko: '데일리(하루 1문제), 엔드리스(무제한), 대전·타입 대전(실시간 1:1) 중 골라 플레이하세요.',
      en: 'Choose from Daily (one puzzle a day), Endless (unlimited), or real-time 1v1 Battle / Type Battle.',
    },
  },
  {
    target: 'guess-input',
    title: { ko: '이름 입력', en: 'Name input' },
    desc: {
      ko: '여기에 포켓몬 이름을 입력하고 [맞히기]를 누르거나 추천 목록을 클릭해 제출하세요.',
      en: 'Type a Pokémon name here, then press [Guess] or click a suggestion to submit.',
    },
  },
  {
    target: 'filter-btn',
    title: { ko: '필터', en: 'Filter' },
    desc: {
      ko: '지금까지의 단서로 후보 포켓몬 목록을 보여줘요. 단, 사용하면 이로치 확률이 10%→1%로 줄어드니 신중하게!',
      en: 'Shows a list of possible Pokémon based on your clues so far. But using it drops the shiny rate from 10% to 1%!',
    },
  },
  {
    target: 'shiny-chip',
    title: { ko: '이로치 확률', en: 'Shiny rate' },
    desc: {
      ko: '필터 없이 클리어하면 10%, 한 번이라도 필터를 쓰면 1% 확률로 이로치를 획득해요.',
      en: 'Clear without using the filter for a 10% shiny chance — using it even once drops that to 1%.',
    },
  },
];

export function useTutorial() {
  const [active, setActive] = useState(false);
  const [seen, setSeen] = useState(() => {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
  });

  const start = useCallback(() => setActive(true), []);
  const finish = useCallback(() => {
    setActive(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setSeen(true);
  }, []);

  return { active, seen, start, finish };
}

export function TutorialTour({ lang = 'ko', onDone }) {
  const isEn = lang === 'en';
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);

  const step = STEPS[i];

  const measure = useCallback(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) { setRect(null); return; }
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    const r0 = el.getBoundingClientRect();
    const inView = r0.top >= 0 && r0.bottom <= window.innerHeight;
    if (inView) { update(); return; }
    // 이미 보이는 요소는 스크롤 없이 즉시 측정 — smooth 스크롤 애니메이션과
    // 타이머가 어긋나 좌표가 틀어지는 문제를 피하기 위해 필요할 때만,
    // 즉시(behavior:'auto') 스크롤하고 레이아웃이 끝난 뒤(rAF 2번) 측정한다.
    el.scrollIntoView({ block: 'center', behavior: 'auto' });
    requestAnimationFrame(() => requestAnimationFrame(update));
  }, [step]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onDone();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
    if (i >= STEPS.length - 1) onDone();
    else setI(i + 1);
  }
  function prev() {
    setI(v => Math.max(0, v - 1));
  }

  if (!rect) {
    // 대상 요소를 찾지 못하면(모바일 레이아웃 등) 중앙 안내만 표시
    return (
      <div className="tour-bg" onClick={onDone}>
        <div className="tour-center-card" onClick={e => e.stopPropagation()}>
          <div className="tour-title">{step.title[isEn ? 'en' : 'ko']}</div>
          <div className="tour-desc">{step.desc[isEn ? 'en' : 'ko']}</div>
          <div className="tour-actions">
            <button className="tour-skip" onClick={onDone}>{isEn ? 'Skip tour' : '건너뛰기'}</button>
            <button className="tour-next" onClick={next}>
              {i >= STEPS.length - 1 ? (isEn ? 'Done' : '완료') : (isEn ? 'Next ▶' : '다음 ▶')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pad = 8;
  const box = {
    top: rect.top - pad, left: rect.left - pad,
    width: rect.width + pad * 2, height: rect.height + pad * 2,
  };
  const spaceBelow = window.innerHeight - (box.top + box.height);
  const placeBelow = spaceBelow > 160 || box.top < 160;
  const tooltipStyle = placeBelow
    ? { top: box.top + box.height + 14 }
    : { top: box.top - 14, transform: 'translateY(-100%)' };
  const tooltipLeft = Math.min(Math.max(box.left, 12), window.innerWidth - 320);

  return (
    <div className="tour-bg" onClick={onDone}>
      <div className="tour-spotlight" style={box} onClick={e => e.stopPropagation()} />
      <div
        className="tour-tooltip"
        style={{ ...tooltipStyle, left: tooltipLeft }}
        onClick={e => e.stopPropagation()}
      >
        <div className="tour-progress">{i + 1} / {STEPS.length}</div>
        <div className="tour-title">{step.title[isEn ? 'en' : 'ko']}</div>
        <div className="tour-desc">{step.desc[isEn ? 'en' : 'ko']}</div>
        <div className="tour-actions">
          <button className="tour-skip" onClick={onDone}>{isEn ? 'Skip' : '건너뛰기'}</button>
          <div className="tour-actions-right">
            {i > 0 && <button className="tour-prev" onClick={prev}>◀</button>}
            <button className="tour-next" onClick={next}>
              {i >= STEPS.length - 1 ? (isEn ? 'Done' : '완료') : (isEn ? 'Next ▶' : '다음 ▶')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
