import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { DetailHeader, Sheet, Visual } from '../components/Shared';
import { TIERS, USER } from '../data/mock';
import { rewardById, useApp } from '../state/AppState';
import type { Redemption } from '../state/AppState';
import { fmtDate, fmtNum, fmtVND } from '../utils/format';

const tierRank: Record<string, number> = { silver: 0, gold: 1, platinum: 2, diamond: 3 };

export function RewardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reward = rewardById(id);
  const { pointsBalance, selectedVehicle, redeem } = useApp();

  const [confirming, setConfirming] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<Redemption | null>(null);

  if (!reward) {
    return (
      <div className="page page--nonav">
        <DetailHeader title="Ưu đãi" />
        <div className="empty">
          <Icon name="alertCircle" />
          <div className="e-title">Ưu đãi không còn khả dụng</div>
          <div className="e-sub">Ưu đãi này đã kết thúc hoặc tạm hết lượt đổi. Khám phá các ưu đãi khác nhé.</div>
          <div style={{ marginTop: 16 }}>
            <Link to="/rewards" className="btn btn-primary">
              Xem ưu đãi khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const enough = reward.points <= pointsBalance;
  const tierOk = tierRank[reward.minTier] <= tierRank[USER.tier];
  const after = pointsBalance - reward.points;
  const minTierName = TIERS.find((t) => t.id === reward.minTier)!.name;

  async function confirmRedeem() {
    setProcessing(true);
    // Simulated biometric/OTP confirmation step before deducting points
    await new Promise((r) => setTimeout(r, 900));
    const redemption = redeem(reward!);
    setProcessing(false);
    setConfirming(false);
    setDone(redemption);
  }

  /* ===== Success screen ===== */
  if (done) {
    return (
      <div className="page page--nonav">
        <div className="success-wrap">
          <div className="success-ic">
            <Icon name="check" />
          </div>
          <div className="h1">Đổi điểm thành công!</div>
          <p className="muted" style={{ marginTop: 10, lineHeight: 1.55, fontSize: 14.5 }}>
            {reward.fulfillment === 'voucher' ? (
              <>
                <strong>{reward.title}</strong> đã sẵn sàng trong mục <strong>Ưu đãi của tôi</strong>.
              </>
            ) : (
              <>
                Ưu đãi <strong>{reward.title}</strong> đã được kích hoạt cho tài khoản của bạn.
              </>
            )}
          </p>
          {reward.fulfillment === 'voucher' && (
            <div
              className="card"
              style={{ marginTop: 22, padding: '16px 22px', width: '100%', border: '1.5px dashed var(--line)' }}
            >
              <div className="small muted">Mã voucher</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, marginTop: 4 }}>{done.code}</div>
              <div className="small muted" style={{ marginTop: 4 }}>
                Hiệu lực đến {fmtDate(done.expiry)}
              </div>
            </div>
          )}
          <div className="card" style={{ marginTop: 14, padding: '13px 18px', width: '100%' }}>
            <div className="kv" style={{ border: 'none', padding: '4px 0' }}>
              <span className="k">Điểm đã dùng</span>
              <span className="v">−{fmtNum(reward.points)} điểm</span>
            </div>
            <div className="kv" style={{ border: 'none', padding: '4px 0' }}>
              <span className="k">Điểm còn lại</span>
              <span className="v" style={{ color: 'var(--green)' }}>
                {fmtNum(pointsBalance)} điểm
              </span>
            </div>
          </div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 24 }} onClick={() => navigate('/account/my-rewards')}>
            Xem Ưu đãi của tôi
          </button>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => navigate('/rewards')}>
            Tiếp tục khám phá
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--nonav" style={{ paddingBottom: 110 }}>
      <DetailHeader title="Chi tiết ưu đãi" />

      <div className="detail-hero">
        <Visual kind={reward.image} />
      </div>

      <div className="section" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {reward.isNew && <span className="badge badge--green">Mới</span>}
          <span className="badge badge--blue">Hạng {minTierName} trở lên</span>
          <span className="badge badge--gray">HSD {fmtDate(reward.expiry)}</span>
        </div>
        <h1 className="h1" style={{ marginTop: 10 }}>
          {reward.title}
        </h1>
        <p className="muted" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55 }}>
          {reward.description}
        </p>
      </div>

      <div className="section">
        <div className="card" style={{ padding: '6px 17px' }}>
          <div className="kv">
            <span className="k">Điểm cần dùng</span>
            <span className="v" style={{ color: 'var(--green)', fontSize: 15 }}>
              {reward.points === 0 ? 'Miễn phí' : `${fmtNum(reward.points)} điểm`}
            </span>
          </div>
          {reward.cashValue != null && (
            <div className="kv">
              <span className="k">Giá trị tương đương</span>
              <span className="v">{fmtVND(reward.cashValue)}</span>
            </div>
          )}
          <div className="kv">
            <span className="k">Hình thức nhận</span>
            <span className="v">{reward.fulfillment === 'voucher' ? 'Voucher điện tử' : 'Kích hoạt tự động'}</span>
          </div>
          <div className="kv">
            <span className="k">Địa điểm áp dụng</span>
            <span className="v" style={{ maxWidth: 200 }}>
              {reward.locations}
            </span>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="h2" style={{ marginBottom: 10 }}>
          Ưu đãi bao gồm
        </div>
        <div className="card" style={{ padding: '15px 17px' }}>
          <ul className="bullets">
            {reward.includes.map((line) => (
              <li key={line}>
                <Icon name="check" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="section">
        <div className="h2" style={{ marginBottom: 10 }}>
          Cách sử dụng
        </div>
        <div className="card" style={{ padding: '15px 17px' }}>
          <p className="small muted" style={{ lineHeight: 1.6 }}>
            {reward.usage}
          </p>
        </div>
      </div>

      <div className="section">
        <div className="h2" style={{ marginBottom: 10 }}>
          Điều kiện & hoàn huỷ
        </div>
        <div className="card" style={{ padding: '15px 17px' }}>
          <ul className="bullets">
            {reward.terms.map((t) => (
              <li key={t}>
                <Icon name="doc" />
                {t}
              </li>
            ))}
            <li>
              <Icon name="swap" />
              {reward.refundPolicy}
            </li>
          </ul>
        </div>
      </div>

      {/* ===== Sticky redeem bar ===== */}
      <div className="redeem-bar">
        <div>
          <div className="rb-points">{reward.points === 0 ? 'Miễn phí' : `${fmtNum(reward.points)} điểm`}</div>
          <div className="rb-label">Bạn có {fmtNum(pointsBalance)} điểm</div>
        </div>
        <button className="btn btn-primary" disabled={!enough || !tierOk} onClick={() => setConfirming(true)}>
          {!tierOk ? `Cần hạng ${minTierName}` : enough ? 'Đổi ưu đãi' : 'Chưa đủ điểm'}
        </button>
      </div>

      {/* ===== Confirmation sheet — prevents accidental redemption ===== */}
      {confirming && (
        <Sheet onClose={() => !processing && setConfirming(false)}>
          <div className="h2">Xác nhận đổi điểm</div>
          <div className="card" style={{ marginTop: 14, padding: '6px 17px', boxShadow: 'none', border: '1px solid var(--line)' }}>
            <div className="kv">
              <span className="k">Ưu đãi</span>
              <span className="v" style={{ maxWidth: 210 }}>
                {reward.title}
              </span>
            </div>
            <div className="kv">
              <span className="k">Áp dụng cho xe</span>
              <span className="v">
                {selectedVehicle.model} • {selectedVehicle.plate}
              </span>
            </div>
            <div className="kv">
              <span className="k">Điểm hiện có</span>
              <span className="v">{fmtNum(pointsBalance)} điểm</span>
            </div>
            <div className="kv">
              <span className="k">Điểm sử dụng</span>
              <span className="v" style={{ color: 'var(--red)' }}>
                −{fmtNum(reward.points)} điểm
              </span>
            </div>
            <div className="kv">
              <span className="k">Điểm còn lại</span>
              <span className="v" style={{ color: 'var(--green)' }}>
                {fmtNum(after)} điểm
              </span>
            </div>
          </div>

          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16 }} />
            Tôi đã đọc và đồng ý với điều kiện sử dụng của ưu đãi này. Điểm đã đổi không quy đổi thành tiền mặt.
          </label>

          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={!agreed || processing} onClick={confirmRedeem}>
            {processing ? 'Đang xác thực…' : 'Xác nhận bằng Face ID'}
          </button>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} disabled={processing} onClick={() => setConfirming(false)}>
            Huỷ
          </button>
        </Sheet>
      )}
    </div>
  );
}
