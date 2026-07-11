import { useMemo, useState } from 'react';
import { Visual } from '../components/Shared';
import { useApp } from '../state/AppState';

const CATS = ['Tất cả', 'Di chuyển', 'Bảo hiểm', 'An toàn', 'Chăm sóc xe', 'Xe điện', 'Tasco'];

export function Services() {
  const [cat, setCat] = useState('Tất cả');
  const { selectedVehicle, services, activateService } = useApp();

  const list = useMemo(() => (cat === 'Tất cả' ? services : services.filter((s) => s.category === cat)), [cat, services]);

  return (
    <div className="page">
      <header style={{ padding: '22px 16px 4px' }}>
        <div className="h1">Dịch vụ</div>
        <div className="small muted" style={{ marginTop: 5 }}>
          Hệ sinh thái ô tô VETC & Tasco cho xe {selectedVehicle.model} • {selectedVehicle.plate}
        </div>
      </header>

      <div className="filter-row" style={{ margin: '12px 0 14px' }}>
        {CATS.map((c) => (
          <button key={c} className={`chip ${cat === c ? 'chip--on' : ''}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {list.map((s) => (
        <button key={s.id} className="service-card" style={{ width: 'calc(100% - 32px)', textAlign: 'left' }} onClick={() => activateService(s.id, s.name)}>
          <div className="service-visual">
            <Visual kind={s.image} />
          </div>
          <div className="service-main">
            <div className="service-name">{s.name}</div>
            <div className="service-desc">{s.description}</div>
            <div className="service-tags">
              <span className="badge badge--green">{s.pointsEarned}</span>
              {s.payWithPoints && <span className="badge badge--blue">Trả bằng điểm</span>}
              {s.countsTowardTier && <span className="badge badge--amber">Tính xét hạng</span>}
            </div>
            <div className="service-price">{s.price}</div>
            <div className="service-avail">Áp dụng: {s.availableFor}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
