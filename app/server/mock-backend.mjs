import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createMockDb } from './mock-db.mjs';
import { createPersistentStore } from './persistent-store.mjs';
import { rankMissionsWithOpenAI } from './openai-personalizer.mjs';
import { ACTIVITY_SIGNAL_RULES, MISSION_TEMPLATE_LIBRARY, SCORING_FACTORS } from './personalization-spec.mjs';

const PORT = Number(process.env.PORT ?? 5174);
const TODAY = '2026-07-11';
const PERSONALIZATION_MODE = process.env.PERSONALIZATION_MODE ?? (process.env.OPENAI_API_KEY ? 'openai' : 'rules');
const OPENAI_FALLBACK_MODE = process.env.OPENAI_FALLBACK_MODE ?? 'rules';
const ACTIVE_PROFILE_ID = process.env.ACTIVE_PROFILE_ID ?? 'U005';
const PERSISTENCE_DB_PATH = process.env.PERSISTENCE_DB_PATH ?? fileURLToPath(new URL('./data/mock-personalization.db', import.meta.url));
const PERSISTENCE_LEGACY_PATH = process.env.PERSISTENCE_LEGACY_PATH ?? fileURLToPath(new URL('./data/mock-personalization-db.json', import.meta.url));

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

const demoProfiles = [
  { id: 'U001', name: 'Nguyễn Minh Anh', city: 'Hà Nội', ageGroup: '25-34', vehicleType: 'Sedan', vehicleAgeYears: 2, segment: 'Daily Commuter', etcUsage: 'Hằng ngày', walletUsage: 'Cao', roadsideEnabled: false, insuranceStatus: 'Yes', parkingUsage: 'Trung bình', chargingUsage: 'Không', loyaltyPoints: 850, engagementScore: 82, lastActiveDays: 1, preferredChannel: 'Push', interests: ['Tiết kiệm thời gian', 'ưu đãi ví'] },
  { id: 'U002', name: 'Trần Quốc Huy', city: 'TP.HCM', ageGroup: '35-44', vehicleType: 'SUV', vehicleAgeYears: 8, segment: 'Family Driver', etcUsage: '4-5 lần/tuần', walletUsage: 'Trung bình', roadsideEnabled: false, insuranceStatus: 'Expiring soon', parkingUsage: 'Thấp', chargingUsage: 'Không', loyaltyPoints: 420, engagementScore: 40, lastActiveDays: 17, preferredChannel: 'Push', interests: ['Du lịch cuối tuần', 'bảo hiểm', 'gia đình'] },
  { id: 'U003', name: 'Lê Thu Trang', city: 'Đà Nẵng', ageGroup: '25-34', vehicleType: 'Hatchback', vehicleAgeYears: 5, segment: 'Inactive User', etcUsage: 'Thấp', walletUsage: 'Thấp', roadsideEnabled: false, insuranceStatus: 'No', parkingUsage: 'Không', chargingUsage: 'Không', loyaltyPoints: 210, engagementScore: 25, lastActiveDays: 32, preferredChannel: 'Zalo', interests: ['Du lịch', 'ưu đãi'] },
  { id: 'U004', name: 'Phạm Hoàng Nam', city: 'Hải Phòng', ageGroup: '45-54', vehicleType: 'SUV', vehicleAgeYears: 6, segment: 'Business Traveler', etcUsage: 'Hằng ngày', walletUsage: 'Cao', roadsideEnabled: true, insuranceStatus: 'Yes', parkingUsage: 'Cao', chargingUsage: 'Không', loyaltyPoints: 2650, engagementScore: 88, lastActiveDays: 0, preferredChannel: 'Email', interests: ['Công tác', 'bãi đỗ xe', 'hóa đơn'] },
  { id: 'U005', name: 'Vũ Mai Linh', city: 'Hà Nội', ageGroup: '18-24', vehicleType: 'Compact Car', vehicleAgeYears: 1, segment: 'New User', etcUsage: 'Mới đăng ký', walletUsage: 'Thấp', roadsideEnabled: false, insuranceStatus: 'Yes', parkingUsage: 'Không', chargingUsage: 'Không', loyaltyPoints: 120, engagementScore: 35, lastActiveDays: 2, preferredChannel: 'Push', interests: ['Hướng dẫn sử dụng', 'nhắc giấy tờ'] },
  { id: 'U006', name: 'Đỗ Văn Khoa', city: 'TP.HCM', ageGroup: '35-44', vehicleType: 'Sedan', vehicleAgeYears: 9, segment: 'Service Explorer', etcUsage: '3-4 lần/tuần', walletUsage: 'Trung bình', roadsideEnabled: false, insuranceStatus: 'Expiring soon', parkingUsage: 'Trung bình', chargingUsage: 'Không', loyaltyPoints: 1120, engagementScore: 61, lastActiveDays: 6, preferredChannel: 'Push', interests: ['Bảo dưỡng', 'cứu hộ', 'đối tác'] },
  { id: 'U007', name: 'Bùi Ngọc Hà', city: 'Nha Trang', ageGroup: '25-34', vehicleType: 'SUV', vehicleAgeYears: 3, segment: 'Weekend Traveler', etcUsage: 'Cuối tuần', walletUsage: 'Trung bình', roadsideEnabled: true, insuranceStatus: 'Yes', parkingUsage: 'Thấp', chargingUsage: 'Không', loyaltyPoints: 980, engagementScore: 65, lastActiveDays: 3, preferredChannel: 'Push', interests: ['Du lịch biển', 'gia đình'] },
  { id: 'U008', name: 'Ngô Đức Long', city: 'Hà Nội', ageGroup: '45-54', vehicleType: 'MPV', vehicleAgeYears: 7, segment: 'High Loyalty User', etcUsage: 'Hằng ngày', walletUsage: 'Cao', roadsideEnabled: true, insuranceStatus: 'Yes', parkingUsage: 'Cao', chargingUsage: 'Không', loyaltyPoints: 5200, engagementScore: 90, lastActiveDays: 0, preferredChannel: 'Email', interests: ['Loyalty', 'premium', 'referral'] },
  { id: 'U009', name: 'Đặng Thảo Vy', city: 'Đà Lạt', ageGroup: '25-34', vehicleType: 'SUV', vehicleAgeYears: 4, segment: 'Low Engagement User', etcUsage: '2-3 lần/tháng', walletUsage: 'Thấp', roadsideEnabled: false, insuranceStatus: 'Yes', parkingUsage: 'Không', chargingUsage: 'Không', loyaltyPoints: 740, engagementScore: 31, lastActiveDays: 24, preferredChannel: 'Push', interests: ['Cafe', 'du lịch cuối tuần'] },
  { id: 'U010', name: 'Hoàng Gia Bảo', city: 'TP.HCM', ageGroup: '35-44', vehicleType: 'EV', vehicleAgeYears: 1, segment: 'EV Owner', etcUsage: '3-4 lần/tuần', walletUsage: 'Cao', roadsideEnabled: true, insuranceStatus: 'Yes', parkingUsage: 'Trung bình', chargingUsage: 'Cao', loyaltyPoints: 2400, engagementScore: 85, lastActiveDays: 1, preferredChannel: 'Push', interests: ['Sạc xe', 'công nghệ', 'ưu đãi EV'] },
  { id: 'U011', name: 'Mai Anh Tuấn', city: 'Hà Nội', ageGroup: '35-44', vehicleType: 'Sedan', vehicleAgeYears: 10, segment: 'Roadside Candidate', etcUsage: 'Hằng ngày', walletUsage: 'Trung bình', roadsideEnabled: false, insuranceStatus: 'Yes', parkingUsage: 'Trung bình', chargingUsage: 'Không', loyaltyPoints: 1450, engagementScore: 70, lastActiveDays: 2, preferredChannel: 'Push', interests: ['An toàn', 'cứu hộ'] },
  { id: 'U012', name: 'Phan Thùy Dương', city: 'TP.HCM', ageGroup: '25-34', vehicleType: 'Sedan', vehicleAgeYears: 3, segment: 'Wallet User', etcUsage: '2-3 lần/tuần', walletUsage: 'Cao', roadsideEnabled: false, insuranceStatus: 'Yes', parkingUsage: 'Thấp', chargingUsage: 'Không', loyaltyPoints: 980, engagementScore: 56, lastActiveDays: 9, preferredChannel: 'Push', interests: ['Hoàn tiền', 'voucher'] },
  { id: 'U013', name: 'Lê Hoàng Phúc', city: 'Đà Nẵng', ageGroup: '35-44', vehicleType: 'Pickup', vehicleAgeYears: 6, segment: 'Business Traveler', etcUsage: 'Hằng ngày', walletUsage: 'Cao', roadsideEnabled: true, insuranceStatus: 'Yes', parkingUsage: 'Trung bình', chargingUsage: 'Không', loyaltyPoints: 3100, engagementScore: 78, lastActiveDays: 4, preferredChannel: 'Email', interests: ['Công tác xa', 'bảo dưỡng'] },
  { id: 'U014', name: 'Trịnh Bảo Châu', city: 'Hà Nội', ageGroup: '25-34', vehicleType: 'Motorbike', vehicleAgeYears: 2, segment: 'Light User', etcUsage: 'Thấp', walletUsage: 'Thấp', roadsideEnabled: false, insuranceStatus: 'No', parkingUsage: 'Không', chargingUsage: 'Không', loyaltyPoints: 180, engagementScore: 28, lastActiveDays: 21, preferredChannel: 'Zalo', interests: ['Ưu đãi nhỏ', 'onboarding'] },
  { id: 'U015', name: 'Đinh Quốc Việt', city: 'TP.HCM', ageGroup: '45-54', vehicleType: 'SUV', vehicleAgeYears: 5, segment: 'Family Driver', etcUsage: '4-5 lần/tuần', walletUsage: 'Trung bình', roadsideEnabled: false, insuranceStatus: 'Expiring soon', parkingUsage: 'Thấp', chargingUsage: 'Không', loyaltyPoints: 860, engagementScore: 52, lastActiveDays: 12, preferredChannel: 'SMS', interests: ['Gia đình', 'bảo hiểm'] },
  { id: 'U016', name: 'Nguyễn Khánh Linh', city: 'Hải Phòng', ageGroup: '25-34', vehicleType: 'EV', vehicleAgeYears: 2, segment: 'EV Owner', etcUsage: 'Hằng ngày', walletUsage: 'Cao', roadsideEnabled: true, insuranceStatus: 'Yes', parkingUsage: 'Trung bình', chargingUsage: 'Cao', loyaltyPoints: 2750, engagementScore: 92, lastActiveDays: 0, preferredChannel: 'Push', interests: ['EV', 'sạc xe', 'gamification'] },
  { id: 'U017', name: 'Võ Minh Quân', city: 'Đà Nẵng', ageGroup: '18-24', vehicleType: 'Sedan', vehicleAgeYears: 1, segment: 'New User', etcUsage: 'Mới đăng ký', walletUsage: 'Thấp', roadsideEnabled: false, insuranceStatus: 'No', parkingUsage: 'Không', chargingUsage: 'Không', loyaltyPoints: 60, engagementScore: 22, lastActiveDays: 3, preferredChannel: 'Push', interests: ['Hướng dẫn', 'khám phá dịch vụ'] },
  { id: 'U018', name: 'Tạ Ngọc Sơn', city: 'Hà Nội', ageGroup: '35-44', vehicleType: 'Sedan', vehicleAgeYears: 4, segment: 'Parking User', etcUsage: 'Hằng ngày', walletUsage: 'Trung bình', roadsideEnabled: true, insuranceStatus: 'Yes', parkingUsage: 'Cao', chargingUsage: 'Không', loyaltyPoints: 1680, engagementScore: 74, lastActiveDays: 1, preferredChannel: 'Push', interests: ['Bãi đỗ xe', 'công sở'] },
  { id: 'U019', name: 'Lâm Hương Giang', city: 'TP.HCM', ageGroup: '25-34', vehicleType: 'SUV', vehicleAgeYears: 6, segment: 'Inactive High Value', etcUsage: '3-4 lần/tuần', walletUsage: 'Cao', roadsideEnabled: true, insuranceStatus: 'Yes', parkingUsage: 'Trung bình', chargingUsage: 'Không', loyaltyPoints: 4200, engagementScore: 45, lastActiveDays: 28, preferredChannel: 'Email', interests: ['Loyalty', 'du lịch'] },
  { id: 'U020', name: 'Hồ Đức Anh', city: 'Nha Trang', ageGroup: '35-44', vehicleType: 'Sedan', vehicleAgeYears: 8, segment: 'Insurance Candidate', etcUsage: '3-4 lần/tuần', walletUsage: 'Trung bình', roadsideEnabled: false, insuranceStatus: 'Expiring soon', parkingUsage: 'Không', chargingUsage: 'Không', loyaltyPoints: 1020, engagementScore: 58, lastActiveDays: 8, preferredChannel: 'Push', interests: ['Bảo hiểm', 'nhắc hạn'] },
  { id: 'U021', name: 'Nguyễn Tường Vy', city: 'Hà Nội', ageGroup: '25-34', vehicleType: 'Compact Car', vehicleAgeYears: 2, segment: 'Referral Candidate', etcUsage: '4-5 lần/tuần', walletUsage: 'Cao', roadsideEnabled: false, insuranceStatus: 'Yes', parkingUsage: 'Trung bình', chargingUsage: 'Không', loyaltyPoints: 1980, engagementScore: 80, lastActiveDays: 1, preferredChannel: 'Push', interests: ['Ưu đãi', 'giới thiệu bạn bè'] },
  { id: 'U022', name: 'Bùi Thanh Tùng', city: 'TP.HCM', ageGroup: '45-54', vehicleType: 'SUV', vehicleAgeYears: 11, segment: 'Safety Focused', etcUsage: 'Hằng ngày', walletUsage: 'Cao', roadsideEnabled: false, insuranceStatus: 'Yes', parkingUsage: 'Cao', chargingUsage: 'Không', loyaltyPoints: 2350, engagementScore: 67, lastActiveDays: 5, preferredChannel: 'SMS', interests: ['An toàn', 'cứu hộ', 'bảo dưỡng'] },
  { id: 'U023', name: 'Cao Minh Nhật', city: 'Đà Lạt', ageGroup: '25-34', vehicleType: 'Sedan', vehicleAgeYears: 3, segment: 'Explorer', etcUsage: '2-3 lần/tháng', walletUsage: 'Trung bình', roadsideEnabled: false, insuranceStatus: 'Yes', parkingUsage: 'Thấp', chargingUsage: 'Không', loyaltyPoints: 690, engagementScore: 49, lastActiveDays: 15, preferredChannel: 'Push', interests: ['Khám phá dịch vụ', 'du lịch'] },
  { id: 'U024', name: 'Đỗ Hải Yến', city: 'Hà Nội', ageGroup: '35-44', vehicleType: 'MPV', vehicleAgeYears: 5, segment: 'Family Driver', etcUsage: 'Cuối tuần', walletUsage: 'Trung bình', roadsideEnabled: true, insuranceStatus: 'Yes', parkingUsage: 'Trung bình', chargingUsage: 'Không', loyaltyPoints: 1750, engagementScore: 72, lastActiveDays: 2, preferredChannel: 'Push', interests: ['Gia đình', 'cuối tuần'] },
  { id: 'U025', name: 'Trần Minh Khang', city: 'TP.HCM', ageGroup: '25-34', vehicleType: 'EV', vehicleAgeYears: 1, segment: 'EV New User', etcUsage: '2-3 lần/tuần', walletUsage: 'Trung bình', roadsideEnabled: false, insuranceStatus: 'Yes', parkingUsage: 'Thấp', chargingUsage: 'Trung bình', loyaltyPoints: 640, engagementScore: 54, lastActiveDays: 7, preferredChannel: 'Push', interests: ['Sạc xe', 'onboarding EV'] },
];

