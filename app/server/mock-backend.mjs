import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 5174);

const user = {
  id: 'U001',
  name: 'Nguyễn Minh Anh',
  phone: '0912 345 678',
  email: 'minhanh.nguyen@gmail.com',
  memberNo: '9704 2026 8123 4567',
  memberSince: '2023-04-12',
  tier: 'silver',
  tierReviewDate: '2027-03-31',
  eligibleSpending: 21_500_000,
  pointsBalance: 86_400,
  cashBalance: 1_250_000,
  expiringPoints: { amount: 32_000, date: '2026-12-31' },
  ekycVerified: true,
  linkedBank: 'Vietcombank •• 6789',
};

const vehicles = [
  {
    id: 'V1',
    model: 'Mazda CX-5',
    plate: '51K-123.45',
    type: 'SUV • 5 chỗ',
    etagStatus: 'active',
    insuranceExpiry: '2026-08-09',
    roadsideActive: true,
    recentTollCount: 18,
    nextMaintenance: '2026-09-15',
  },
  {
    id: 'V2',
    model: 'VinFast VF 8',
    plate: '30A-456.78',
    type: 'SUV điện • 5 chỗ',
    etagStatus: 'active',
    insuranceExpiry: '2027-01-20',
    roadsideActive: false,
    recentTollCount: 6,
    nextMaintenance: null,
  },
];

const rewards = [
  reward('R-TOLL-50', 'Giảm 50.000đ phí đường bộ', 'toll', 50_000, 50_000, 'silver', '2026-09-30', 'service', 'road'),
  reward('R-PARK-20', 'Giảm 20.000đ phí bãi đỗ', 'parking', 20_000, 20_000, 'silver', '2026-08-31', 'voucher', 'parking'),
  reward('R-CAFE-30', 'Voucher cà phê Highlands 30.000đ', 'partner', 30_000, 30_000, 'silver', '2026-08-15', 'voucher', 'coffee', true),
  reward('R-INS-50', 'Giảm 50.000đ bảo hiểm TNDS', 'insurance', 50_000, 50_000, 'silver', '2026-12-31', 'voucher', 'shield'),
  reward('R-RSA-150', 'Giảm 15% gói cứu hộ năm đầu', 'roadside', 150_000, 180_000, 'silver', '2026-10-31', 'service', 'tow'),
  reward('R-EV-50', 'Voucher sạc xe điện 50.000đ', 'ev', 50_000, 50_000, 'silver', '2026-07-17', 'voucher', 'ev', true),
  reward('R-WASH-40', 'Giảm 10% dịch vụ rửa xe', 'carcare', 8_000, 10_000, 'silver', '2026-09-30', 'voucher', 'wash'),
  reward('R-MAINT-220', 'Voucher bảo dưỡng xe 250.000đ', 'maintenance', 220_000, 250_000, 'gold', '2026-12-31', 'voucher', 'wrench'),
  reward('R-FOOD-100', 'Voucher ẩm thực 100.000đ', 'partner', 100_000, 100_000, 'silver', '2026-08-31', 'voucher', 'food'),
  reward('R-TRAVEL-250', 'Combo du lịch cuối tuần', 'tasco', 250_000, 320_000, 'gold', '2026-07-31', 'voucher', 'travel'),
  reward('R-PRIORITY', 'Nâng hạng ưu tiên hỗ trợ', 'tasco', 400_000, null, 'platinum', '2026-12-31', 'service', 'star'),
  reward('R-X2-WEEKEND', 'Nhân đôi điểm cuối tuần', 'toll', 0, null, 'silver', '2026-08-31', 'service', 'x2', true),
];

function reward(id, title, category, points, cashValue, minTier, expiry, fulfillment, image, isNew = false) {
  return {
    id,
    title,
    category,
    points,
    cashValue,
    minTier,
    expiry,
    locations: 'Hệ sinh thái VETC và đối tác liên kết',
    image,
    description: `${title} dành cho hội viên VETC Loyalty.`,
    includes: ['Ưu đãi điện tử phát hành ngay sau khi đổi', 'Theo dõi trong mục Ưu đãi của tôi'],
    terms: ['Không quy đổi thành tiền mặt', 'Áp dụng theo điều kiện chương trình'],
    usage: fulfillment === 'voucher' ? 'Xuất trình mã voucher/QR khi thanh toán.' : 'Ưu đãi được kích hoạt tự động cho tài khoản.',
    refundPolicy: 'Hoàn điểm theo điều kiện của từng đối tác nếu chưa sử dụng.',
    fulfillment,
    isNew,
    addedAt: '2026-07-01',
  };
}

