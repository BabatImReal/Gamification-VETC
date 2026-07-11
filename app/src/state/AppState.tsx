import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import { ACTIVITY, MISSIONS, REWARDS, USER, VEHICLES } from '../data/mock';
import type { ActivityRecord, Mission, Redemption, Reward, Vehicle } from '../data/mock';
import MiniApp from '../sdk/miniapp';

interface AppState {
  pointsBalance: number;
  cashBalance: number;
  selectedVehicle: Vehicle;
  setSelectedVehicleId: (id: string) => void;
  activity: ActivityRecord[];
  missions: Mission[];
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
  const [pointsBalance, setPointsBalance] = useState(USER.pointsBalance);
  const [cashBalance, setCashBalance] = useState(USER.cashBalance);
  const [vehicleId, setSelectedVehicleId] = useState(VEHICLES[0].id);
  const [activity, setActivity] = useState<ActivityRecord[]>(ACTIVITY);
  const [missions, setMissions] = useState<Mission[]>(MISSIONS);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
        setPointsBalance(data.loyalty.pointsBalance);
        setCashBalance(data.loyalty.cashBalance);
        setActivity(data.activity);
        setMissions(data.missions.length ? data.missions : MISSIONS);
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
  }, [showToast]);

  const redeem = useCallback(async (reward: Reward): Promise<Redemption> => {
    if (backendReady) {
      const result = await api.redeemReward(reward.id, vehicleId);
      setPointsBalance(result.loyalty.pointsBalance);
      setCashBalance(result.loyalty.cashBalance);
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
  }, [backendReady, vehicleId]);

  const completeMission = useCallback(async (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId) ?? MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;
    if (backendReady) {
      const result = await api.completeMission(missionId);
      setMissions(result.missions);
      setPointsBalance(result.loyalty.pointsBalance);
      setCashBalance(result.loyalty.cashBalance);
      setActivity(result.activity);
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
  }, [backendReady, missions, showToast]);

  const activateService = useCallback(async (serviceId: string, serviceName: string) => {
    if (backendReady) {
      const result = await api.activateService(serviceId);
      setActivity(result.activity);
      showToast(`Đã kích hoạt: ${result.service.name}`);
      MiniApp.pushEvent('service_activate', { serviceId, source: 'backend' });
      return;
    }
    showToast(`Mở dịch vụ: ${serviceName}`);
    MiniApp.pushEvent('service_activate', { serviceId, source: 'offline' });
  }, [backendReady, showToast]);

  const selectedVehicle = VEHICLES.find((v) => v.id === vehicleId) ?? VEHICLES[0];

  const value = useMemo(
    () => ({
      pointsBalance,
      cashBalance,
      selectedVehicle,
      setSelectedVehicleId,
      activity,
      missions,
      redemptions,
      redeem,
      completeMission,
      activateService,
      loading,
      backendReady,
      toast,
      showToast,
    }),
    [pointsBalance, cashBalance, selectedVehicle, activity, missions, redemptions, redeem, completeMission, activateService, loading, backendReady, toast, showToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppStateProvider');
  return v;
}

/** Static reward lookup shared by screens. */
export function rewardById(id: string | undefined): Reward | undefined {
  return REWARDS.find((r) => r.id === id);
}