const profileActivity = {
  U001: { activityCount: 4, lastActivityDate: '2026-06-26', totalPoints: 45, walletTopups: 1, referralShares: 0, logins: 1, etcTrips: 0, parkingPayments: 0, carWashBookings: 0, evCharges: 0, insuranceViews: 0, roadsideViews: 1, rewardRedemptions: 1 },
  U002: { activityCount: 6, lastActivityDate: '2026-06-29', totalPoints: 105, walletTopups: 1, referralShares: 0, logins: 0, etcTrips: 1, parkingPayments: 1, carWashBookings: 1, evCharges: 0, insuranceViews: 1, roadsideViews: 1, rewardRedemptions: 0 },
  U003: { activityCount: 10, lastActivityDate: '2026-06-28', totalPoints: 220, walletTopups: 3, referralShares: 1, logins: 0, etcTrips: 0, parkingPayments: 3, carWashBookings: 0, evCharges: 1, insuranceViews: 2, roadsideViews: 0, rewardRedemptions: 0 },
  U004: { activityCount: 6, lastActivityDate: '2026-06-29', totalPoints: 100, walletTopups: 1, referralShares: 1, logins: 1, etcTrips: 0, parkingPayments: 1, carWashBookings: 1, evCharges: 0, insuranceViews: 0, roadsideViews: 1, rewardRedemptions: 0 },
  U005: { activityCount: 5, lastActivityDate: '2026-06-29', totalPoints: 115, walletTopups: 0, referralShares: 2, logins: 0, etcTrips: 0, parkingPayments: 0, carWashBookings: 0, evCharges: 1, insuranceViews: 2, roadsideViews: 0, rewardRedemptions: 0 },
  U006: { activityCount: 2, lastActivityDate: '2026-06-17', totalPoints: 55, walletTopups: 1, referralShares: 0, logins: 0, etcTrips: 0, parkingPayments: 0, carWashBookings: 0, evCharges: 1, insuranceViews: 0, roadsideViews: 0, rewardRedemptions: 0 },
  U007: { activityCount: 3, lastActivityDate: '2026-06-09', totalPoints: 25, walletTopups: 0, referralShares: 0, logins: 1, etcTrips: 0, parkingPayments: 0, carWashBookings: 0, evCharges: 0, insuranceViews: 1, roadsideViews: 1, rewardRedemptions: 0 },
  U008: { activityCount: 3, lastActivityDate: '2026-06-24', totalPoints: 60, walletTopups: 0, referralShares: 0, logins: 0, etcTrips: 1, parkingPayments: 1, carWashBookings: 0, evCharges: 1, insuranceViews: 0, roadsideViews: 0, rewardRedemptions: 0 },
  U009: { activityCount: 5, lastActivityDate: '2026-06-23', totalPoints: 65, walletTopups: 0, referralShares: 1, logins: 1, etcTrips: 1, parkingPayments: 0, carWashBookings: 1, evCharges: 0, insuranceViews: 0, roadsideViews: 0, rewardRedemptions: 1 },
  U010: { activityCount: 4, lastActivityDate: '2026-06-29', totalPoints: 105, walletTopups: 0, referralShares: 1, logins: 0, etcTrips: 0, parkingPayments: 1, carWashBookings: 0, evCharges: 2, insuranceViews: 0, roadsideViews: 0, rewardRedemptions: 0 },
  U011: { activityCount: 4, lastActivityDate: '2026-06-24', totalPoints: 80, walletTopups: 1, referralShares: 0, logins: 0, etcTrips: 1, parkingPayments: 0, carWashBookings: 0, evCharges: 1, insuranceViews: 0, roadsideViews: 1, rewardRedemptions: 0 },
  U012: { activityCount: 2, lastActivityDate: '2026-06-18', totalPoints: 35, walletTopups: 0, referralShares: 0, logins: 0, etcTrips: 1, parkingPayments: 0, carWashBookings: 0, evCharges: 1, insuranceViews: 0, roadsideViews: 0, rewardRedemptions: 0 },
  U013: { activityCount: 2, lastActivityDate: '2026-06-06', totalPoints: 35, walletTopups: 0, referralShares: 0, logins: 0, etcTrips: 0, parkingPayments: 0, carWashBookings: 0, evCharges: 1, insuranceViews: 0, roadsideViews: 0, rewardRedemptions: 1 },
  U014: { activityCount: 4, lastActivityDate: '2026-06-22', totalPoints: 65, walletTopups: 0, referralShares: 1, logins: 1, etcTrips: 1, parkingPayments: 0, carWashBookings: 0, evCharges: 0, insuranceViews: 1, roadsideViews: 0, rewardRedemptions: 0 },
  U015: { activityCount: 9, lastActivityDate: '2026-06-24', totalPoints: 125, walletTopups: 0, referralShares: 1, logins: 2, etcTrips: 0, parkingPayments: 1, carWashBookings: 1, evCharges: 0, insuranceViews: 0, roadsideViews: 3, rewardRedemptions: 1 },
  U016: { activityCount: 6, lastActivityDate: '2026-06-26', totalPoints: 115, walletTopups: 1, referralShares: 1, logins: 0, etcTrips: 1, parkingPayments: 0, carWashBookings: 1, evCharges: 0, insuranceViews: 1, roadsideViews: 1, rewardRedemptions: 0 },
  U017: { activityCount: 8, lastActivityDate: '2026-06-29', totalPoints: 145, walletTopups: 2, referralShares: 1, logins: 1, etcTrips: 0, parkingPayments: 1, carWashBookings: 1, evCharges: 0, insuranceViews: 0, roadsideViews: 1, rewardRedemptions: 1 },
  U018: { activityCount: 6, lastActivityDate: '2026-06-29', totalPoints: 100, walletTopups: 0, referralShares: 1, logins: 2, etcTrips: 1, parkingPayments: 1, carWashBookings: 0, evCharges: 0, insuranceViews: 1, roadsideViews: 0, rewardRedemptions: 0 },
  U019: { activityCount: 6, lastActivityDate: '2026-06-26', totalPoints: 40, walletTopups: 1, referralShares: 0, logins: 2, etcTrips: 0, parkingPayments: 0, carWashBookings: 0, evCharges: 0, insuranceViews: 1, roadsideViews: 0, rewardRedemptions: 2 },
  U020: { activityCount: 4, lastActivityDate: '2026-06-27', totalPoints: 75, walletTopups: 0, referralShares: 0, logins: 0, etcTrips: 1, parkingPayments: 0, carWashBookings: 3, evCharges: 0, insuranceViews: 0, roadsideViews: 0, rewardRedemptions: 0 },
  U021: { activityCount: 4, lastActivityDate: '2026-06-23', totalPoints: 85, walletTopups: 0, referralShares: 0, logins: 0, etcTrips: 1, parkingPayments: 1, carWashBookings: 1, evCharges: 1, insuranceViews: 0, roadsideViews: 0, rewardRedemptions: 0 },
  U022: { activityCount: 3, lastActivityDate: '2026-06-27', totalPoints: 65, walletTopups: 0, referralShares: 0, logins: 0, etcTrips: 1, parkingPayments: 1, carWashBookings: 1, evCharges: 0, insuranceViews: 0, roadsideViews: 0, rewardRedemptions: 0 },
  U023: { activityCount: 4, lastActivityDate: '2026-06-20', totalPoints: 75, walletTopups: 0, referralShares: 1, logins: 0, etcTrips: 0, parkingPayments: 1, carWashBookings: 0, evCharges: 0, insuranceViews: 1, roadsideViews: 1, rewardRedemptions: 0 },
  U024: { activityCount: 4, lastActivityDate: '2026-06-24', totalPoints: 25, walletTopups: 0, referralShares: 0, logins: 1, etcTrips: 1, parkingPayments: 0, carWashBookings: 0, evCharges: 0, insuranceViews: 1, roadsideViews: 0, rewardRedemptions: 1 },
  U025: { activityCount: 7, lastActivityDate: '2026-06-29', totalPoints: 140, walletTopups: 3, referralShares: 1, logins: 0, etcTrips: 1, parkingPayments: 1, carWashBookings: 0, evCharges: 0, insuranceViews: 0, roadsideViews: 1, rewardRedemptions: 0 },
};

