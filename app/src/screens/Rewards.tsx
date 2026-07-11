import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Sheet, Visual } from '../components/Shared';
import { REWARDS, TIERS, USER } from '../data/mock';
import type { Reward } from '../data/mock';
import { useApp } from '../state/AppState';
import { fmtDate, fmtNum } from '../utils/format';

type FilterId = 'all' | 'available' | 'toll' | 'carcare' | 'insurance' | 'parking' | 'partner' | 'expiring';
type SortId = 'recommended' | 'low' | 'high' | 'new' | 'expiring';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'available', label: 'Đủ điểm đổi' },
  { id: 'toll', label: 'Phí & di chuyển' },
  { id: 'carcare', label: 'Chăm sóc xe' },
  { id: 'insurance', label: 'Bảo hiểm' },
  { id: 'parking', label: 'Bãi đỗ' },
  { id: 'partner', label: 'Đối tác' },
  { id: 'expiring', label: 'Sắp hết hạn' },
];

const SORTS: { id: SortId; label: string }[] = [
  { id: 'recommended', label: 'Đề xuất cho bạn' },
  { id: 'low', label: 'Điểm thấp nhất' },
  { id: 'high', label: 'Giá trị cao nhất' },
  { id: 'new', label: 'Mới nhất' },
  { id: 'expiring', label: 'Sắp hết hạn' },
];

const tierRank: Record<string, number> = { silver: 0, gold: 1, platinum: 2, diamond: 3 };
const EXPIRING_SOON_MS = 21 * 24 * 3600 * 1000;

function matchesFilter(r: Reward, f: FilterId, points: number): boolean {
  switch (f) {
    case 'all':
      return true;
    case 'available':
      return r.points <= points && tierRank[r.minTier] <= tierRank[USER.tier];
    case 'toll':
      return r.category === 'toll' || r.category === 'ev';
    case 'carcare':
      return r.category === 'carcare' || r.category === 'maintenance' || r.category === 'roadside';
    case 'insurance':
      return r.category === 'insurance';
    case 'parking':
      return r.category === 'parking';
    case 'partner':
      return r.category === 'partner' || r.category === 'tasco';
    case 'expiring':
      return new Date(r.expiry).getTime() - Date.now() < EXPIRING_SOON_MS;
  }
}

export function Rewards() {
  const { pointsBalance } = useApp();
  const [params, setParams] = useSearchParams();
  const filter = (params.get('filter') as FilterId) ?? (params.get('cat') === 'toll' ? 'toll' : 'all');
  const [sort, setSort] = useState<SortId>('recommended');
  const [sortSheet, setSortSheet] = useState(false);

  const list = useMemo(() => {
    const filtered = REWARDS.filter((r) => matchesFilter(r, filter, pointsBalance));
    const sorted = [...filtered];
    switch (sort) {
      case 'low':
        sorted.sort((a, b) => a.points - b.points);
        break;
      case 'high':
        sorted.sort((a, b) => (b.cashValue ?? 0) - (a.cashValue ?? 0));
        break;
      case 'new':
        sorted.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
        break;
      case 'expiring':
        sorted.sort((a, b) => a.expiry.localeCompare(b.expiry));
        break;
      default:
        // recommended: affordable first, then cheapest
        sorted.sort((a, b) => {
          const aOk = a.points <= pointsBalance ? 0 : 1;
          const bOk = b.points <= pointsBalance ? 0 : 1;
          return aOk - bOk || a.points - b.points;
        });
    }
    return sorted;
  }, [filter, sort, pointsBalance]);

  return (
    <div className="page">
      <header style={{ padding: '22px 16px 4px' }}>
        <div className="h1">Đổi điểm</div>
        <div className="small muted" style={{ marginTop: 5 }}>
          Bạn đang có <strong style={{ color: 'var(--green)' }}>{fmtNum(pointsBalance)} điểm</strong> — 1 điểm ≈ 1đ giá trị
          quy đổi
        </div>
      </header>

      <div className="filter-row" style={{ marginTop: 12 }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`chip ${filter === f.id ? 'chip--on' : ''}`}
            onClick={() => setParams(f.id === 'all' ? {} : { filter: f.id })}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px 12px' }}>
        <span className="small muted">{list.length} ưu đãi</span>
        <button className="sortbtn" onClick={() => setSortSheet(true)}>
          <Icon name="swap" />
          {SORTS.find((s) => s.id === sort)!.label}
        </button>
      </div>

      <div className="reward-grid">
        {list.map((r) => {
          const enough = r.points <= pointsBalance;
          const tierOk = tierRank[r.minTier] <= tierRank[USER.tier];
          return (
            <Link key={r.id} to={`/rewards/${r.id}`} className="reward-card">
              <div className="reward-visual">
                <Visual kind={r.image} />
                {r.isNew && <span className="badge badge--green" style={{ background: 'rgba(255,255,255,0.94)' }}>Mới</span>}
              </div>
              <div className="reward-body">
                <div className="reward-title">{r.title}</div>
                <div className="reward-points">
                  {r.points === 0 ? 'Miễn phí' : fmtNum(r.points)}
                  {r.points > 0 && <small>điểm</small>}
                </div>
                <div className="reward-meta">
                  HSD {fmtDate(r.expiry)}
                  {!tierOk && ` • Hạng ${TIERS.find((t) => t.id === r.minTier)!.name}+`}
                </div>
                <div className="reward-foot">
                  <button className="reward-btn" disabled={!enough || !tierOk}>
                    {!tierOk ? `Cần hạng ${TIERS.find((t) => t.id === r.minTier)!.name}` : enough ? 'Đổi ngay' : 'Chưa đủ điểm'}
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {sortSheet && (
        <Sheet onClose={() => setSortSheet(false)}>
          <div className="h2" style={{ marginBottom: 8 }}>
            Sắp xếp theo
          </div>
          {SORTS.map((s) => (
            <button
              key={s.id}
              className="rowitem"
              onClick={() => {
                setSort(s.id);
                setSortSheet(false);
              }}
            >
              <span className="row-main">
                <span className="row-title" style={{ color: sort === s.id ? 'var(--brand)' : undefined }}>
                  {s.label}
                </span>
              </span>
              {sort === s.id && (
                <span style={{ color: 'var(--brand)', width: 20, height: 20 }}>
                  <Icon name="check" />
                </span>
              )}
            </button>
          ))}
        </Sheet>
      )}
    </div>
  );
}
