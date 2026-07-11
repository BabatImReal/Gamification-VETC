import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { EmptyState, Sheet } from '../components/Shared';
import type { ActivityKind, ActivityRecord } from '../data/mock';
import { useApp } from '../state/AppState';
import { fmtDateTime, fmtNum, fmtVND } from '../utils/format';

type FilterId = 'all' | 'earn' | 'use' | 'expire' | 'adjust' | 'tier';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'earn', label: 'Tích điểm' },
  { id: 'use', label: 'Dùng điểm' },
  { id: 'expire', label: 'Hết hạn' },
  { id: 'adjust', label: 'Điều chỉnh' },
  { id: 'tier', label: 'Xét hạng' },
];

const KIND_META: Record<ActivityKind, { icon: string; bg: string; fg: string; label: string }> = {
  earn: { icon: 'coin', bg: 'var(--green-soft)', fg: 'var(--green)', label: 'Tích điểm' },
  bonus: { icon: 'star', bg: 'var(--green-soft)', fg: 'var(--green)', label: 'Điểm thưởng' },
  redeem: { icon: 'gift', bg: 'var(--brand-soft)', fg: 'var(--brand)', label: 'Đổi ưu đãi' },
  'toll-points': { icon: 'road', bg: 'var(--brand-soft)', fg: 'var(--brand)', label: 'Trả phí bằng điểm' },
  service: { icon: 'grid', bg: '#eef1f6', fg: '#475569', label: 'Giao dịch dịch vụ' },
  expire: { icon: 'hourglass', bg: 'var(--red-soft)', fg: 'var(--red)', label: 'Điểm hết hạn' },
  adjust: { icon: 'swap', bg: 'var(--amber-soft)', fg: 'var(--amber)', label: 'Điều chỉnh' },
  tier: { icon: 'star', bg: '#f0edfd', fg: '#6d28d9', label: 'Hạng hội viên' },
};

function inFilter(r: ActivityRecord, f: FilterId): boolean {
  switch (f) {
    case 'all':
      return true;
    case 'earn':
      return r.kind === 'earn' || r.kind === 'bonus' || (r.kind === 'service' && r.points > 0);
    case 'use':
      return r.kind === 'redeem' || r.kind === 'toll-points';
    case 'expire':
      return r.kind === 'expire';
    case 'adjust':
      return r.kind === 'adjust';
    case 'tier':
      return r.kind === 'tier';
  }
}

const STATUS_LABEL: Record<ActivityRecord['status'], { text: string; cls: string }> = {
  success: { text: 'Thành công', cls: 'badge--green' },
  pending: { text: 'Đang xử lý', cls: 'badge--amber' },
  failed: { text: 'Thất bại', cls: 'badge--red' },
  reversed: { text: 'Đã hoàn', cls: 'badge--blue' },
};

export function Activity() {
  const { activity } = useApp();
  const [filter, setFilter] = useState<FilterId>('all');
  const [detail, setDetail] = useState<ActivityRecord | null>(null);

  const list = useMemo(() => activity.filter((r) => inFilter(r, filter)), [activity, filter]);

  const earnedThisMonth = useMemo(
    () =>
      activity
        .filter((r) => r.points > 0 && new Date(r.datetime).getMonth() === 6) // July (demo month)
        .reduce((s, r) => s + r.points, 0),
    [activity],
  );

  return (
    <div className="page">
      <header style={{ padding: '22px 16px 4px' }}>
        <div className="h1">Hoạt động</div>
        <div className="small muted" style={{ marginTop: 5 }}>
          Tháng này bạn đã tích được <strong style={{ color: 'var(--green)' }}>{fmtNum(earnedThisMonth)} điểm</strong>
        </div>
      </header>

      <div className="filter-row" style={{ margin: '12px 0 14px' }}>
        {FILTERS.map((f) => (
          <button key={f.id} className={`chip ${filter === f.id ? 'chip--on' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon="history" title="Chưa có hoạt động" sub="Các giao dịch tích điểm, đổi điểm và xét hạng của bạn sẽ hiển thị tại đây." />
      ) : (
        <div className="rowlist">
          {list.map((r) => {
            const meta = KIND_META[r.kind];
            const pointsCls = r.kind === 'expire' ? 'row-points--exp' : r.points > 0 ? 'row-points--plus' : 'row-points--minus';
            return (
              <button key={r.id} className="rowitem" onClick={() => setDetail(r)}>
                <span className="row-ic" style={{ background: meta.bg, color: meta.fg }}>
                  <Icon name={meta.icon} />
                </span>
                <span className="row-main">
                  <span className="row-title">{r.title}</span>
                  <span className="row-sub">
                    {fmtDateTime(r.datetime)}
                    {r.vehicle ? ` • ${r.vehicle}` : ''}
                  </span>
                </span>
                <span className="row-end">
                  {r.points !== 0 && (
                    <span className={`row-points ${pointsCls}`}>
                      {r.points > 0 ? '+' : '−'}
                      {fmtNum(Math.abs(r.points))}
                    </span>
                  )}
                  {r.cash != null && r.cash > 0 && <span className="row-cash">{fmtVND(r.cash)}</span>}
                  {r.points === 0 && r.kind === 'tier' && <span className="badge badge--blue">Hạng mới</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {detail && (
        <Sheet onClose={() => setDetail(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span className="row-ic" style={{ background: KIND_META[detail.kind].bg, color: KIND_META[detail.kind].fg }}>
              <Icon name={KIND_META[detail.kind].icon} />
            </span>
            <div>
              <div className="h2">{KIND_META[detail.kind].label}</div>
              <span className={`badge ${STATUS_LABEL[detail.status].cls}`}>{STATUS_LABEL[detail.status].text}</span>
            </div>
          </div>
          <div className="card" style={{ marginTop: 14, padding: '6px 17px', boxShadow: 'none', border: '1px solid var(--line)' }}>
            <div className="kv">
              <span className="k">Giao dịch</span>
              <span className="v" style={{ maxWidth: 210 }}>{detail.title}</span>
            </div>
            <div className="kv">
              <span className="k">Thời gian</span>
              <span className="v">{fmtDateTime(detail.datetime)}</span>
            </div>
            {detail.vehicle && (
              <div className="kv">
                <span className="k">Phương tiện</span>
                <span className="v">{detail.vehicle}</span>
              </div>
            )}
            {detail.partner && (
              <div className="kv">
                <span className="k">Đối tác / địa điểm</span>
                <span className="v">{detail.partner}</span>
              </div>
            )}
            {detail.points !== 0 && (
              <div className="kv">
                <span className="k">Điểm</span>
                <span className="v" style={{ color: detail.points > 0 ? 'var(--green)' : 'var(--red)' }}>
                  {detail.points > 0 ? '+' : '−'}
                  {fmtNum(Math.abs(detail.points))} điểm
                </span>
              </div>
            )}
            {detail.cash != null && detail.cash > 0 && (
              <div className="kv">
                <span className="k">Số tiền</span>
                <span className="v">{fmtVND(detail.cash)}</span>
              </div>
            )}
            <div className="kv">
              <span className="k">Mã giao dịch</span>
              <span className="v">{detail.id}</span>
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 14, lineHeight: 1.55 }}>
            {detail.detail}
          </p>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 16 }} onClick={() => setDetail(null)}>
            Đóng
          </button>
        </Sheet>
      )}
    </div>
  );
}