const payments = new Map();
const sessions = new Map();
const processedKeys = new Map();

const tierRank = { silver: 0, gold: 1, platinum: 2, diamond: 3 };
const DEFAULT_PROFILE_ID = ACTIVE_PROFILE_ID;

const seedProfiles = Object.fromEntries(
  demoProfiles.map((profile) => [
    profile.id,
    createMockDb({
      profileId: profile.id,
      profiles: demoProfiles,
      profileActivity,
      services,
      rewards,
    }),
  ]),
);

const persistentStore = createPersistentStore({
  filePath: PERSISTENCE_DB_PATH,
  legacyFilePath: PERSISTENCE_LEGACY_PATH,
  seedProfiles,
});

for (const [paymentId, payment] of persistentStore.getPayments()) {
  payments.set(paymentId, payment);
}

for (const [key, result] of persistentStore.getProcessedKeys()) {
  processedKeys.set(key, result);
}

function getDb(profileId = ACTIVE_PROFILE_ID) {
  return persistentStore.getDb(profileId) ?? persistentStore.getDb(ACTIVE_PROFILE_ID) ?? persistentStore.getDb(demoProfiles[0].id);
}

function updateDb(profileId, updater) {
  return persistentStore.updateDb(profileId, updater);
}

function isCampaignActive(campaignId) {
  const campaign = campaigns.find((item) => item.id === campaignId);
  if (!campaign) return false;
  return campaign.startDate <= TODAY && TODAY <= campaign.endDate;
}

