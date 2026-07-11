import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Sheet, Visual } from '../components/Shared';
import { OFFERS, USER, VEHICLES, nextTier, tierById } from '../data/mock';
import { useApp } from '../state/AppState';
import { fmtDate, fmtNum, fmtVND } from '../utils/format';

const QUICK_ACTIONS = [
  { icon: 'road', label: 'Dùng điểm trả phí', bg: 'var(--brand-soft)', fg: 'var(--brand)', to: '/rewards?cat=toll' },
  { icon: 'gift', label: 'Đổi ưu đãi', bg: 'var(--green-soft)', fg: 'var(--green)', to: '/rewards' },
  { icon: 'star', label: 'Nhiệm vụ AI', bg: '#f0edfd', fg: '#6d28d9', to: '/missions' },
  { icon: 'shield', label: 'Mua bảo hiểm', bg: '#e7f6ef', fg: '#0c8a4d', to: '/services' },
  { icon: 'tow', label: 'Gọi cứu hộ', bg: 'var(--amber-soft)', fg: 'var(--amber)', to: '/services' },
  { icon: 'history', label: 'Lịch sử điểm', bg: '#f0edfd', fg: '#6d28d9', to: '/activity' },
];

export function Home() {
  const { pointsBalance, cashBalance, selectedVehicle, setSelectedVehicleId, showToast } = useApp();
  const [vehicleSheet, setVehicleSheet] = useState(false);
  const navigate = useNavigate();

  const tier = tierById(USER.tier);
  const next = nextTier(USER.tier);
  const remaining = next ? next.threshold - USER.eligibleSpending : 0;
  const pct = next ? Math.min(100, Math.round((USER.eligibleSpending / next.threshold) * 100)) : 100;

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="page">
      {/* ===== Hero ===== */}
      <div className="home-hero">
        <div className="hero-top">
          <div>
            <div className="hero-greet">{greet} 👋</div>
            <div className="hero-name">{USER.name}</div>
          </div>
          <button className="iconbtn" aria-label="Thông báo" onClick={() => showToast('Bạn có 3 thông báo mới')}>
            <Icon name="bell" />
            <span className="dot" />
          </button>
        </div>
        <button className="vehicle-pill" onClick={() => setVehicleSheet(true)}>
          <Icon name="car" />
          {selectedVehicle.model} • {selectedVehicle.plate}
          <Icon name="chevronDown" />
        </button>
      </div>

      {/* ===== Membership card ===== */}
      <Link to="/membership" className={`member-card member-card--${tier.id}`} style={{ display: 'block' }}>
        <div className="mc-row">
          <div className="mc-brand">
            VETC <span>LOYALTY</span>
          </div>
          <div className="mc-tier">
            <Icon name="star" filled />
            Hạng {tier.name}
          </div>
        </div>
        <div className="mc-name">{USER.name.toUpperCase()}</div>
        <div className="mc-no">{USER.memberNo}</div>
        <div className="mc-bottom">
          <div>
            <div className="mc-points-label">Điểm VETC của bạn</div>
            <div className="mc-points">
              {fmtNum(pointsBalance)}
              <small>điểm</small>
            </div>
          </div>
          <div className="mc-valid">
            Kỳ xét hạng đến
            <br />
            <strong>{fmtDate(USER.tierReviewDate)}</strong>
          </div>
        </div>
      </Link>

      {/* ===== Balance strip: points ≠ cash ===== */}
      <div className="balances">
        <div className="card balance-box balance-box--points">
          <div className="label">
            <Icon name="coin" />
            Điểm VETC
          </div>
          <div className="value">{fmtNum(pointsBalance)} điểm</div>
        </div>
        <div className="card balance-box balance-box--cash">
          <div className="label">
            <Icon name="wallet" />
            Tài khoản giao thông
          </div>
          <div className="value">{fmtVND(cashBalance)}</div>
        </div>
      </div>

      {/* ===== Tier progress ===== */}
      {next && (
        <div className="section">
          <div className="card" style={{ padding: '16px 17px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="h2">Tiến trình lên hạng {next.name}</div>
              <Link to="/membership" className="section-link">
                Chi tiết
              </Link>
            </div>
            <div className="small muted" style={{ marginTop: 6 }}>
              Chi tiêu xét hạng: <strong style={{ color: 'var(--text)' }}>{fmtVND(USER.eligibleSpending)}</strong> /{' '}
              {fmtVND(next.threshold)}
            </div>
            <div className="progress-track" style={{ marginTop: 12 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span className="small" style={{ fontWeight: 700, color: 'var(--brand)' }}>
                Đã đạt {pct}%
              </span>
              <span className="small muted">
                Còn <strong style={{ color: 'var(--text)' }}>{fmtVND(remaining)}</strong> để lên hạng {next.name}
              </span>
            </div>
            <div
              style={{
                marginTop: 13,
                paddingTop: 12,
                borderTop: '1px solid var(--line)',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <span className="badge badge--amber">Hạng {next.name}</span>
              <span className="small muted">Tích điểm x1,5 • Giảm 10% cứu hộ • Quà sinh nhật</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== Expiring points ===== */}
      {USER.expiringPoints && (
        <div className="section">
          <div className="alert">
            <Icon name="hourglass" />
            <div style={{ flex: 1 }}>
              <div className="a-title">
                {fmtNum(USER.expiringPoints.amount)} điểm sắp hết hạn ngày {fmtDate(USER.expiringPoints.date)}
              </div>
              <div className="a-sub">Dùng điểm cho phí đường bộ hoặc đổi ưu đãi để không bỏ lỡ quyền lợi.</div>
              <button className="a-cta" onClick={() => navigate('/rewards?filter=expiring')}>
                Dùng điểm ngay →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Quick actions ===== */}
      <div className="section">
        <div className="section-head">
          <div className="h2">Thao tác nhanh</div>
        </div>
        <div className="quick-grid">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.label} to={a.to} className="quick-item">
              <span className="qi-ic" style={{ background: a.bg, color: a.fg }}>
                <Icon name={a.icon} />
              </span>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ===== Personalized offers ===== */}
      <div className="section" style={{ paddingRight: 0, paddingLeft: 0 }}>
        <div className="section-head" style={{ padding: '0 16px' }}>
          <div className="h2">Dành riêng cho bạn</div>
          <Link to="/rewards" className="section-link">
            Xem tất cả
          </Link>
        </div>
        <div className="offers-scroll">
          {OFFERS.map((o) => (
            <Link key={o.id} to={o.to} className="offer-card">
              <div className="offer-visual">
                <Visual kind={o.image} />
                <span className="badge badge--blue" style={{ background: 'rgba(255,255,255,0.92)' }}>
                  {o.tag}
                </span>
                {o.urgency && <span className="urgency">{o.urgency}</span>}
              </div>
              <div className="offer-body">
                <div className="offer-title">{o.title}</div>
                <div className="offer-sub">{o.subtitle}</div>
                <span className="offer-cta">
                  {o.cta}
                  <Icon name="chevronRight" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ===== Vehicle switcher sheet ===== */}
      {vehicleSheet && (
        <Sheet onClose={() => setVehicleSheet(false)}>
          <div className="h2" style={{ marginBottom: 14 }}>
            Chọn phương tiện
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {VEHICLES.map((v) => {
              const active = v.id === selectedVehicle.id;
              return (
                <button
                  key={v.id}
                  className="rowitem"
                  style={{
                    borderRadius: 14,
                    border: active ? '1.6px solid var(--brand)' : '1.6px solid var(--line)',
                    background: active ? 'var(--brand-soft)' : 'var(--surface)',
                  }}
                  onClick={() => {
                    setSelectedVehicleId(v.id);
                    setVehicleSheet(false);
                    showToast(`Đã chọn ${v.model} • ${v.plate}`);
                  }}
                >
                  <span className="row-ic" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                    <Icon name="car" />
                  </span>
                  <span className="row-main">
                    <span className="row-title">
                      {v.model} • {v.plate}
                    </span>
                    <span className="row-sub">
                      {v.type} • eTag {v.etagStatus === 'active' ? 'đang hoạt động' : 'chưa kích hoạt'}
                    </span>
                  </span>
                  {active && (
                    <span style={{ color: 'var(--brand)', width: 22, height: 22 }}>
                      <Icon name="check" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </div>
  );
}
