import { useState } from 'react';
import { Icon } from '../components/Icon';
import { DetailHeader } from '../components/Shared';
import { ELIGIBLE_EXAMPLES, MEMBERSHIP_FAQ, TIERS, USER, nextTier, tierById } from '../data/mock';
import { fmtDate, fmtVND } from '../utils/format';

export function Membership() {
  const tier = tierById(USER.tier);
  const next = nextTier(USER.tier);
  const pct = next ? Math.min(100, Math.round((USER.eligibleSpending / next.threshold) * 100)) : 100;
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="page">
      <DetailHeader title="Hạng hội viên" />

      {/* Current status */}
      <div className="section" style={{ marginTop: 4 }}>
        <div className={`member-card member-card--${tier.id}`} style={{ margin: 0 }}>
          <div className="mc-row">
            <div className="mc-brand">
              VETC <span>LOYALTY</span>
            </div>
            <div className="mc-tier">
              <Icon name="star" filled />
              Hạng {tier.name}
            </div>
          </div>
          <div className="mc-bottom" style={{ marginTop: 26 }}>
            <div>
              <div className="mc-points-label">Chi tiêu xét hạng (12 tháng)</div>
              <div className="mc-points" style={{ fontSize: 22 }}>
                {fmtVND(USER.eligibleSpending)}
              </div>
            </div>
            <div className="mc-valid">
              Kỳ xét hạng đến
              <br />
              <strong>{fmtDate(USER.tierReviewDate)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to next */}
      {next && (
        <div className="section">
          <div className="card" style={{ padding: '16px 17px' }}>
            <div className="h2">Còn {fmtVND(next.threshold - USER.eligibleSpending)} để lên hạng {next.name}</div>
            <div className="progress-track" style={{ marginTop: 12 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span className="small muted">Hạng {tier.name}</span>
              <span className="small" style={{ fontWeight: 700, color: 'var(--brand)' }}>
                {pct}%
              </span>
              <span className="small muted">Hạng {next.name}</span>
            </div>
            <p className="small muted" style={{ marginTop: 12, lineHeight: 1.55 }}>
              Chi tiêu đủ điều kiện gồm phí đường bộ, bảo hiểm, cứu hộ, bảo dưỡng, bãi đỗ và dịch vụ Tasco. Đạt ngưỡng sớm sẽ
              được nâng hạng ngay, không cần chờ kỳ xét hạng.
            </p>
          </div>
        </div>
      )}

      {/* Tier comparison */}
      <div className="section" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="section-head" style={{ padding: '0 16px' }}>
          <div className="h2">So sánh các hạng</div>
        </div>
        <div className="tier-scroll">
          {TIERS.map((t) => {
            const isCurrent = t.id === USER.tier;
            const gradient: Record<string, string> = {
              silver: 'linear-gradient(140deg, #3f4c5e, #66788f)',
              gold: 'linear-gradient(140deg, #6b4c12, #a97c22)',
              platinum: 'linear-gradient(140deg, #2a3542, #4c5d70)',
              diamond: 'linear-gradient(140deg, #1e2a7a, #3e4fbc)',
            };
            return (
              <div key={t.id} className="tier-card" style={{ background: gradient[t.id] }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="t-name">
                    <Icon name="star" filled />
                    {t.name}
                  </div>
                  {isCurrent && <span className="tier-badge-current">HẠNG CỦA BẠN</span>}
                </div>
                <div className="t-req">{t.threshold === 0 ? 'Dành cho khách hàng VETC đã xác thực' : `Chi tiêu từ ${fmtVND(t.threshold)}/năm`}</div>
                <ul>
                  {t.benefits.map((b) => (
                    <li key={b}>
                      <Icon name="check" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unlocked vs locked benefits */}
      <div className="section">
        <div className="h2" style={{ marginBottom: 10 }}>
          Quyền lợi của bạn
        </div>
        <div className="card" style={{ padding: '15px 17px' }}>
          <ul className="bullets">
            {tier.benefits.map((b) => (
              <li key={b}>
                <Icon name="check" />
                {b}
              </li>
            ))}
          </ul>
          {next && (
            <>
              <div className="small" style={{ fontWeight: 700, margin: '14px 0 10px', color: 'var(--text-2)' }}>
                Mở khoá khi lên hạng {next.name}
              </div>
              <ul className="bullets" style={{ opacity: 0.6 }}>
                {next.benefits.map((b) => (
                  <li key={b}>
                    <Icon name="lock" />
                    {b}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Eligible transactions */}
      <div className="section">
        <div className="h2" style={{ marginBottom: 10 }}>
          Giao dịch nào được tính xét hạng?
        </div>
        <div className="card" style={{ padding: '15px 17px' }}>
          <div className="small" style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 9 }}>
            Được tính
          </div>
          <ul className="bullets">
            {ELIGIBLE_EXAMPLES.eligible.map((e) => (
              <li key={e}>
                <Icon name="check" />
                {e}
              </li>
            ))}
          </ul>
          <div className="small" style={{ fontWeight: 700, color: 'var(--red)', margin: '14px 0 9px' }}>
            Không được tính
          </div>
          <ul className="bullets">
            {ELIGIBLE_EXAMPLES.ineligible.map((e) => (
              <li key={e} style={{ color: 'var(--text-3)' }}>
                <span style={{ color: 'var(--red)', width: 16, height: 16, flexShrink: 0, marginTop: 2 }}>
                  <Icon name="x" />
                </span>
                {e}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FAQ */}
      <div className="section">
        <div className="h2" style={{ marginBottom: 10 }}>
          Câu hỏi thường gặp
        </div>
        <div className="card" style={{ padding: '2px 17px' }}>
          {MEMBERSHIP_FAQ.map((f, i) => (
            <div key={f.q} className="faq-item">
              <button className={`faq-q ${openFaq === i ? 'open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.q}
                <Icon name="chevronDown" />
              </button>
              {openFaq === i && <div className="faq-a">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