function missionState(profileId, missionId) {
  return getDb(profileId).missionStates.get(missionId) ?? null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function addCandidate(candidates, candidate) {
  const state = missionState(candidate.profileId, candidate.id);
  if (state) {
    candidates.push({ ...candidate, ...state, aiSignals: state.aiSignals ?? candidate.aiSignals });
    return;
  }
  const score = Math.max(10, Math.min(99, candidate.aiScore));
  candidates.push({ ...candidate, aiScore: score });
}

function deriveProfileState(profile, stats) {
  return {
    isNew: profile.segment.includes('New User'),
    isInactive: profile.lastActiveDays >= 20 || profile.segment.includes('Inactive'),
    isDaily: profile.etcUsage === 'Hằng ngày',
    isEV: profile.vehicleType === 'EV' || profile.segment.includes('EV'),
    isFamily: profile.segment.includes('Family') || profile.interests.some((item) => item.includes('gia đình')),
    isBusiness: profile.segment.includes('Business') || profile.interests.some((item) => item.includes('Công tác')),
    isHighLoyalty: profile.loyaltyPoints >= 3000 || profile.segment.includes('High Loyalty'),
    needsInsurance: profile.insuranceStatus === 'Expiring soon' || profile.insuranceStatus === 'No',
    needsRoadside: !profile.roadsideEnabled || profile.vehicleAgeYears >= 8,
    needsParking: profile.parkingUsage === 'Không' || profile.parkingUsage === 'Thấp',
    needsWalletHabit: profile.walletUsage !== 'Cao',
    isReferralFit: profile.segment.includes('Referral') || stats.referralShares > 0 || profile.engagementScore >= 75,
  };
}

function getExplainableSignals(profile, stats, templateId, state) {
  const base = [];
  if (state.isInactive) base.push(`inactive-${profile.lastActiveDays}d`);
  if (state.isNew) base.push('new-user');
  if (state.isEV) base.push(`charging-${profile.chargingUsage.toLowerCase()}`);
  if (state.needsInsurance) base.push(`insurance-${profile.insuranceStatus.toLowerCase().replaceAll(' ', '-')}`);
  if (state.needsRoadside) base.push(`roadside-${profile.roadsideEnabled ? 'on' : 'off'}`);
  if (state.needsParking) base.push('service-gap-parking');
  if (stats.walletTopups > 0) base.push(`wallet-topups-${stats.walletTopups}`);
  if (stats.referralShares > 0) base.push(`referral-shares-${stats.referralShares}`);
  if (stats.evCharges > 0) base.push(`ev-charges-${stats.evCharges}`);
  if (stats.rewardRedemptions > 0) base.push(`reward-redemptions-${stats.rewardRedemptions}`);

  const map = {
    'M-ONBOARDING-7D': [`last-active-${profile.lastActiveDays}d`, `wallet-${profile.walletUsage.toLowerCase()}`],
    'M-COME-BACK': [`engagement-${profile.engagementScore}`, 'quick-win'],
    'M-DAILY-LOOP': [`etc-${profile.etcUsage.toLowerCase()}`, `parking-${profile.parkingUsage.toLowerCase()}`],
    'M-SERVICE-DISCOVERY': [`activity-${stats.activityCount}`, profile.segment.toLowerCase().replaceAll(' ', '-')],
    'M-SAFETY-CHECK': [`vehicle-age-${profile.vehicleAgeYears}`],
    'M-EV-WEEK': ['campaign-ev-week'],
    'M-FAMILY-WEEKEND': ['family-driver'],
    'M-BUSINESS-FLOW': ['business-traveler', `parking-payments-${stats.parkingPayments}`],
    'M-REFERRAL': [`loyalty-${profile.loyaltyPoints}`],
    'M-PROGRESSION': [`loyalty-${profile.loyaltyPoints}`, 'long-term-progression'],
  };

  return [...new Set([...(map[templateId] ?? []), ...base])].slice(0, 5);
}

function scoreMission(templateId, profile, stats, state) {
  const scores = {
    segmentFit: 0,
    activityFit: 0,
    serviceGapFit: 0,
    campaignFit: 0,
    urgencyFit: 0,
    rewardAffinityFit: 0,
    frictionPenalty: 0,
  };

  if (templateId === 'M-ONBOARDING-7D') {
    scores.segmentFit += state.isNew || profile.segment === 'Light User' ? 38 : 0;
    scores.activityFit += Math.max(0, 14 - stats.activityCount * 2);
    scores.serviceGapFit += state.needsWalletHabit ? 12 : 6;
    scores.urgencyFit += Math.max(0, 8 - profile.lastActiveDays);
  } else if (templateId === 'M-COME-BACK') {
    scores.segmentFit += state.isInactive ? 34 : 0;
    scores.urgencyFit += Math.min(24, profile.lastActiveDays);
    scores.activityFit += stats.logins === 0 ? 10 : 4;
    scores.rewardAffinityFit += stats.rewardRedemptions > 0 ? 8 : 4;
  } else if (templateId === 'M-DAILY-LOOP') {
    scores.segmentFit += state.isDaily ? 28 : 18;
    scores.activityFit += Math.min(18, stats.walletTopups * 4 + stats.etcTrips * 6 + stats.parkingPayments * 4);
    scores.serviceGapFit += state.needsWalletHabit ? 8 : 4;
    scores.rewardAffinityFit += stats.rewardRedemptions > 0 ? 4 : 0;
  } else if (templateId === 'M-SERVICE-DISCOVERY') {
    scores.segmentFit += profile.segment.includes('Explorer') ? 24 : 14;
    scores.serviceGapFit += state.needsParking ? 18 : 10;
    scores.activityFit += Math.min(12, stats.insuranceViews * 4 + stats.roadsideViews * 4 + stats.carWashBookings * 2);
    scores.campaignFit += isCampaignActive('C006') ? 8 : 0;
  } else if (templateId === 'M-SAFETY-CHECK') {
    scores.segmentFit += profile.segment.includes('Safety') || profile.segment.includes('Roadside') ? 26 : 18;
    scores.serviceGapFit += (state.needsInsurance ? 12 : 0) + (state.needsRoadside ? 12 : 0);
    scores.urgencyFit += profile.insuranceStatus === 'Expiring soon' ? 14 : profile.insuranceStatus === 'No' ? 12 : 4;
    scores.activityFit += Math.min(10, stats.insuranceViews * 3 + stats.roadsideViews * 4);
  } else if (templateId === 'M-EV-WEEK') {
    scores.segmentFit += state.isEV ? 35 : 0;
    scores.activityFit += Math.min(18, stats.evCharges * 8);
    scores.campaignFit += isCampaignActive('C004') ? 24 : 10;
    scores.rewardAffinityFit += profile.interests.some((item) => item.toLowerCase().includes('ev') || item.toLowerCase().includes('sạc')) ? 10 : 0;
  } else if (templateId === 'M-FAMILY-WEEKEND') {
    scores.segmentFit += state.isFamily ? 28 : 0;
    scores.activityFit += Math.min(16, stats.etcTrips * 6 + stats.parkingPayments * 4);
    scores.campaignFit += isCampaignActive('C001') ? 10 : 4;
    scores.rewardAffinityFit += profile.interests.some((item) => item.toLowerCase().includes('gia đình') || item.toLowerCase().includes('du lịch')) ? 8 : 0;
  } else if (templateId === 'M-BUSINESS-FLOW') {
    scores.segmentFit += state.isBusiness ? 30 : 0;
    scores.activityFit += Math.min(16, stats.parkingPayments * 6 + stats.walletTopups * 5);
    scores.serviceGapFit += state.needsParking ? 10 : 4;
    scores.rewardAffinityFit += profile.interests.some((item) => item.toLowerCase().includes('công tác')) ? 8 : 0;
  } else if (templateId === 'M-REFERRAL') {
    scores.segmentFit += state.isReferralFit ? 24 : 10;
    scores.activityFit += Math.min(16, stats.referralShares * 10);
    scores.rewardAffinityFit += profile.loyaltyPoints >= 1800 ? 12 : 6;
    scores.campaignFit += isCampaignActive('C005') ? 10 : 0;
  } else if (templateId === 'M-PROGRESSION') {
    scores.segmentFit += state.isHighLoyalty ? 34 : 0;
    scores.activityFit += Math.min(16, stats.walletTopups * 2 + stats.parkingPayments * 2 + stats.referralShares * 4 + stats.rewardRedemptions * 4);
    scores.rewardAffinityFit += stats.rewardRedemptions > 0 ? 8 : 4;
    scores.serviceGapFit += stats.activityCount >= 4 ? 8 : 2;
  }

  if (state.isInactive && ['M-PROGRESSION', 'M-SERVICE-DISCOVERY'].includes(templateId)) scores.frictionPenalty += 8;
  if (state.isNew && ['M-PROGRESSION', 'M-REFERRAL'].includes(templateId)) scores.frictionPenalty += 10;
  if (!state.isEV && templateId === 'M-EV-WEEK') scores.frictionPenalty += 99;

  const total = Object.entries(scores).reduce((sum, [key, value]) => sum + (key === 'frictionPenalty' ? -value : value), 0);
  return { total, breakdown: scores };
}

function missionTemplateToCandidate(template, profileId, profile, stats, state) {
  const scored = scoreMission(template.templateId, profile, stats, state);
  const aiSignals = getExplainableSignals(profile, stats, template.templateId, state);
  const common = {
    profileId,
    id: template.templateId,
    category: template.category,
    status: 'active',
    aiSignals,
    aiScore: scored.total,
  };

  switch (template.templateId) {
    case 'M-ONBOARDING-7D':
      return {
        ...common,
        title: 'Khởi động 7 ngày với VETC',
        description: 'Hoàn thiện hồ sơ, liên kết xe, nạp ví và mở 1 dịch vụ đầu tiên để mở chuỗi onboarding.',
        campaign: 'C006',
        progress: stats.logins > 0 ? 1 : 0,
        target: 4,
        xp: 80,
        loyaltyPoints: 900,
        deadline: '2026-07-31',
        vehicle: null,
        aiReason: `${profile.segment} cần một chuỗi nhiệm vụ nhỏ, rõ ràng và có phần thưởng sớm để hoàn thành first-value actions trong tuần đầu.`,
        nextAction: 'Liên kết xe hoặc nạp ví lần đầu',
        scoreBreakdown: scored.breakdown,
        scoringFormula: SCORING_FACTORS.formula,
      };
    case 'M-COME-BACK':
      return {
        ...common,
        title: 'Quay lại 1 phút',
        description: 'Mở app, kiểm tra 1 ưu đãi phù hợp và hoàn thành 1 hành động nhẹ để nhận thưởng quay lại.',
        campaign: 'C003',
        progress: Math.min(stats.logins, 1),
        target: 2,
        xp: 70,
        loyaltyPoints: 700,
        deadline: '2026-07-20',
        vehicle: null,
        aiReason: `Người dùng đã vắng ${profile.lastActiveDays} ngày. AI ưu tiên nhiệm vụ ma sát thấp với phần thưởng nhanh để kéo họ quay lại trước khi đề xuất nhiệm vụ dài hơn.`,
        nextAction: 'Mở app và xem ưu đãi đầu tiên',
        scoreBreakdown: scored.breakdown,
        scoringFormula: SCORING_FACTORS.formula,
      };
    case 'M-DAILY-LOOP':
      return {
        ...common,
        title: 'Chuỗi quay lại hằng tuần',
        description: 'Duy trì 3 ngày trong tuần có giao dịch ETC, nạp ví hoặc thanh toán bãi đỗ qua VETC.',
        campaign: 'C003',
        progress: Math.min(stats.walletTopups + stats.etcTrips + stats.parkingPayments, 2),
        target: 3,
        xp: 75,
        loyaltyPoints: 850,
        deadline: '2026-07-18',
        vehicle: null,
        aiReason: 'Đây là nhiệm vụ tạo thói quen quay lại đều đặn, phù hợp với mục tiêu Daily Engagement và Retention thay vì chỉ thưởng cho mua dịch vụ đơn lẻ.',
        nextAction: state.needsWalletHabit ? 'Nạp ví hoặc dùng ETC hôm nay' : 'Hoàn thành thêm 1 giao dịch trong tuần',
        scoreBreakdown: scored.breakdown,
        scoringFormula: SCORING_FACTORS.formula,
      };
    case 'M-SERVICE-DISCOVERY':
      return {
        ...common,
        title: 'Khám phá thêm 1 dịch vụ mới',
        description: 'Thử Parking, Cứu hộ, Bảo hiểm hoặc Bảo dưỡng để mở thử thách cross-service.',
        campaign: 'C006',
        progress: Math.min(stats.parkingPayments + stats.roadsideViews + stats.insuranceViews + stats.carWashBookings, 2),
        target: 3,
        xp: 95,
        loyaltyPoints: 1_200,
        deadline: '2026-08-31',
        vehicle: null,
        aiReason: 'Profile hiện còn khoảng trống ở một số dịch vụ VETC. AI dùng mission discovery để tăng service adoption thay vì chỉ tăng số lần nạp tiền.',
        nextAction: state.needsParking ? 'Mở Bãi đỗ thông minh hoặc Cứu hộ 24/7' : 'Dùng thêm 1 dịch vụ ngoài ETC',
        scoreBreakdown: scored.breakdown,
        scoringFormula: SCORING_FACTORS.formula,
      };
    case 'M-SAFETY-CHECK':
      return {
        ...common,
        title: 'Bảo vệ xe chủ động',
        description: 'Xem bảo hiểm hoặc kích hoạt cứu hộ để hoàn tất nhiệm vụ responsible mobility trong tháng.',
        campaign: 'C002',
        progress: Math.min(stats.insuranceViews + stats.roadsideViews, 1),
        target: 2,
        xp: 90,
        loyaltyPoints: 1_100,
        deadline: '2026-07-31',
        vehicle: profile.vehicleType,
        aiReason: 'AI đẩy mission an toàn khi xe đã cũ, cứu hộ chưa kích hoạt, hoặc bảo hiểm sắp hết hạn. Đây là phần giữ đúng core capability Responsible Mobility Rewards.',
        nextAction: state.needsInsurance ? 'Xem ưu đãi bảo hiểm đang áp dụng' : 'Kích hoạt cứu hộ cho xe đang dùng',
        scoreBreakdown: scored.breakdown,
        scoringFormula: SCORING_FACTORS.formula,
      };
    case 'M-EV-WEEK':
      return {
        ...common,
        title: 'EV Week: thử trạm sạc mới',
        description: 'Sạc xe điện tại 1 trạm đối tác mới và nhận thêm reward dành riêng cho hệ sinh thái EV.',
        campaign: 'C004',
        progress: Math.min(stats.evCharges, 1),
        target: 2,
        xp: 110,
        loyaltyPoints: 1_400,
        deadline: '2026-07-17',
        vehicle: profile.vehicleType,
        aiReason: 'Người dùng EV cần mission và reward riêng thay vì nhận chung với tài xế dùng xe xăng. EV Week cho phép AI cá nhân hóa theo vehicle type, charging usage và campaign đang chạy.',
        nextAction: 'Tìm trạm sạc đối tác mới gần bạn',
        scoreBreakdown: scored.breakdown,
        scoringFormula: SCORING_FACTORS.formula,
      };
    case 'M-REFERRAL':
      return {
        ...common,
        title: 'Referral Sprint',
        description: 'Mời 1 người bạn liên kết xe và hoàn tất giao dịch đầu tiên để mở referral rewards.',
        campaign: 'C005',
        progress: Math.min(stats.referralShares, 1),
        target: 2,
        xp: 140,
        loyaltyPoints: 2_400,
        deadline: '2026-07-15',
        vehicle: null,
        aiReason: 'Referral được ưu tiên cho người dùng có engagement cao, từng chia sẻ mã, hoặc có loyalty mạnh. Đây là growth loop đúng với core capability Referral Programs.',
        nextAction: stats.referralShares > 0 ? 'Theo dõi bạn bè hoàn tất giao dịch đầu tiên' : 'Chia sẻ mã giới thiệu ngay',
        scoreBreakdown: scored.breakdown,
        scoringFormula: SCORING_FACTORS.formula,
      };
    case 'M-PROGRESSION':
      return {
        ...common,
        title: 'Thử thách hội viên nâng cao',
        description: 'Hoàn thành 3 nhóm hành động khác nhau trong tháng để nhận huy hiệu hiếm và bonus Loyalty.',
        campaign: 'C001',
        progress: Math.min(stats.walletTopups + stats.parkingPayments + stats.referralShares + stats.rewardRedemptions, 2),
        target: 3,
        xp: 160,
        loyaltyPoints: 3_200,
        deadline: '2026-07-31',
        vehicle: null,
        aiReason: 'Người dùng loyalty cao cần progression có ý nghĩa hơn reward lặp lại. AI đẩy challenge dài hạn, đa hành vi và có badge hiếm để duy trì động lực.',
        nextAction: 'Hoàn thành thêm 1 nhóm hành động khác loại',
        scoreBreakdown: scored.breakdown,
        scoringFormula: SCORING_FACTORS.formula,
      };
    default:
      return null;
  }
}

function buildRuleBasedMissionRecommendations(profileId) {
  const profile = demoProfiles.find((item) => item.id === profileId) ?? demoProfiles[0];
  const stats = profileActivity[profile.id] ?? { activityCount: 0, walletTopups: 0, referralShares: 0, logins: 0, etcTrips: 0, parkingPayments: 0, carWashBookings: 0, evCharges: 0, insuranceViews: 0, roadsideViews: 0, rewardRedemptions: 0 };
  const candidates = [];
  const state = deriveProfileState(profile, stats);
  const eligibility = {
    'M-ONBOARDING-7D': state.isNew || profile.segment === 'Light User',
    'M-COME-BACK': state.isInactive,
    'M-DAILY-LOOP': state.isDaily || state.needsWalletHabit,
    'M-SERVICE-DISCOVERY': state.needsParking || profile.segment.includes('Explorer') || profile.segment.includes('Service Explorer'),
    'M-SAFETY-CHECK': state.needsInsurance || state.needsRoadside,
    'M-EV-WEEK': state.isEV,
    'M-REFERRAL': state.isReferralFit,
    'M-PROGRESSION': state.isHighLoyalty,
  };

  for (const template of MISSION_TEMPLATE_LIBRARY) {
    if (!eligibility[template.templateId]) continue;
    const candidate = missionTemplateToCandidate(template, profileId, profile, stats, state);
    if (candidate) addCandidate(candidates, candidate);
  }

  if (state.isFamily) {
    addCandidate(candidates, missionTemplateToCandidate({ templateId: 'M-FAMILY-WEEKEND', category: 'Chiến dịch' }, profileId, profile, stats, state));
  }

  if (state.isBusiness) {
    addCandidate(candidates, missionTemplateToCandidate({ templateId: 'M-BUSINESS-FLOW', category: 'Dịch vụ' }, profileId, profile, stats, state));
  }

  candidates.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (b.status === 'completed' && a.status !== 'completed') return -1;
    return b.aiScore - a.aiScore;
  });

  const recommendations = candidates.slice(0, 6);
  const nextBestAction = recommendations[0]?.nextAction ?? 'Mở một dịch vụ VETC phù hợp';
  const recommendationSummary = `AI ưu tiên ${profile.segment} tại ${profile.city} dựa trên engagement ${profile.engagementScore}, hoạt động gần nhất ${profile.lastActiveDays} ngày trước, và khoảng trống dịch vụ hiện tại.`;
  const matchedActivityRules = ACTIVITY_SIGNAL_RULES.filter((rule) => {
    if (rule.signal === 'walletTopups > 0') return stats.walletTopups > 0;
    if (rule.signal === 'parkingPayments = 0 and parkingUsage low') return stats.parkingPayments === 0 && state.needsParking;
    if (rule.signal === 'insuranceViews > 0 and insurance not enabled or expiring') return stats.insuranceViews > 0 && state.needsInsurance;
    if (rule.signal === 'roadsideViews > 0 and roadsideEnabled = false') return stats.roadsideViews > 0 && !profile.roadsideEnabled;
    if (rule.signal === 'evCharges > 0') return stats.evCharges > 0;
    if (rule.signal === 'referralShares > 0') return stats.referralShares > 0;
    if (rule.signal === 'rewardRedemptions > 0') return stats.rewardRedemptions > 0;
    return false;
  }).map((rule) => rule.signal);

  return {
    profile: {
      id: profile.id,
      label: `${profile.name} • ${profile.segment}`,
      name: profile.name,
      segment: profile.segment,
      city: profile.city,
      vehicleType: profile.vehicleType,
      interests: profile.interests,
      engagementScore: profile.engagementScore,
      lastActiveDays: profile.lastActiveDays,
      loyaltyPoints: profile.loyaltyPoints,
      preferredChannel: profile.preferredChannel,
    },
    profiles: demoProfiles.map((item) => ({
      id: item.id,
      label: `${item.name} • ${item.segment}`,
      segment: item.segment,
      engagementScore: item.engagementScore,
      lastActiveDays: item.lastActiveDays,
    })),
    recommendations,
    nextBestAction,
    recommendationSummary,
    personalizationMeta: {
      scoringFormula: SCORING_FACTORS.formula,
      matchedActivityRules,
    },
  };
}

