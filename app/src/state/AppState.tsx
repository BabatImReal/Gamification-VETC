import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { RecommendationPayload, RecommendationHistorySnapshot, LoyaltySnapshot } from '../api/client';
import { ACTIVITY, MISSIONS, REWARDS, SERVICES, USER, VEHICLES } from '../data/mock';
import type { ActivityRecord, Mission, Redemption, Reward, Service, User, Vehicle } from '../data/mock';
import MiniApp from '../sdk/miniapp';

interface AppState {
  user: User;
  pointsBalance: number;
  cashBalance: number;
  vehicles: Vehicle[];
  rewards: Reward[];
  services: Service[];
  selectedVehicle: Vehicle;
  setSelectedVehicleId: (id: string) => void;
  activity: ActivityRecord[];
  missions: Mission[];
  recommendation: RecommendationPayload | null;
  recommendationHistory: RecommendationHistorySnapshot[];
  redemptions: Redemption[];
  redeem: (reward: Reward) => Promise<Redemption>;
  completeMission: (missionId: string) => Promise<void>;
  activateService: (serviceId: string, serviceName: string) => Promise<void>;
  loading: boolean;
  backendReady: boolean;
  toast: string | null;
  showToast: (msg: string) => void;
}

const Ctx = createContext<AppState | null>(null);

