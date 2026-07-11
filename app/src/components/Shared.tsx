import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** Gradient visual block keyed by mock `image` name. */
export function Visual({ kind, icon }: { kind: string; icon?: string }) {
  return (
    <div className={`vis vis--${kind}`}>
      <Icon name={icon ?? VIS_ICON[kind] ?? 'gift'} />
    </div>
  );
}

const VIS_ICON: Record<string, string> = {
  road: 'road',
  parking: 'parking',
  coffee: 'coffee',
  shield: 'shield',
  shield2: 'shield',
  tow: 'tow',
  ev: 'zap',
  wash: 'wash',
  wrench: 'wrench',
  food: 'food',
  travel: 'travel',
  star: 'star',
  x2: 'x2',
  ticket: 'ticket',
  sos: 'sos',
  car: 'car',
  parts: 'parts',
};

/** Sticky header with a back button for detail screens. */
export function DetailHeader({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <header className="detail-header">
      <button className="backbtn" onClick={() => navigate(-1)} aria-label="Quay lại">
        <Icon name="back" />
      </button>
      <div className="h2">{title}</div>
    </header>
  );
}

/** Bottom sheet modal. */
export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, sub, action }: { icon: string; title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <div className="e-title">{title}</div>
      <div className="e-sub">{sub}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
