function tierFromEligibleSpending(eligibleSpending) {
  if (eligibleSpending >= 120_000_000) return 'platinum';
  if (eligibleSpending >= 40_000_000) return 'gold';
  return 'silver';
}

function createVehicle(profile) {
  const platePrefix = {
    'Hà Nội': '30A',
    'TP.HCM': '51K',
    'Đà Nẵng': '43A',
    'Hải Phòng': '15A',
    'Nha Trang': '79A',
    'Đà Lạt': '49A',
  }[profile.city] ?? '30A';

  const recentTollCount = profile.etcUsage === 'Hằng ngày'
    ? 18
    : profile.etcUsage === '4-5 lần/tuần'
      ? 12
      : profile.etcUsage === '3-4 lần/tuần'
        ? 9
        : profile.etcUsage === 'Cuối tuần'
          ? 5
          : profile.etcUsage === '2-3 lần/tuần'
            ? 6
            : profile.etcUsage === '2-3 lần/tháng'
              ? 2
              : 0;

  return {
    id: `V-${profile.id}`,
    model: profile.vehicleType === 'EV'
      ? 'VinFast VF 8'
      : profile.vehicleType === 'SUV'
        ? 'Mazda CX-5'
        : profile.vehicleType === 'MPV'
          ? 'Kia Carnival'
          : profile.vehicleType === 'Pickup'
            ? 'Ford Ranger'
            : profile.vehicleType === 'Motorbike'
              ? 'Honda SH'
              : profile.vehicleType === 'Compact Car'
                ? 'Kia Morning'
                : 'Toyota Vios',
    plate: `${platePrefix}-${String(Number(profile.id.slice(1)) * 37).padStart(5, '0')}.45`,
    type: `${profile.vehicleType} • ${profile.vehicleType === 'Motorbike' ? '2 bánh' : '5 chỗ'}`,
    etagStatus: profile.etcUsage === 'Mới đăng ký' ? 'inactive' : 'active',
    insuranceExpiry: profile.insuranceStatus === 'No' ? null : profile.insuranceStatus === 'Expiring soon' ? '2026-08-20' : '2027-02-28',
    roadsideActive: profile.roadsideEnabled,
    recentTollCount,
    nextMaintenance: profile.vehicleAgeYears >= 5 ? '2026-09-20' : null,
  };
}

function activityRecord(id, kind, title, datetime, partner, points, detail, vehicle = null, cash = null) {
  return {
    id,
    kind,
    title,
    datetime,
    vehicle,
    partner,
    points,
    cash,
    status: 'success',
    detail,
  };
}

function buildActivityFromSummary(profile, stats, vehicle) {
  const items = [];
  let index = 1;

  const push = (kind, title, points, detail, partner, cash = null) => {
    const day = String(Math.max(1, 27 - index)).padStart(2, '0');
    items.push(activityRecord(
      `${profile.id}-${index}`,
      kind,
      title,
      `2026-07-${day}T09:${String((index * 7) % 60).padStart(2, '0')}:00`,
      partner,
      points,
      detail,
      vehicle.plate,
      cash,
    ));
    index += 1;
  };

  for (let i = 0; i < stats.etcTrips; i += 1) {
    push('earn', 'Hoàn thành chuyến ETC', 20, 'Giao dịch ETC được ghi nhận cho người dùng hiện tại.', 'VETC', 33_000);
  }
  for (let i = 0; i < stats.walletTopups; i += 1) {
    push('earn', 'Nạp ví VETC', 25, 'Nạp tiền vào tài khoản giao thông.', 'Vietcombank', 500_000);
  }
  for (let i = 0; i < stats.parkingPayments; i += 1) {
    push('service', 'Thanh toán bãi đỗ', 15, 'Thanh toán bãi đỗ bằng VETC.', 'Parking', 30_000);
  }
  for (let i = 0; i < stats.evCharges; i += 1) {
    push('service', 'Thanh toán sạc xe', 30, 'Thanh toán sạc xe điện qua VETC.', 'EV Charging', 120_000);
  }
  for (let i = 0; i < stats.referralShares; i += 1) {
    push('bonus', 'Chia sẻ mã giới thiệu', 35, 'Đã chia sẻ mã giới thiệu với bạn bè.', 'Referral');
  }
  for (let i = 0; i < stats.insuranceViews; i += 1) {
    push('service', 'Xem thông tin bảo hiểm', 5, 'Người dùng đã xem dịch vụ bảo hiểm.', 'Insurance');
  }
  for (let i = 0; i < stats.roadsideViews; i += 1) {
    push('service', 'Xem thông tin cứu hộ', 5, 'Người dùng đã xem dịch vụ cứu hộ.', 'Roadside Assistance');
  }
  for (let i = 0; i < stats.rewardRedemptions; i += 1) {
    push('redeem', 'Đổi voucher Loyalty', 0, 'Người dùng đã đổi một ưu đãi từ Loyalty.', 'VETC Loyalty');
  }
  for (let i = 0; i < stats.logins; i += 1) {
    push('bonus', 'Mở ứng dụng', 5, 'Đăng nhập và mở ứng dụng VETC.', 'App');
  }

  return items.length ? items : [
    activityRecord(`${profile.id}-seed`, 'bonus', 'Mở ứng dụng lần đầu', '2026-07-11T08:00:00', 'App', 5, 'Người dùng mới bắt đầu sử dụng ứng dụng.', vehicle.plate),
  ];
}