function canonicalizeOpenAIRecommendations(ranked, ruleResult, profileId, profile) {
  const byId = new Map(ruleResult.recommendations.map((mission) => [mission.id, mission]));
  const normalized = [];
  const seen = new Set();

  for (const item of ranked.recommendations ?? []) {
    if (!item?.id || seen.has(item.id)) continue;
    const canonical = byId.get(item.id);
    if (!canonical) continue;
    seen.add(item.id);

    normalized.push({
      ...canonical,
      aiReason: item.aiReason || canonical.aiReason,
      aiSignals: Array.isArray(item.aiSignals) ? item.aiSignals.slice(0, 6) : canonical.aiSignals,
      aiScore: clamp(Number.isFinite(item.aiScore) ? item.aiScore : canonical.aiScore, 10, 99),
      scoreBreakdown: item.scoreBreakdown ?? canonical.scoreBreakdown,
      nextAction: item.nextAction || canonical.nextAction,
      image: item.image ?? canonical.image ?? inferMissionImage(canonical.id, canonical.category, profile),
    });
  }

  for (const mission of ruleResult.recommendations) {
    if (seen.has(mission.id)) continue;
    normalized.push(mission);
  }

  return {
    recommendationSummary: ranked.recommendationSummary || ruleResult.recommendationSummary,
    nextBestAction: ranked.nextBestAction || normalized[0]?.nextAction || ruleResult.nextBestAction,
    matchedActivityRules: Array.isArray(ranked.matchedActivityRules)
      ? ranked.matchedActivityRules.filter((item) => typeof item === 'string').slice(0, 12)
      : ruleResult.personalizationMeta.matchedActivityRules,
    recommendations: normalized
      .sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (b.status === 'completed' && a.status !== 'completed') return -1;
        return b.aiScore - a.aiScore;
      })
      .slice(0, 6)
      .map((mission) => {
        const savedState = missionState(profileId, mission.id);
        return {
          ...mission,
          ...(savedState ?? {}),
          status: savedState?.status ?? mission.status ?? 'active',
          aiSignals: savedState?.aiSignals ?? mission.aiSignals,
        };
      }),
  };
}