const services = [
  service('S-ETC', 'Quản lý ETC & nạp tài khoản', 'Di chuyển', 'Nạp tiền, xem số dư và lịch sử qua trạm.', 'Miễn phí', true, true, 'road'),
  service('S-TICKET', 'Vé tháng / quý đường bộ', 'Di chuyển', 'Mua vé tháng, vé quý cho tuyến thường xuyên.', 'Từ 880.000đ/tháng', true, true, 'ticket'),
  service('S-INS-TNDS', 'Bảo hiểm TNDS bắt buộc', 'Bảo hiểm', 'Mua và gia hạn bảo hiểm trách nhiệm dân sự.', 'Từ 480.700đ/năm', true, true, 'shield'),
  service('S-INS-BODY', 'Bảo hiểm vật chất xe', 'Bảo hiểm', 'Bảo vệ toàn diện thân vỏ, thuỷ kích, mất cắp.', 'Báo giá theo xe', false, true, 'shield2'),
  service('S-RSA', 'Cứu hộ giao thông 24/7', 'An toàn', 'Cứu hộ toàn quốc: kéo xe, kích bình, vá lốp.', '1.200.000đ/năm', true, true, 'tow'),
  service('S-RESCUE', 'Cứu hộ khẩn cấp', 'An toàn', 'Gọi cứu hộ ngay khi gặp sự cố.', 'Theo sự cố', true, false, 'sos'),
  service('S-MAINT', 'Đặt lịch bảo dưỡng', 'Chăm sóc xe', 'Đặt lịch bảo dưỡng tại Tasco Auto.', 'Từ 1.500.000đ', true, true, 'wrench'),
  service('S-WASH', 'Rửa xe & chăm sóc xe', 'Chăm sóc xe', 'Đặt lịch rửa xe và vệ sinh nội thất.', 'Từ 80.000đ', true, false, 'wash'),
  service('S-PARK', 'Bãi đỗ thông minh', 'Di chuyển', 'Tìm và thanh toán bãi đỗ qua eTag.', 'Theo bãi đỗ', true, true, 'parking'),
  service('S-EV', 'Sạc xe điện', 'Xe điện', 'Tìm trạm sạc đối tác, thanh toán qua VETC.', 'Theo kWh', true, true, 'ev'),
  service('S-CAR', 'Mua xe mới & xe đã qua sử dụng', 'Tasco', 'Ưu đãi hội viên tại Tasco Auto.', 'Liên hệ', false, true, 'car'),
  service('S-PARTS', 'Phụ kiện & phụ tùng', 'Tasco', 'Phụ kiện chính hãng, lắp đặt tại trung tâm.', 'Theo sản phẩm', true, false, 'parts'),
];

function service(id, name, category, description, price, payWithPoints, countsTowardTier, image) {
  return {
    id,
    name,
    category,
    description,
    price,
    pointsEarned: payWithPoints ? '+1 điểm / 1.000đ' : 'Ưu đãi riêng theo hạng',
    payWithPoints,
    countsTowardTier,
    availableFor: 'Tất cả xe đủ điều kiện',
    image,
    status: id === 'S-ETC' ? 'active' : 'available',
  };
}

const campaigns = [
  { id: 'C001', name: 'Summer Travel Challenge', startDate: '2026-06-01', endDate: '2026-07-31' },
  { id: 'C002', name: 'Road Safety Month', startDate: '2026-07-01', endDate: '2026-07-31' },
  { id: 'C003', name: 'Wallet Cashback Weekend', startDate: '2026-06-01', endDate: '2026-08-31' },
  { id: 'C004', name: 'EV Week', startDate: '2026-07-10', endDate: '2026-07-17' },
  { id: 'C005', name: 'Referral Sprint', startDate: '2026-06-15', endDate: '2026-07-15' },
  { id: 'C006', name: 'Service Discovery Month', startDate: '2026-08-01', endDate: '2026-08-31' },
];

