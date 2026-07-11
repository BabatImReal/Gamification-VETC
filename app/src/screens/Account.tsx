import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useApp } from '../state/AppState';
import { fmtDate, fmtNum, fmtVND } from '../utils/format';

const SETTINGS: { icon: string; label: string; sub?: string; to?: string }[] = [
  { icon: 'star', label: 'Hạng hội viên & quyền lợi', sub: 'Hạng Bạc — kỳ xét hạng đến 31/03/2027', to: '/membership' },
  { icon: 'gift', label: 'Ưu đãi của tôi', sub: 'Voucher và ưu đãi đã đổi', to: '/account/my-rewards' },
  { icon: 'bell', label: 'Cài đặt thông báo', sub: 'Điểm, ưu đãi, nhắc gia hạn' },
  { icon: 'lock', label: 'Bảo mật', sub: 'Face ID, mã PIN, thiết bị' },
  { icon: 'globe', label: 'Ngôn ngữ', sub: 'Tiếng Việt' },
  { icon: 'help', label: 'Trợ giúp & hỗ trợ', sub: 'Tổng đài 1900 6010' },
  { icon: 'doc', label: 'Điều khoản chương trình & quyền riêng tư' },
];

export function Account() {
  const { user, vehicles, pointsBalance, cashBalance, showToast } = useApp();

  return (
    <div className="page">
      <header style={{ padding: '22px 16px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(140deg, #0a3d91, #3f8cff)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontSize: 20,
            fontWeight: 800,
          }}
        >
          {user.name.split(' ').slice(-1)[0]?.slice(0, 2).toUpperCase() ?? 'VT'}
        </div>
        <div style={{ flex: 1 }}>
          <div className="h1" style={{ fontSize: 19 }}>
            {user.name}
          </div>
          <div className="small muted" style={{ marginTop: 3 }}>
            {user.phone} • Hội viên từ {fmtDate(user.memberSince)}
          </div>
        </div>
      </header>

      {/* eKYC + bank */}
      <div className="section" style={{ marginTop: 0 }}>
        <div className="card" style={{ padding: '6px 17px' }}>
          <div className="kv">
            <span className="k">Định danh eKYC</span>
            <span className="v">
              {user.ekycVerified ? (
                <span className="badge badge--green">
                  <Icon name="check" />
                  Đã xác thực
                </span>
              ) : (
                <span className="badge badge--amber">Chưa xác thực</span>
              )}
            </span>
          </div>
          <div className="kv">
            <span className="k">Ngân hàng liên kết</span>
            <span className="v">{user.linkedBank}</span>
          </div>
          <div className="kv">
            <span className="k">Tài khoản giao thông</span>
            <span className="v">{fmtVND(cashBalance)}</span>
          </div>
          <div className="kv">
            <span className="k">Điểm VETC</span>
            <span className="v" style={{ color: 'var(--green)' }}>
              {fmtNum(pointsBalance)} điểm
            </span>
          </div>
        </div>
      </div>

      {/* Vehicles */}
      <div className="section">
        <div className="section-head">
          <div className="h2">Xe của tôi</div>
          <button className="section-link" onClick={() => showToast('Thêm xe mới — liên kết eTag')}>
            + Thêm xe
          </button>
        </div>
        {vehicles.map((v) => (
          <div key={v.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
              <span className="row-ic" style={{ background: 'var(--brand-soft)', color: 'var(--brand)', width: 46, height: 46 }}>
                <Icon name="car" />
              </span>
              <div style={{ flex: 1 }}>
                <div className="row-title" style={{ fontSize: 15 }}>
                  {v.model} • {v.plate}
                </div>
                <div className="row-sub">{v.type}</div>
              </div>
              <span className={`badge ${v.etagStatus === 'active' ? 'badge--green' : 'badge--gray'}`}>
                eTag {v.etagStatus === 'active' ? 'hoạt động' : 'chưa kích hoạt'}
              </span>
            </div>
            <div style={{ marginTop: 13, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <div className="kv" style={{ border: 'none', padding: '4px 0' }}>
                <span className="k">Bảo hiểm TNDS</span>
                <span className="v" style={{ color: v.id === 'V1' ? 'var(--amber)' : undefined }}>
                  {v.insuranceExpiry ? `Hết hạn ${fmtDate(v.insuranceExpiry)}` : 'Chưa có'}
                </span>
              </div>
              <div className="kv" style={{ border: 'none', padding: '4px 0' }}>
                <span className="k">Cứu hộ giao thông</span>
                <span className="v">{v.roadsideActive ? 'Đang bảo vệ' : 'Chưa kích hoạt'}</span>
              </div>
              <div className="kv" style={{ border: 'none', padding: '4px 0' }}>
                <span className="k">Lượt qua trạm 30 ngày</span>
                <span className="v">{v.recentTollCount} lượt</span>
              </div>
              {v.nextMaintenance && (
                <div className="kv" style={{ border: 'none', padding: '4px 0' }}>
                  <span className="k">Bảo dưỡng tiếp theo</span>
                  <span className="v">{fmtDate(v.nextMaintenance)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Settings list */}
      <div className="section">
        <div className="rowlist" style={{ margin: 0 }}>
          {SETTINGS.map((s) => {
            const inner = (
              <>
                <span className="row-ic" style={{ background: '#eef1f6', color: '#475569' }}>
                  <Icon name={s.icon} />
                </span>
                <span className="row-main">
                  <span className="row-title">{s.label}</span>
                  {s.sub && <span className="row-sub">{s.sub}</span>}
                </span>
                <span style={{ color: 'var(--text-3)', width: 20, height: 20 }}>
                  <Icon name="chevronRight" />
                </span>
              </>
            );
            return s.to ? (
              <Link key={s.label} to={s.to} className="rowitem">
                {inner}
              </Link>
            ) : (
              <button key={s.label} className="rowitem" onClick={() => showToast(`${s.label} — sắp ra mắt trong bản demo`)}>
                {inner}
              </button>
            );
          })}
        </div>
      </div>

      <div className="section">
        <button className="btn btn-block" style={{ background: 'var(--red-soft)', color: 'var(--red)' }} onClick={() => showToast('Đăng xuất (demo)')}>
          <Icon name="logout" />
          Đăng xuất
        </button>
        <p className="small" style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 14 }}>
          VETC Loyalty v0.1 — bản demo
        </p>
      </div>
    </div>
  );
}
