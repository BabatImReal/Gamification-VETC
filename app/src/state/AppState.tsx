import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ACTIVITY, MISSIONS, REWARDS, USER, VEHICLES } from '../data/mock';
import type { ActivityRecord, Mission, Reward, Vehicle } from '../data/mock';
import MiniApp from '../sdk/miniapp';

export interface Redemption {
  id: string;
  rewardId: string;
  title: string;
  code: string;
  redeemedAt: string;
  expiry: string;
  fulfillment: 'voucher' | 'service';
}

interface AppState {
  pointsBalance: number;
  cashBalance: number;
  selectedVehicle: Vehicle;
  setSelectedVehicleId: (id: string) => void;
  activity: ActivityRecord[];
  missions: Mission[];
  redemptions: Redemption[];
  redeem: (reward: Reward) => Redemption;
  completeMission: (missionId: string) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const Ctx = createContext<AppState | null>(null);

let seq = 0;

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [pointsBalance, setPointsBalance] = useState(USER.pointsBalance);
  const [vehicleId, setSelectedVehicleId] = useState(VEHICLES[0].id);
  const [activity, setActivity] = useState<ActivityRecord[]>(ACTIVITY);
  const [missions, setMissions] = useState<Mission[]>(MISSIONS);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const redeem = useCallback((reward: Reward): Redemption => {
    const now = new Date().toISOString();
    const redemption: Redemption = {
      id: `RD-${Date.now()}-${seq++}`,
      rewardId: reward.id,
      title: reward.title,
      code: `VETC${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      redeemedAt: now,
      expiry: reward.expiry,
      fulfillment: reward.fulfillment,
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
        detail:
          reward.fulfillment === 'voucher'
            ? 'Voucher đã phát hành trong mục Ưu đãi của tôi.'
            : 'Ưu đãi đã được kích hoạt cho tài khoản của bạn.',
      },
      ...a,
    ]);
    MiniApp.pushEvent('reward_redeem', { rewardId: reward.id, points: reward.points });
    return redemption;
  }, []);

  const completeMission = useCallback((missionId: string) => {
    const mission = MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;
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
    });
    showToast(`+${mission.loyaltyPoints.toLocaleString('vi-VN')} điểm • +${mission.xp} XP`);
  }, [showToast]);

  const selectedVehicle = VEHICLES.find((v) => v.id === vehicleId) ?? VEHICLES[0];

  const value = useMemo(
    () => ({
      pointsBalance,
      cashBalance: USER.cashBalance,
      selectedVehicle,
      setSelectedVehicleId,
      activity,
      missions,
      redemptions,
      redeem,
      completeMission,
      toast,
      showToast,
    }),
    [pointsBalance, selectedVehicle, activity, missions, redemptions, redeem, completeMission, toast, showToast],
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