const missions = [
  mission('M-SUMMER-TRIP', 'Summer Travel Challenge', 'Chiến dịch', 'C001', 2, 3, 120, 2000, '2026-07-31', 'travel'),
  mission('M-ROAD-SAFETY', 'Bảo vệ Mazda CX-5', 'An toàn', 'C002', 1, 2, 90, 1200, '2026-08-09', 'shield'),
  mission('M-EV-WEEK', 'EV Week: thử trạm sạc mới', 'EV', 'C004', 0, 1, 80, 1000, '2026-07-17', 'ev'),
];

function mission(id, title, category, campaign, progress, target, xp, loyaltyPoints, deadline, image) {
  return {
    id,
    title,
    description: `${title} giúp tăng tương tác trong hệ sinh thái VETC.`,
    category,
    campaign,
    progress,
    target,
    xp,
    loyaltyPoints,
    deadline,
    vehicle: null,
    aiReason: 'Gợi ý dựa trên hồ sơ, phương tiện, lịch sử dịch vụ và chiến dịch hiện hành.',
    nextAction: 'Tiếp tục nhiệm vụ',
    status: 'active',
    image,
  };
}

const activity = [
  activityItem('T-1024', 'earn', 'Qua trạm Long Phước — cao tốc HCM - Long Thành', '2026-07-10T16:42:00', '51K-123.45', 'VETC', 33, 33_000),
  activityItem('T-1023', 'bonus', 'Thưởng chiến dịch Nhân đôi điểm cuối tuần', '2026-07-05T09:12:00', '51K-123.45', 'VETC', 58, null),
  activityItem('T-1022', 'toll-points', 'Thanh toán phí đường bộ bằng điểm', '2026-07-04T08:21:00', '51K-123.45', 'Trạm Cầu Giẽ - Ninh Bình', -35_000, 0),
  activityItem('T-1021', 'earn', 'Nạp tài khoản giao thông', '2026-07-02T20:05:00', null, 'Vietcombank', 500, 500_000),
];

function activityItem(id, kind, title, datetime, vehicle, partner, points, cash) {
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
    detail: 'Giao dịch được xử lý bởi mock backend VETC Loyalty.',
  };
}

const redemptions = [];
const payments = new Map();
const sessions = new Map();
const processedKeys = new Map();

const tierRank = { silver: 0, gold: 1, platinum: 2, diamond: 3 };

function json(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, IdempotencyKey, X-Trace-ID, X-Request-ID',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

function requireSession(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !sessions.has(token)) return null;
  return sessions.get(token);
}

function bootstrap() {
  return {
    user,
    vehicles,
    rewards,
    services,
    campaigns,
    missions,
    activity,
    redemptions,
    loyalty: {
      pointsBalance: user.pointsBalance,
      cashBalance: user.cashBalance,
      tier: user.tier,
      eligibleSpending: user.eligibleSpending,
      expiringPoints: user.expiringPoints,
    },
  };
}

function appendActivity(item) {
  activity.unshift(item);
}

