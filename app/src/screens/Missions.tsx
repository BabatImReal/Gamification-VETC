import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Sheet, Visual } from '../components/Shared';
import { ACHIEVEMENTS, GAME_PROFILE } from '../data/mock';
import type { Mission } from '../data/mock';
import { useApp } from '../state/AppState';
import { fmtDate, fmtDateTime, fmtNum } from '../utils/format';

const FILTERS = ['Tất cả', 'Chiến dịch', 'Dịch vụ', 'An toàn', 'EV', 'Hằng ngày'] as const;

function modeLabel(mode: string | undefined) {
  if (mode === 'openai') return 'AI mode: OpenAI';
  if (mode === 'rules-fallback') return 'AI mode: Rules fallback';
  return 'AI mode: Rules';
}

function modeClass(mode: string | undefined) {
  if (mode === 'openai') return 'badge badge--green';
  if (mode === 'rules-fallback') return 'badge badge--amber';
  return 'badge badge--gray';
}

export function Missions() {
  const { missions, recommendation, recommendationHistory, completeMission } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Tất cả');
  const [detail, setDetail] = useState<Mission | null>(null);

  const list = useMemo(
    () => (filter === 'Tất cả' ? missions : missions.filter((m) => m.category === filter)),
    [filter, missions],
  );

  const active = missions.filter((m) => m.status === 'active').length;
  const completed = missions.filter((m) => m.status === 'completed').length;
  const xpPct = Math.round((GAME_PROFILE.xp / GAME_PROFILE.nextLevelXp) * 100);

  return (
    <div className="page">
      <header style={{ padding: '22px 16px 4px' }}>
        <div className="h1">Nhiệm vụ</div>
        <div className="small muted" style={{ marginTop: 5 }}>
          AI gợi ý nhiệm vụ để tăng tương tác, không thay thế điểm Loyalty hiện có.
        </div>
      </header>

      <div className="section">
        <div className="card game-card">
          <div className="game-top">
            <div>
              <div className="small muted">Cấp độ hiện tại</div>
              <div className="h2">{GAME_PROFILE.levelName}</div>
            </div>
            <span className="badge badge--blue">
              <Icon name="star" />
              {GAME_PROFILE.streakDays} ngày streak
            </span>
          </div>
          <div className="progress-track" style={{ marginTop: 12 }}>
            <div className="progress-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <div className="game-stats">
            <span>
              {fmtNum(GAME_PROFILE.xp)} / {fmtNum(GAME_PROFILE.nextLevelXp)} XP
            </span>
            <span>{active} đang mở • {completed} hoàn thành</span>
          </div>
          <div className="community-box">
            <div className="small" style={{ fontWeight: 700 }}>Thử thách cộng đồng</div>
            <div className="small muted" style={{ marginTop: 3 }}>
              {GAME_PROFILE.communityTarget} — đã đạt {GAME_PROFILE.communityProgress}%
            </div>
          </div>
        </div>
      </div>

      {recommendation && (
        <div className="section">
          <div className="scenario-panel">
            <div className="scenario-head">
              <span className="scenario-label">AI cá nhân hóa theo người dùng hiện tại</span>
              <span className={modeClass(recommendation.personalizationMeta?.mode)}>
                {modeLabel(recommendation.personalizationMeta?.mode)}
              </span>
            </div>
            <div className="scenario-select" aria-label="Người dùng hiện tại">
              {recommendation.profile.label}
            </div>
            <div className="small muted" style={{ marginTop: 10, lineHeight: 1.55 }}>
              {recommendation.recommendationSummary}
            </div>
            <div className="kv" style={{ marginTop: 10 }}>
              <span className="k">Next best action</span>
              <span className="v">{recommendation.nextBestAction}</span>
            </div>
            <div className="scenario-signals">
              <span>{recommendation.profile.segment}</span>
              <span>{recommendation.profile.city}</span>
              <span>Engagement {recommendation.profile.engagementScore}</span>
              <span>Vắng {recommendation.profile.lastActiveDays} ngày</span>
              <span>{recommendation.profile.vehicleType}</span>
            </div>
            {recommendation.personalizationMeta && (
              <div className="explain-panel">
                <div className="small" style={{ fontWeight: 700 }}>Logic AI đang dùng</div>
                <div className="small muted" style={{ marginTop: 4, lineHeight: 1.55 }}>
                  {recommendation.personalizationMeta.scoringFormula}
                </div>
                <div className="small muted" style={{ marginTop: 10 }}>
                  Activity rules khớp với hồ sơ hiện tại
                </div>
                <div className="ai-signal-list">
                  {recommendation.personalizationMeta.matchedActivityRules.length ? (
                    recommendation.personalizationMeta.matchedActivityRules.map((rule) => (
                      <span key={rule}>{rule}</span>
                    ))
                  ) : (
                    <span>Không có activity rule nổi bật, AI ưu tiên theo profile và service gap.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {recommendationHistory.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="h2">Lịch sử gợi ý AI</div>
            <span className="small muted">{recommendationHistory.length} lần gần nhất</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendationHistory.map((snapshot, index) => (
              <div
                key={snapshot.id}
                className="card"
                style={{ padding: '14px 16px', border: index === 0 ? '1px solid rgba(10,61,145,0.18)' : undefined }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="small muted">{fmtDateTime(snapshot.createdAt)}</div>
                    <div className="mission-title" style={{ marginTop: 6, fontSize: 15 }}>
                      {snapshot.recommendations[0]?.title ?? 'Chưa có gợi ý'}
                    </div>
                    <div className="small muted" style={{ marginTop: 4, lineHeight: 1.55 }}>
                      {snapshot.nextBestAction}
                    </div>
                  </div>
                  <span className={modeClass(snapshot.mode)}>{modeLabel(snapshot.mode)}</span>
                </div>
                <div className="ai-signal-list" style={{ marginTop: 10 }}>
                  {snapshot.recommendations.slice(0, 3).map((item) => (
                    <span key={`${snapshot.id}-${item.id}`}>
                      {item.title}
                      {typeof item.aiScore === 'number' ? ` • ${item.aiScore}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filter-row" style={{ marginTop: 14 }}>
        {FILTERS.map((f) => (
          <button key={f} className={`chip ${filter === f ? 'chip--on' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <div className="h2">Gợi ý tiếp theo</div>
          <Link to="/rewards" className="section-link">Đổi thưởng</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((m) => {
            const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
            const canComplete = m.status === 'active' && m.progress >= m.target - 1;
            return (
              <div key={m.id} className="mission-card">
                <div className="mission-visual">
                  <Visual kind={m.image} />
                </div>
                <div className="mission-main">
                  <div className="mission-head">
                    <span className="badge badge--blue">{m.category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {typeof m.aiScore === 'number' && <span className="mission-score">Fit {m.aiScore}</span>}
                      <span className="small muted">Hạn {fmtDate(m.deadline)}</span>
                    </div>
                  </div>
                  <div className="mission-title">{m.title}</div>
                  <div className="mission-desc">{m.description}</div>
                  {m.aiSignals?.length ? (
                    <div className="ai-signal-list">
                      {m.aiSignals.map((signal) => (
                        <span key={signal}>{signal}</span>
                      ))}
                    </div>
                  ) : null}
                  <div className="progress-track" style={{ marginTop: 10 }}>
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mission-meta">
                    <span>{m.progress}/{m.target} bước</span>
                    <span>+{m.xp} XP • +{fmtNum(m.loyaltyPoints)} điểm</span>
                  </div>
                  <div className="mission-actions">
                    <button className="btn btn-ghost" onClick={() => setDetail(m)}>
                      Vì sao gợi ý?
                    </button>
                    <button className="btn btn-primary" disabled={!canComplete} onClick={() => completeMission(m.id)}>
                      {m.status === 'completed' ? 'Đã nhận' : canComplete ? 'Hoàn thành' : m.nextAction}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="h2" style={{ marginBottom: 10 }}>
          Huy hiệu
        </div>
        <div className="achievement-grid">
          {ACHIEVEMENTS.map((a) => {
            const pct = Math.min(100, Math.round((a.progress / a.target) * 100));
            return (
              <div key={a.id} className={`achievement ${a.unlocked ? 'achievement--on' : ''}`}>
                <div className="achievement-ic">
                  <Visual kind={a.image} />
                </div>
                <div className="achievement-title">{a.title}</div>
                <div className="achievement-sub">{a.description}</div>
                <div className="small muted" style={{ marginTop: 7 }}>
                  {a.unlocked ? 'Đã mở khoá' : `${pct}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {detail && (
        <Sheet onClose={() => setDetail(null)}>
          <div className="h2">Giải thích gợi ý AI</div>
          <div className="card" style={{ marginTop: 14, padding: '15px 17px', border: '1px solid var(--line)', boxShadow: 'none' }}>
            <div className="mission-title">{detail.title}</div>
            <p className="small muted" style={{ marginTop: 8, lineHeight: 1.6 }}>{detail.aiReason}</p>
            {detail.aiSignals?.length ? (
              <div className="ai-signal-list">
                {detail.aiSignals.map((signal) => (
                  <span key={signal}>{signal}</span>
                ))}
              </div>
            ) : null}
            <div className="kv" style={{ marginTop: 8 }}>
              <span className="k">Hành động tốt nhất</span>
              <span className="v">{detail.nextAction}</span>
            </div>
            {typeof detail.aiScore === 'number' && (
              <div className="kv">
                <span className="k">Điểm phù hợp</span>
                <span className="v">{detail.aiScore}/99</span>
              </div>
            )}
            {detail.scoringFormula && (
              <div className="kv">
                <span className="k">Công thức</span>
                <span className="v mission-formula">{detail.scoringFormula}</span>
              </div>
            )}
            {detail.scoreBreakdown && (
              <div className="score-grid">
                <div className="score-item">
                  <span>Segment fit</span>
                  <strong>{detail.scoreBreakdown.segmentFit}</strong>
                </div>
                <div className="score-item">
                  <span>Activity fit</span>
                  <strong>{detail.scoreBreakdown.activityFit}</strong>
                </div>
                <div className="score-item">
                  <span>Service gap</span>
                  <strong>{detail.scoreBreakdown.serviceGapFit}</strong>
                </div>
                <div className="score-item">
                  <span>Campaign fit</span>
                  <strong>{detail.scoreBreakdown.campaignFit}</strong>
                </div>
                <div className="score-item">
                  <span>Urgency fit</span>
                  <strong>{detail.scoreBreakdown.urgencyFit}</strong>
                </div>
                <div className="score-item">
                  <span>Reward affinity</span>
                  <strong>{detail.scoreBreakdown.rewardAffinityFit}</strong>
                </div>
                <div className="score-item score-item--penalty">
                  <span>Friction penalty</span>
                  <strong>-{detail.scoreBreakdown.frictionPenalty}</strong>
                </div>
              </div>
            )}
            {detail.vehicle && (
              <div className="kv">
                <span className="k">Xe liên quan</span>
                <span className="v">{detail.vehicle}</span>
              </div>
            )}
            <div className="kv">
              <span className="k">Chiến dịch</span>
              <span className="v">{detail.campaign}</span>
            </div>
          </div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setDetail(null)}>
            Đã hiểu
          </button>
        </Sheet>
      )}
    </div>
  );
}