async function buildMissionRecommendations(profileId) {
  const profile = demoProfiles.find((item) => item.id === profileId) ?? demoProfiles[0];
  const stats = profileActivity[profile.id] ?? { activityCount: 0, walletTopups: 0, referralShares: 0, logins: 0, etcTrips: 0, parkingPayments: 0, carWashBookings: 0, evCharges: 0, insuranceViews: 0, roadsideViews: 0, rewardRedemptions: 0 };
  const ruleResult = buildRuleBasedMissionRecommendations(profileId);
  const db = getDb(profile.id);

  if (PERSONALIZATION_MODE !== 'openai') {
    persistentStore.setRecommendation(profile.id, ruleResult);
    return ruleResult;
  }

  try {
    const ranked = await rankMissionsWithOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      profile,
      activitySummary: stats,
      services: db.services,
      campaigns,
      rewards: db.rewards,
      missionTemplates: MISSION_TEMPLATE_LIBRARY,
      activityRules: ACTIVITY_SIGNAL_RULES,
      scoringFormula: SCORING_FACTORS.formula,
    });

    const normalized = canonicalizeOpenAIRecommendations(ranked, ruleResult, profileId, profile);
    const result = {
      ...ruleResult,
      recommendations: normalized.recommendations,
      nextBestAction: normalized.nextBestAction,
      recommendationSummary: normalized.recommendationSummary,
      personalizationMeta: {
        scoringFormula: SCORING_FACTORS.formula,
        matchedActivityRules: normalized.matchedActivityRules,
        mode: 'openai',
      },
    };
    persistentStore.setRecommendation(profile.id, result);
    return result;
  } catch (error) {
    if (OPENAI_FALLBACK_MODE === 'error') {
      throw error;
    }
    const fallback = {
      ...ruleResult,
      recommendationSummary: `${ruleResult.recommendationSummary} OpenAI fallback active: ${error instanceof Error ? error.message : 'Unknown error'}.`,
      personalizationMeta: {
        ...ruleResult.personalizationMeta,
        mode: 'rules-fallback',
      },
    };
    persistentStore.setRecommendation(profile.id, fallback);
    return fallback;
  }
}

