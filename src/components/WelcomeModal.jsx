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
              ? "Guess today's hidden Pokémon by entering any Pokémon name. The game shows how close your guess is — by letter count, type, generation, and more — using arrows and colors."
              : '숨겨진 오늘의 포켓몬을 맞춰보세요! 포켓몬 이름을 입력하면 정답과의 연관성을 글자 수, 타입, 세대 등의 항목으로 알려줍니다.'}
          </p>
          <p>
            {isEn
              ? 'Unlimited attempts — guess as fast as you can to climb the rankings!'
              : '시도 횟수는 무제한입니다. 최대한 빠르게 맞춰 랭킹에 도전해보세요!'}
          </p>
          <p>
            {isEn
              ? 'Guess correctly and that Pokémon is registered in your Pokédex!'
              : '정답을 맞히면 해당 포켓몬이 도감에 등록됩니다.'}
          </p>

          <div className="wc-divider" />

          <p>
            {isEn
              ? '💡 Stuck? Use [Filter] to narrow down the list based on your clues — but the shiny rate drops from 5% → 1%.'
              : '💡 막막하다면 [필터 열람]으로 후보를 좁혀보세요. 단, 이로치 확률이 5% → 1%로 줄어듭니다.'}
          </p>
          <p>
            {isEn
              ? 'Mega-evolved and Gigantamax Pokémon belong to the region of their base form.'
              : '메가진화·거다이맥스 포켓몬의 세대는 원래 포켓몬 기준으로 분류됩니다.'}
          </p>

          <div className="wc-divider" />

          <div className="wc-mode-block">
            <p className="wc-mode-title">{isEn ? '∞  Endless — Normal' : '∞  엔드리스 — 일반'}</p>
            <p className="wc-mode-desc">
              {isEn
                ? 'Unlimited play with filter. Cleared Pokémon are not registered to your Dex.'
                : '필터 허용, 무한 플레이. 클리어한 포켓몬은 도감에 등록되지 않습니다.'}
            </p>
          </div>
          <div className="wc-mode-block">
            <p className="wc-mode-title">{isEn ? '★  Endless — Challenge' : '★  엔드리스 — 챌린지'}</p>
            <p className="wc-mode-desc">
              {isEn
                ? '3 daily attempts · 8 tries per round · No filter. Clear → Dex registered + attempt saved. Fail → 1 attempt deducted.'
                : '하루 3회 도전 · 8번 이내 정답 · 필터 불가. 클리어 시 도감 등록 + 기회 유지, 실패 시 기회 1 차감.'}
            </p>
          </div>

          <div className="wc-divider" />

          <p className="wc-footer-note">
            {isEn ? '🕛 Puzzle resets every midnight (KST).' : '🕛 매일 자정(KST)에 퍼즐이 초기화됩니다.'}
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