let seq = 0;

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(USER);
  const [pointsBalance, setPointsBalance] = useState(USER.pointsBalance);
  const [cashBalance, setCashBalance] = useState(USER.cashBalance);
  const [vehicles, setVehicles] = useState<Vehicle[]>(VEHICLES);
  const [rewards, setRewards] = useState<Reward[]>(REWARDS);
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [vehicleId, setSelectedVehicleId] = useState(VEHICLES[0].id);
  const [activity, setActivity] = useState<ActivityRecord[]>(ACTIVITY);
  const [missions, setMissions] = useState<Mission[]>(MISSIONS);
  const [recommendation, setRecommendation] = useState<RecommendationPayload | null>(null);
  const [recommendationHistory, setRecommendationHistory] = useState<RecommendationHistorySnapshot[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const applyLoyalty = useCallback((snapshot: LoyaltySnapshot) => {
    setPointsBalance(snapshot.pointsBalance);
    setCashBalance(snapshot.cashBalance);
    setUser((current) => ({
      ...current,
      tier: snapshot.tier,
      eligibleSpending: snapshot.eligibleSpending,
      expiringPoints: snapshot.expiringPoints,
      pointsBalance: snapshot.pointsBalance,
      cashBalance: snapshot.cashBalance,
    }));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    let alive = true;
    async function boot() {
      setLoading(true);
      try {
        const auth = await MiniApp.getAuthCode();
        const data = await api.bootstrap(auth.data?.authCode);
        if (!alive) return;
        setUser(data.user);
        setVehicles(data.vehicles);
        setRewards(data.rewards);
        setServices(data.services);
        setSelectedVehicleId(data.vehicles[0]?.id ?? VEHICLES[0].id);
        applyLoyalty(data.loyalty);
        setActivity(data.activity);
        setMissions(data.missions.length ? data.missions : MISSIONS);
        const personalized = await api.getRecommendations(data.user.id);
        const history = await api.getRecommendationHistory(data.user.id, 6);
        if (!alive) return;
        setRecommendation(personalized);
        setRecommendationHistory(history.snapshots);
        setMissions(personalized.recommendations);
        setRedemptions(data.redemptions);
        setBackendReady(true);
        MiniApp.pushEvent('app_bootstrap_success', { userId: data.user.id });
        if (!auth.ok) showToast('Không lấy được auth code từ MiniApp SDK mock');
      } catch (error) {
        if (!alive) return;
        setBackendReady(false);
        showToast(`Backend chưa sẵn sàng — dùng dữ liệu offline`);
        MiniApp.pushEvent('api_error', {
          apiName: 'bootstrap',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        if (alive) setLoading(false);
      }
    }
    boot();
    return () => {
      alive = false;
    };
  }, [applyLoyalty, showToast]);

  const redeem = useCallback(async (reward: Reward): Promise<Redemption> => {
    if (backendReady) {
      const result = await api.redeemReward(reward.id, vehicleId);
      applyLoyalty(result.loyalty);
      setRedemptions((r) => [result.redemption, ...r.filter((x) => x.id !== result.redemption.id)]);
      setActivity(result.activity);
      MiniApp.pushEvent('reward_redeem', { rewardId: reward.id, points: reward.points, source: 'backend' });
      return result.redemption;
    }

    const now = new Date().toISOString();
    const redemption: Redemption = {
      id: `RD-${Date.now()}-${seq++}`,
      rewardId: reward.id,
      title: reward.title,
      code: `VETC${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      redeemedAt: now,
      expiry: reward.expiry,
      fulfillment: reward.fulfillment,
      vehicleId,
      status: 'active',
    };
    setPointsBalance((p) => p - reward.points);
    setRedemptions((r) => [redemption, ...r]);
    setActivity((a) => [
      {
        id: redemption.id,
        kind: 'redeem',
        title: `Đổi ${reward.title}`,
        datetime: now,
        vehicle: null,
        partner: null,
        points: -reward.points,
        cash: null,
        status: 'success',
        detail: reward.fulfillment === 'voucher' ? 'Voucher đã phát hành trong mục Ưu đãi của tôi.' : 'Ưu đãi đã được kích hoạt cho tài khoản của bạn.',
      },
      ...a,
    ]);
    MiniApp.pushEvent('reward_redeem', { rewardId: reward.id, points: reward.points, source: 'offline' });
    return redemption;
  }, [applyLoyalty, backendReady, vehicleId]);

  const completeMission = useCallback(async (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId) ?? MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;
    if (backendReady) {
      const result = await api.completeMission(missionId, user.id);
      setMissions(result.missions);
      applyLoyalty(result.loyalty);
      setActivity(result.activity);
      const personalized = await api.getRecommendations(user.id);
      const history = await api.getRecommendationHistory(user.id, 6);
      setRecommendation(personalized);
      setRecommendationHistory(history.snapshots);
      setMissions(personalized.recommendations);
      MiniApp.pushEvent('mission_complete', {
        missionId: result.mission.id,
        campaign: result.mission.campaign,
        xp: result.mission.xp,
        loyaltyPoints: result.mission.loyaltyPoints,
        source: 'backend',
      });
      showToast(`+${result.mission.loyaltyPoints.toLocaleString('vi-VN')} điểm • +${result.mission.xp} XP`);
      return;
    }
    setMissions((items) =>
      items.map((m) => (m.id === missionId ? { ...m, progress: m.target, status: 'completed' } : m)),
    );
    setPointsBalance((p) => p + mission.loyaltyPoints);
    const now = new Date().toISOString();
    setActivity((a) => [
      {
        id: `M-${Date.now()}-${seq++}`,
        kind: 'bonus',
        title: `Hoàn thành nhiệm vụ: ${mission.title}`,
        datetime: now,
        vehicle: mission.vehicle,
        partner: 'VETC Loyalty',
        points: mission.loyaltyPoints,
        cash: null,
        status: 'success',
        detail: `Nhận ${mission.xp} XP và ${mission.loyaltyPoints.toLocaleString('vi-VN')} điểm Loyalty từ ${mission.campaign}.`,
      },
      ...a,
    ]);
    MiniApp.pushEvent('mission_complete', {
      missionId: mission.id,
      campaign: mission.campaign,
      xp: mission.xp,
      loyaltyPoints: mission.loyaltyPoints,
      source: 'offline',
    });
    showToast(`+${mission.loyaltyPoints.toLocaleString('vi-VN')} điểm • +${mission.xp} XP`);
  }, [applyLoyalty, backendReady, missions, showToast, user.id]);

  const activateService = useCallback(async (serviceId: string, serviceName: string) => {
    if (backendReady) {
      const result = await api.activateService(serviceId);
      setServices((items) => items.map((item) => (item.id === result.service.id ? result.service : item)));
      setActivity(result.activity);
      showToast(`Đã kích hoạt: ${result.service.name}`);
      MiniApp.pushEvent('service_activate', { serviceId, source: 'backend' });
      return;
    }
    showToast(`Mở dịch vụ: ${serviceName}`);
    MiniApp.pushEvent('service_activate', { serviceId, source: 'offline' });
  }, [backendReady, showToast]);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0] ?? VEHICLES[0];

  const value = useMemo(
    () => ({
      user,
      pointsBalance,
      cashBalance,
      vehicles,
      rewards,
      services,
      selectedVehicle,
      setSelectedVehicleId,
      activity,
      missions,
      recommendation,
      recommendationHistory,
      redemptions,
      redeem,
      completeMission,
      activateService,
      loading,
      backendReady,
      toast,
      showToast,
    }),
    [user, pointsBalance, cashBalance, vehicles, rewards, services, selectedVehicle, activity, missions, recommendation, recommendationHistory, redemptions, redeem, completeMission, activateService, loading, backendReady, toast, showToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppStateProvider');
  return v;
}
