import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { DetailHeader, EmptyState, Visual } from '../components/Shared';
import { useApp } from '../state/AppState';
import { fmtDate } from '../utils/format';

export function MyRewards() {
  const { rewards, redemptions } = useApp();

  return (
    <div className="page">
      <DetailHeader title="Ưu đãi của tôi" />

      {redemptions.length === 0 ? (
        <EmptyState
          icon="gift"
          title="Chưa có ưu đãi nào"
          sub="Voucher và ưu đãi bạn đổi bằng điểm VETC sẽ được lưu tại đây."
          action={
            <Link to="/rewards" className="btn btn-primary">
              Khám phá ưu đãi
            </Link>
          }
        />
      ) : (
        <div className="section" style={{ marginTop: 6 }}>
          {redemptions.map((rd) => {
            const reward = rewards.find((item) => item.id === rd.rewardId);
            return (
              <div key={rd.id} className="card" style={{ padding: 15, marginBottom: 12, display: 'flex', gap: 13 }}>
                <div className="service-visual">
                  <Visual kind={reward?.image ?? 'star'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-title">{rd.title}</div>
                  {rd.fulfillment === 'voucher' ? (
                    <div
                      style={{
                        marginTop: 8,
                        border: '1.5px dashed var(--line)',
                        borderRadius: 10,
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontWeight: 800, letterSpacing: 1.5, fontSize: 15 }}>{rd.code}</span>
                      <span style={{ width: 20, height: 20, color: 'var(--text-3)' }}>
                        <Icon name="qr" />
                      </span>
                    </div>
                  ) : (
                    <span className="badge badge--green" style={{ marginTop: 8 }}>
                      <Icon name="check" />
                      Đã kích hoạt
                    </span>
                  )}
                  <div className="row-sub" style={{ marginTop: 7 }}>
                    Đổi ngày {fmtDate(rd.redeemedAt)} • Hiệu lực đến {fmtDate(rd.expiry)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