function inferMissionImage(missionId, category, profile) {
  if (missionId.includes('EV') || category === 'EV' || profile.vehicleType === 'EV') return 'ev';
  if (missionId.includes('REFERRAL') || category === 'Giới thiệu') return 'star';
  if (missionId.includes('SAFETY') || category === 'An toàn') return 'shield';
  if (missionId.includes('DISCOVERY') || category === 'Dịch vụ') return 'grid';
  if (missionId.includes('FAMILY') || missionId.includes('SUMMER') || category === 'Chiến dịch') return 'travel';
  return 'road';
}

async function bootstrap() {
  const db = getDb();
  return {
    user: db.user,
    vehicles: db.vehicles,
    rewards: db.rewards,
    services: db.services,
    campaigns,
    missions: (await buildMissionRecommendations(db.user.id)).recommendations,
    activity: db.activity,
    redemptions: db.redemptions,
    loyalty: {
      pointsBalance: db.user.pointsBalance,
      cashBalance: db.user.cashBalance,
      tier: db.user.tier,
      eligibleSpending: db.user.eligibleSpending,
      expiringPoints: db.user.expiringPoints,
    },
  };
}

function idempotent(req, handler) {
  const key = req.headers.idempotencykey;
  if (key && processedKeys.has(key)) return processedKeys.get(key);
  const result = handler();
  if (key) {
    processedKeys.set(key, result);
    persistentStore.saveProcessedKey(key, result);
  }
  return result;
}

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
      sessions.set(accessToken, { userId: getDb().user.id, createdAt: new Date().toISOString() });
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
    if (method === 'GET' && url.pathname === '/api/bootstrap') return json(res, 200, { code: '00', data: await bootstrap() });
    if (method === 'GET' && url.pathname === '/api/user') return json(res, 200, { code: '00', data: getDb().user });
    if (method === 'GET' && url.pathname === '/api/loyalty') return json(res, 200, { code: '00', data: (await bootstrap()).loyalty });
    if (method === 'GET' && url.pathname === '/api/activity') return json(res, 200, { code: '00', data: getDb().activity });
    if (method === 'GET' && url.pathname === '/api/rewards') return json(res, 200, { code: '00', data: getDb().rewards });
    if (method === 'GET' && url.pathname === '/api/redemptions') return json(res, 200, { code: '00', data: getDb().redemptions });
    if (method === 'GET' && url.pathname === '/api/services') return json(res, 200, { code: '00', data: getDb().services });
    if (method === 'GET' && url.pathname === '/api/campaigns') return json(res, 200, { code: '00', data: campaigns });

    if (method === 'GET' && url.pathname === '/api/gamification/recommendations') {
      const profileId = url.searchParams.get('profileId') ?? DEFAULT_PROFILE_ID;
      return json(res, 200, { code: '00', data: await buildMissionRecommendations(profileId) });
    }

    if (method === 'GET' && url.pathname === '/api/gamification/recommendations/history') {
      const profileId = url.searchParams.get('profileId') ?? DEFAULT_PROFILE_ID;
      const limit = Number(url.searchParams.get('limit') ?? 10);
      return json(res, 200, {
        code: '00',
        data: {
          profileId,
          snapshots: persistentStore.listRecommendationSnapshots(profileId, limit),
        },
      });
    }

    if (method === 'POST' && url.pathname === '/api/rewards/redeem') {
      const body = await readBody(req);
      const result = idempotent(req, () => {
        const db = getDb();
        const selected = db.rewards.find((item) => item.id === body.rewardId);
        if (!selected) return { status: 404, body: { code: 'REWARD_NOT_FOUND', message: 'Reward not found' } };
        if (tierRank[selected.minTier] > tierRank[db.user.tier]) return { status: 403, body: { code: 'TIER_NOT_ELIGIBLE', message: 'Hạng hội viên chưa đủ điều kiện' } };
        if (selected.points > db.user.pointsBalance) return { status: 422, body: { code: 'INSUFFICIENT_POINTS', message: 'Không đủ điểm đổi ưu đãi' } };

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
        const saved = updateDb(db.user.id, (draft) => {
          draft.user.pointsBalance -= selected.points;
          draft.redemptions.unshift(redemption);
          draft.activity.unshift({
            id: redemption.id,
            kind: 'redeem',
            title: `Đổi ${selected.title}`,
            datetime: redemption.redeemedAt,
            vehicle: draft.vehicles.find((item) => item.id === body.vehicleId)?.plate ?? null,
            partner: 'VETC Loyalty',
            points: -selected.points,
            cash: null,
            status: 'success',
            detail: selected.fulfillment === 'voucher' ? 'Voucher đã phát hành.' : 'Ưu đãi đã được kích hoạt.',
          });
          return draft;
        });
        return { status: 201, body: { code: '00', data: { redemption, loyalty: { pointsBalance: saved.user.pointsBalance, cashBalance: saved.user.cashBalance, tier: saved.user.tier, eligibleSpending: saved.user.eligibleSpending, expiringPoints: saved.user.expiringPoints }, activity: saved.activity } } };
      });
      return json(res, result.status, result.body);
    }

    if (method === 'POST' && url.pathname.startsWith('/api/services/') && url.pathname.endsWith('/activate')) {
      const serviceId = url.pathname.split('/')[3];
      const db = getDb();
      const svc = db.services.find((item) => item.id === serviceId);
      if (!svc) return json(res, 404, { code: 'SERVICE_NOT_FOUND', message: 'Service not found' });
      const saved = updateDb(db.user.id, (draft) => {
        const service = draft.services.find((item) => item.id === serviceId);
        service.status = 'active';
        draft.activity.unshift({
          id: `SV-${Date.now()}`,
          kind: 'service',
          title: `Kích hoạt dịch vụ: ${service.name}`,
          datetime: new Date().toISOString(),
          vehicle: null,
          partner: 'VETC',
          points: 0,
          cash: null,
          status: 'success',
          detail: 'Dịch vụ đã được kích hoạt từ backend.',
        });
        return draft;
      });
      return json(res, 200, { code: '00', data: { service: saved.services.find((item) => item.id === serviceId), activity: saved.activity } });
    }

    if (method === 'POST' && url.pathname === '/api/missions/complete') {
      const body = await readBody(req);
      const profileId = body.profileId ?? getDb().user.id;
      const selected = (await buildMissionRecommendations(profileId)).recommendations.find((item) => item.id === body.missionId);
      if (!selected) return json(res, 404, { code: 'MISSION_NOT_FOUND', message: 'Mission not found' });
      const completed = { ...selected, progress: selected.target, status: 'completed' };
      const saved = updateDb(profileId, (draft) => {
        draft.missionStates.set(completed.id, completed);
        draft.user.pointsBalance += selected.loyaltyPoints;
        draft.activity.unshift({
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
        return draft;
      });
      return json(res, 200, {
        code: '00',
        data: {
          mission: completed,
          missions: (await buildMissionRecommendations(profileId)).recommendations,
          loyalty: { pointsBalance: saved.user.pointsBalance, cashBalance: saved.user.cashBalance, tier: saved.user.tier, eligibleSpending: saved.user.eligibleSpending, expiringPoints: saved.user.expiringPoints },
          activity: saved.activity,
        },
      });
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
      persistentStore.savePayment(payment);
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
      persistentStore.savePayment(payment);
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
