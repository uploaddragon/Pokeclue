import { useState, useEffect, useRef } from 'react';
import { TITLE_MAP, RARITY } from '../data/titles.js';

export function TitleUnlockToast({ queue = [], onDone }) {
  const [current, setCurrent] = useState(null);
  const [phase, setPhase]     = useState('idle');
  const runningRef = useRef(false);
  const t1 = useRef(null);
  const t2 = useRef(null);
  const t3 = useRef(null);

  useEffect(() => {
    if (runningRef.current || queue.length === 0) return;

    const id = queue[0];
    const title = TITLE_MAP[id];
    if (!title) { onDone?.(); return; }

    runningRef.current = true;
    setCurrent(title);
    setPhase('enter');

    t1.current = setTimeout(() => {
      setPhase('show');
      t2.current = setTimeout(() => {
        setPhase('exit');
        t3.current = setTimeout(() => {
          setPhase('idle');
          setCurrent(null);
          runningRef.current = false;
          onDone?.();
        }, 350);
      }, 3000);
    }, 350);

    return () => {
      clearTimeout(t1.current);
      clearTimeout(t2.current);
      clearTimeout(t3.current);
      runningRef.current = false;
    };
  }, [queue.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <span className="tut-emoji">{current.emoji}</span>
        <div className="tut-text">
          <span className="tut-name px">{current.ko}</span>
          <span className="tut-desc">{current.desc_ko}</span>
        </div>
      </div>
    </div>
  );
}
