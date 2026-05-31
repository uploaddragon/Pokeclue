import { useState } from 'react';

const STORAGE_KEY = 'pokeclue_welcome_hidden';

export function useWelcomeModal() {
  const [open, setOpen] = useState(() => {
    try { return !localStorage.getItem(STORAGE_KEY); } catch { return true; }
  });

  function close() { setOpen(false); }
  function closeForever() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setOpen(false);
  }

  return { open, close, closeForever };
}

export function WelcomeModal({ onClose, onNeverShow, lang }) {
  const isEn = lang === 'en';

  return (
    <div className="wc-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="wc-modal">
        <button className="wc-close" onClick={onClose}>✕</button>

        <div className="wc-title">
          {isEn ? 'Welcome to PokéClue!' : '포케클루에 오신 것을 환영합니다!'}
        </div>

        <div className="wc-body">
          <p>
            {isEn
              ? "The goal is to guess today's Pokémon."
              : '이 게임의 목표는 [오늘의 포켓몬]을 맞추는 것입니다.'}
          </p>
          <p>
            {isEn
              ? 'You have unlimited attempts — but try to guess quickly and climb the rankings!'
              : '기회는 무한대입니다. 하지만 빠르게 답을 맞춰 랭킹에 올라보세요!'}
          </p>
          <p>
            {isEn
              ? "Enter any Pokémon's name and the game will show how closely it relates to today's answer — by letter count, type, generation, and more — using arrows and colors."
              : '랜덤한 포켓몬의 이름을 입력하면, 오늘의 포켓몬과의 연관성을 업/다운, 색으로 알려줍니다. (글자 수, 타입, 세대 등...)'}
          </p>

          <div className="wc-divider" />

          <p>
            {isEn
              ? 'Mega-evolved and Gigantamax Pokémon belong to the region of their base form.'
              : '메가진화 및 거다이맥스 포켓몬은 해당 포켓몬의 일반 형태가 유래된 지역에 속합니다.'}
          </p>
          <p>
            {isEn
              ? "Stuck? Click [Filter] to narrow the list based on your clues. Note: the shiny rate drops from 5% → 1%."
              : '너무 어렵다면 [필터 열람]을 클릭해 보세요! 지금까지 추측한 단서에 따라 포켓몬 명단을 필터링해 줍니다. 단, 이로치 확률은 5% → 1%로 감소합니다.'}
          </p>
          <p>
            {isEn
              ? "Guess correctly and that Pokémon is registered in your Pokédex!"
              : '정답을 맞췄다면, 해당 포켓몬은 본인의 도감에 등록됩니다.'}
          </p>

          <div className="wc-divider" />

          <p className="wc-mode-title">
            {isEn ? '∞  Endless — Normal' : '∞  엔드리스 모드 — 일반'}
          </p>
          <p>
            {isEn
              ? 'Unlimited play, filter allowed. Cleared Pokémon are NOT registered to your Dex.'
              : '무한 플레이가 가능하며 필터를 사용할 수 있습니다. 단, 정답 포켓몬은 도감에 등록되지 않습니다.'}
          </p>

          <p className="wc-mode-title">
            {isEn ? '★  Endless — Challenge' : '★  엔드리스 모드 — 챌린지'}
          </p>
          <p>
            {isEn
              ? '3 daily attempts · 7 tries per round · No filter. Clear within 7 tries → Dex registration, attempt NOT deducted. Fail → attempt deducted.'
              : '하루 3번의 도전 기회 · 라운드당 시도 7회 · 필터 불가. 7회 안에 맞추면 도감 등록되고 기회가 차감되지 않습니다. 실패하면 기회가 1 차감됩니다.'}
          </p>

          <div className="wc-divider" />

          <p className="wc-footer-note">
            {isEn
              ? '🕛 Puzzle resets every midnight (KST).'
              : '🕛 매일 자정 (한국 시간대) 에 퍼즐이 초기화됩니다.'}
          </p>
        </div>

        <div className="wc-actions">
          <button className="wc-btn-never" onClick={onNeverShow}>
            {isEn ? 'Do not show again' : '다시 보지 않기'}
          </button>
          <button className="wc-btn-ok" onClick={onClose}>
            {isEn ? "Got it!" : '알겠어요!'}
          </button>
        </div>
      </div>
    </div>
  );
}