function personalizeServices(baseServices, profile, vehicle) {
  return baseServices.map((service) => {
    if (service.id === 'S-EV') {
      return {
        ...service,
        status: profile.vehicleType === 'EV' ? 'available' : 'locked',
        availableFor: profile.vehicleType === 'EV' ? `${vehicle.model}` : 'Chỉ dành cho người dùng xe điện',
      };
    }
    if (service.id === 'S-RSA') {
      return {
        ...service,
        status: profile.roadsideEnabled ? 'active' : 'available',
        availableFor: `${vehicle.model} • ${profile.roadsideEnabled ? 'đã bảo vệ' : 'chưa kích hoạt'}`,
      };
    }
    if (service.id === 'S-INS-TNDS') {
      return {
        ...service,
        availableFor: `${vehicle.model}${profile.insuranceStatus === 'Expiring soon' ? ' (sắp hết hạn)' : profile.insuranceStatus === 'No' ? ' (chưa có bảo hiểm)' : ''}`,
      };
    }
    return {
      ...service,
      availableFor: `${vehicle.model} • ${vehicle.plate}`,
    };
  });
}

export function createMockDb({ profileId, profiles, profileActivity, services, rewards }) {
  const profile = profiles.find((item) => item.id === profileId) ?? profiles[0];
  const stats = profileActivity[profile.id] ?? { activityCount: 0, walletTopups: 0, referralShares: 0, logins: 0, etcTrips: 0, parkingPayments: 0, carWashBookings: 0, evCharges: 0, insuranceViews: 0, roadsideViews: 0, rewardRedemptions: 0 };
  const eligibleSpending = Math.max(6_000_000, profile.loyaltyPoints * 10_000);
  const tier = tierFromEligibleSpending(eligibleSpending);
  const vehicle = createVehicle(profile);
  const user = {
    id: profile.id,
    name: profile.name,
    phone: `09${String(Number(profile.id.slice(1)) * 137).padStart(8, '0').slice(0, 8)}`,
    email: `${profile.id.toLowerCase()}@vetc.demo`,
    memberNo: `9704 2026 ${String(Number(profile.id.slice(1)) * 1234).padStart(8, '0')}`,
    memberSince: '2024-01-12',
    tier,
    tierReviewDate: '2027-03-31',
    eligibleSpending,
    pointsBalance: Math.max(60_000, profile.loyaltyPoints * 90),
    cashBalance: profile.walletUsage === 'Cao' ? 1_250_000 : profile.walletUsage === 'Trung bình' ? 620_000 : 180_000,
    expiringPoints: profile.loyaltyPoints > 1000 ? { amount: Math.min(profile.loyaltyPoints * 15, 45_000), date: '2026-12-31' } : null,
    ekycVerified: true,
    linkedBank: 'Vietcombank •• 6789',
  };

  return {
    activeProfile: profile,
    activitySummary: stats,
    user,
    vehicles: [vehicle],
    services: personalizeServices(services, profile, vehicle),
    rewards,
    activity: buildActivityFromSummary(profile, stats, vehicle),
    redemptions: [],
    missionStates: new Map(),
  };
}
