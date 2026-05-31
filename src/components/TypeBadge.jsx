import { TCOL, TICON, TYPE_EN } from '../data/types.js';

export function TypeBadge({ type, mini = false, lang = 'ko' }) {
  const bg = TCOL[type] || '#888';
  const icon = TICON[type] || '';
  const label = lang === 'en' ? (TYPE_EN[type] || type) : type;
  if (mini) {
    return (
      <span className="mini-tbadge" style={{ background: bg }}>
        {icon} {label}
      </span>
    );
  }
  return (
    <span className="tbadge" style={{ background: bg }}>
      <span className="ticon">{icon}</span>{label}
    </span>
  );
}
