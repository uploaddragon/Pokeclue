import { useState, useEffect, useRef } from 'react';
import { TITLE_MAP, RARITY } from '../data/titles.js';

/**
 * 칭호 해금 알림 토스트
 * - queue 배열의 첫 번째 칭호를 위에서 내려왔다가 사라지는 애니메이션으로 표시
 * - 하나가 끝나면 다음 칭호를 표시
 */
export function TitleUnlockToast({ queue = [], onDone }) {
  const [current, setCurrent]   = useState(null);  // 현재 표시 중인 title 객체
  const [phase, setPhase]       = useState('idle'); // idle | enter | show | exit
  const timerRef                = useRef(null);

  useEffect(() => {
    if (phase !== 'idle' || queue.length === 0) return;

    const id = queue[0];
    const title = TITLE_MAP[id];
    if (!title) { onDone?.(); return; }

    setCurrent(title);
    setPhase('enter');

    // enter(300ms) → show(2600ms) → exit(300ms) → done
    timerRef.current = setTimeout(() => {
      setPhase('show');
      timerRef.current = setTimeout(() => {
        setPhase('exit');
        timerRef.current = setTimeout(() => {
          setPhase('idle');
          setCurrent(null);
          onDone?.();
        }, 350);
      }, 2600);
    }, 350);

    return () => clearTimeout(timerRef.current);
  }, [queue, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current || phase === 'idle') return null;

  const isMystery = current.rarity === 'mystery';
  const s = RARITY[current.rarity];

  return (
    <div
      className={`title-unlock-toast title-unlock-${phase}`}
      style={{ '--tc': s.color, '--tbg': s.bg, '--tb': s.border }}
    >
      <div className="tut-label">🎖️ 칭호 해금!</div>
      <div className="tut-body">
        <span className="tut-emoji">{isMystery ? '👾' : current.emoji}</span>
        <div className="tut-text">
          <span className="tut-name px">{isMystery ? '???' : current.ko}</span>
          <span className="tut-desc">{isMystery ? '???' : current.desc_ko}</span>
        </div>
      </div>
    </div>
  );
}