function idempotent(req, handler) {
  const key = req.headers.idempotencykey;
  if (key && processedKeys.has(key)) return processedKeys.get(key);
  const result = handler();
  if (key) processedKeys.set(key, result);
  return result;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const method = req.method ?? 'GET';

  if (method === 'OPTIONS') return json(res, 204, {});
  if (!url.pathname.startsWith('/api/')) return json(res, 404, { code: 'NOT_FOUND', message: 'Unknown route' });

  try {
    if (method === 'POST' && url.pathname === '/api/auth/token') {
      const body = await readBody(req);
      if (body.grant_type !== 'client_credentials') {
        return json(res, 400, { error: 'unsupported_grant_type' });
      }
      return json(res, 200, {
        access_token: `mock-backend-${randomUUID()}`,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile',
      });
    }

    if (method === 'POST' && url.pathname === '/api/auth/exchange') {
      const body = await readBody(req);
      if (!body.authCode) return json(res, 422, { code: 'INVALID_AUTH_CODE', message: 'Auth Code không đúng' });
      const accessToken = `mock-user-${randomUUID()}`;
      sessions.set(accessToken, { userId: user.id, createdAt: new Date().toISOString() });
      return json(res, 200, {
        access_token: accessToken,
        refresh_token: `mock-refresh-${randomUUID()}`,
        id_token: `mock-id-${randomUUID()}`,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email',
      });
    }

    if (url.pathname !== '/api/health' && url.pathname !== '/api/auth/token' && url.pathname !== '/api/auth/exchange') {
      const session = requireSession(req);
      if (!session) return json(res, 401, { code: 'UNAUTHORIZED', message: 'Access token không hợp lệ' });
    }

    if (method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true });
    if (method === 'GET' && url.pathname === '/api/bootstrap') return json(res, 200, { code: '00', data: bootstrap() });
    if (method === 'GET' && url.pathname === '/api/user') return json(res, 200, { code: '00', data: user });
    if (method === 'GET' && url.pathname === '/api/loyalty') return json(res, 200, { code: '00', data: bootstrap().loyalty });
    if (method === 'GET' && url.pathname === '/api/activity') return json(res, 200, { code: '00', data: activity });
    if (method === 'GET' && url.pathname === '/api/rewards') return json(res, 200, { code: '00', data: rewards });
    if (method === 'GET' && url.pathname === '/api/redemptions') return json(res, 200, { code: '00', data: redemptions });
    if (method === 'GET' && url.pathname === '/api/services') return json(res, 200, { code: '00', data: services });
    if (method === 'GET' && url.pathname === '/api/campaigns') return json(res, 200, { code: '00', data: campaigns });

    if (method === 'POST' && url.pathname === '/api/rewards/redeem') {
      const body = await readBody(req);
      const result = idempotent(req, () => {
        const selected = rewards.find((r) => r.id === body.rewardId);
        if (!selected) return { status: 404, body: { code: 'REWARD_NOT_FOUND', message: 'Reward not found' } };
        if (tierRank[selected.minTier] > tierRank[user.tier]) return { status: 403, body: { code: 'TIER_NOT_ELIGIBLE', message: 'Hạng hội viên chưa đủ điều kiện' } };
        if (selected.points > user.pointsBalance) return { status: 422, body: { code: 'INSUFFICIENT_POINTS', message: 'Không đủ điểm đổi ưu đãi' } };

        user.pointsBalance -= selected.points;
        const redemption = {
          id: `RD-${Date.now()}-${randomUUID().slice(0, 8)}`,
          rewardId: selected.id,
          title: selected.title,
          code: `VETC${randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase()}`,
          redeemedAt: new Date().toISOString(),
          expiry: selected.expiry,
          fulfillment: selected.fulfillment,
          vehicleId: body.vehicleId ?? null,
          status: 'active',
        };
        redemptions.unshift(redemption);
        appendActivity({
          id: redemption.id,
          kind: 'redeem',
          title: `Đổi ${selected.title}`,
          datetime: redemption.redeemedAt,
          vehicle: vehicles.find((v) => v.id === body.vehicleId)?.plate ?? null,
          partner: 'VETC Loyalty',
          points: -selected.points,
          cash: null,
          status: 'success',
          detail: selected.fulfillment === 'voucher' ? 'Voucher đã phát hành.' : 'Ưu đãi đã được kích hoạt.',
        });
        return { status: 201, body: { code: '00', data: { redemption, loyalty: bootstrap().loyalty, activity } } };
      });
      return json(res, result.status, result.body);
    }

    if (method === 'POST' && url.pathname.startsWith('/api/services/') && url.pathname.endsWith('/activate')) {
      const serviceId = url.pathname.split('/')[3];
      const svc = services.find((s) => s.id === serviceId);
      if (!svc) return json(res, 404, { code: 'SERVICE_NOT_FOUND', message: 'Service not found' });
      svc.status = 'active';
      appendActivity({
        id: `SV-${Date.now()}`,
        kind: 'service',
        title: `Kích hoạt dịch vụ: ${svc.name}`,
        datetime: new Date().toISOString(),
        vehicle: null,
        partner: 'VETC',
        points: 0,
        cash: null,
        status: 'success',
        detail: 'Dịch vụ đã được kích hoạt từ backend.',
      });
      return json(res, 200, { code: '00', data: { service: svc, activity } });
    }

    if (method === 'POST' && url.pathname === '/api/missions/complete') {
      const body = await readBody(req);
      const selected = missions.find((m) => m.id === body.missionId);
      if (!selected) return json(res, 404, { code: 'MISSION_NOT_FOUND', message: 'Mission not found' });
      selected.progress = selected.target;
      selected.status = 'completed';
      user.pointsBalance += selected.loyaltyPoints;
      appendActivity({
        id: `MS-${Date.now()}`,
        kind: 'bonus',
        title: `Hoàn thành nhiệm vụ: ${selected.title}`,
        datetime: new Date().toISOString(),
        vehicle: selected.vehicle,
        partner: 'VETC Loyalty',
        points: selected.loyaltyPoints,
        cash: null,
        status: 'success',
        detail: `Nhận ${selected.xp} XP và ${selected.loyaltyPoints.toLocaleString('vi-VN')} điểm Loyalty.`,
      });
      return json(res, 200, { code: '00', data: { mission: selected, loyalty: bootstrap().loyalty, activity, missions } });
    }

    if (method === 'POST' && url.pathname === '/api/payments') {
      const body = await readBody(req);
      const payment = {
        id: `pay_${randomUUID().slice(0, 12)}`,
        merchant_id: body.terminal_id ?? 'com.vetc.loyalty',
        terminal_id: body.terminal_id ?? 'com.vetc.loyalty',
        order_id: body.order_id ?? randomUUID(),
        amount: Number(body.amount ?? 0),
        status: 'CREATED',
        description: body.description ?? '',
        metadata: body.metadata ?? {},
        provider_payload: {
          mid: body.terminal_id ?? 'com.vetc.loyalty',
          mc_order_id: body.order_id ?? randomUUID(),
          request_date: new Date().toISOString(),
          merchant_service: body.metadata?.merchant_service ?? 'VETC Loyalty',
          service_name: body.metadata?.service_name ?? 'VETC',
          product_code: body.metadata?.product_code ?? 'VETC_PRODUCT',
          product_name: body.metadata?.product_name ?? 'VETC Product',
          provider_name: body.metadata?.provider_name ?? 'VETC',
          signature: `mock-signature-${randomUUID()}`,
          hmac: 'MOCK_HMAC_PAYLOAD',
        },
        transactions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      payments.set(payment.id, payment);
      return json(res, 201, { code: '00', message: 'Success', data: payment });
    }

    if (method === 'GET' && url.pathname.startsWith('/api/payments/')) {
      const paymentId = url.pathname.split('/')[3];
      const payment = payments.get(paymentId);
      if (!payment) return json(res, 404, { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' });
      return json(res, 200, { code: '00', data: payment });
    }

    if (method === 'POST' && url.pathname.startsWith('/api/payments/') && url.pathname.endsWith('/refund')) {
      const paymentId = url.pathname.split('/')[3];
      const payment = payments.get(paymentId);
      if (!payment) return json(res, 404, { code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' });
      const body = await readBody(req);
      const refund = {
        id: `rf_${randomUUID().slice(0, 12)}`,
        type: 'REFUND',
        amount: Number(body.amount ?? 0),
        status: 'CREATED',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      payment.transactions.push(refund);
      payment.updated_at = new Date().toISOString();
      return json(res, 200, { code: '00', data: payment });
    }

    if (method === 'POST' && url.pathname === '/api/ipn') {
      const body = await readBody(req);
      return json(res, 200, { code: '00', received: body.type ?? 'unknown' });
    }

    return json(res, 404, { code: 'NOT_FOUND', message: 'Unknown route' });
  } catch (error) {
    return json(res, 500, { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`VETC mock backend listening on http://127.0.0.1:${PORT}`);
});
