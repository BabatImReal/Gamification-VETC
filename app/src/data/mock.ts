/**
 * Mock data for the VETC Loyalty demo. Values follow the product brief:
 * 1 điểm VETC = 1đ giá trị quy đổi; điểm ≠ số dư tài khoản ≠ chi tiêu xét hạng.
 * "Today" in the demo is 2026-07-11 (matches the track dataset campaigns).
 */

export type TierId = 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Tier {
  id: TierId;
  name: string; // Vietnamese display name
  threshold: number; // eligible spending (VND) required
  color: string;
  benefits: string[];
}

export const TIERS: Tier[] = [
  {
    id: 'silver',
    name: 'Bạc',
    threshold: 0,
    color: '#8E9BAE',
    benefits: [
      'Tích 1 điểm cho mỗi 1.000đ phí đường bộ',
      'Ưu đãi đối tác cơ bản',
      'Hỗ trợ khách hàng 24/7',
    ],
  },
  {
    id: 'gold',
    name: 'Vàng',
    threshold: 40_000_000,
    color: '#C9962E',
    benefits: [
      'Tích điểm x1,5 cho mọi giao dịch',
      'Giảm 10% phí cứu hộ giao thông',
      'Ưu tiên xử lý yêu cầu hỗ trợ',
      'Quà tặng sinh nhật 50.000 điểm',
    ],
  },
  {
    id: 'platinum',
    name: 'Bạch Kim',
    threshold: 120_000_000,
    color: '#5A6B7E',
    benefits: [
      'Tích điểm x2 cho mọi giao dịch',
      'Miễn phí cứu hộ 1 lần/năm',
      'Giảm 15% bảo hiểm vật chất xe',
      'Đường dây hỗ trợ riêng',
    ],
  },
  {
    id: 'diamond',
    name: 'Kim Cương',
    threshold: 300_000_000,
    color: '#3E4FBC',
    benefits: [
      'Tích điểm x3 cho mọi giao dịch',
      'Miễn phí cứu hộ không giới hạn',
      'Quản lý tài khoản riêng',
      'Ưu đãi độc quyền từ Tasco',
      'Phòng chờ sự kiện đối tác',
    ],
  },
];

export function tierById(id: TierId): Tier {
  return TIERS.find((t) => t.id === id)!;
}

export function nextTier(id: TierId): Tier | null {
  const i = TIERS.findIndex((t) => t.id === id);
  return TIERS[i + 1] ?? null;
}

export interface Vehicle {
  id: string;
  model: string;
  plate: string;
  type: string;
  etagStatus: 'active' | 'inactive';
  insuranceExpiry: string | null;
  roadsideActive: boolean;
  recentTollCount: number; // last 30 days
  nextMaintenance: string | null;
}

export const VEHICLES: Vehicle[] = [
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

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  memberNo: string;
  memberSince: string;
  tier: TierId;
  tierReviewDate: string; // ngày xét hạng tiếp theo
  eligibleSpending: number; // chi tiêu xét hạng (VND)
  pointsBalance: number; // điểm VETC
  cashBalance: number; // số dư tài khoản VETC (VND)
  expiringPoints: { amount: number; date: string } | null;
  ekycVerified: boolean;
  linkedBank: string;
}

export const USER: User = {
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

export type RewardCategory =
  | 'toll'
  | 'insurance'
  | 'roadside'
  | 'maintenance'
  | 'parking'
  | 'carcare'
  | 'ev'
  | 'partner'
  | 'tasco';

export const REWARD_CATEGORIES: { id: RewardCategory; label: string }[] = [
  { id: 'toll', label: 'Phí đường bộ' },
  { id: 'parking', label: 'Bãi đỗ xe' },
  { id: 'insurance', label: 'Bảo hiểm' },
  { id: 'roadside', label: 'Cứu hộ' },
  { id: 'maintenance', label: 'Bảo dưỡng' },
  { id: 'carcare', label: 'Chăm sóc xe' },
  { id: 'ev', label: 'Sạc xe điện' },
  { id: 'partner', label: 'Đối tác' },
  { id: 'tasco', label: 'Tasco' },
];

export interface Reward {
  id: string;
  title: string;
  category: RewardCategory;
  points: number; // 0 = ưu đãi chiến dịch
  cashValue: number | null;
  minTier: TierId;
  expiry: string;
  locations: string;
  image: string; // emoji-free: gradient key handled by UI
  description: string;
  includes: string[];
  terms: string[];
  usage: string;
  refundPolicy: string;
  fulfillment: 'voucher' | 'service';
  isNew?: boolean;
  addedAt: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  title: string;
  code: string;
  redeemedAt: string;
  expiry: string;
  fulfillment: 'voucher' | 'service';
  vehicleId?: string | null;
  status?: 'active' | 'used' | 'expired';
}

export const REWARDS: Reward[] = [
  {
    id: 'R-TOLL-50',
    title: 'Giảm 50.000đ phí đường bộ',
    category: 'toll',
    points: 50_000,
    cashValue: 50_000,
    minTier: 'silver',
    expiry: '2026-09-30',
    locations: 'Tất cả trạm thu phí VETC toàn quốc',
    image: 'road',
    description: 'Trừ trực tiếp 50.000đ vào phí đường bộ cho chuyến đi tiếp theo của bạn.',
    includes: ['Mã giảm 50.000đ áp dụng tự động cho giao dịch ETC kế tiếp', 'Không giới hạn tuyến đường'],
    terms: ['Áp dụng 1 lần cho 1 phương tiện', 'Không quy đổi thành tiền mặt', 'Hiệu lực 60 ngày kể từ khi đổi'],
    usage: 'Sau khi đổi, ưu đãi kích hoạt tự động ở lần qua trạm tiếp theo của xe đã chọn.',
    refundPolicy: 'Không hoàn điểm sau khi đổi thành công.',
    fulfillment: 'service',
    addedAt: '2026-06-01',
  },
  {
    id: 'R-PARK-20',
    title: 'Giảm 20.000đ phí bãi đỗ',
    category: 'parking',
    points: 20_000,
    cashValue: 20_000,
    minTier: 'silver',
    expiry: '2026-08-31',
    locations: 'Bãi đỗ liên kết VETC tại Hà Nội, TP.HCM, Đà Nẵng',
    image: 'parking',
    description: 'Voucher giảm phí gửi xe tại hệ thống bãi đỗ thông minh liên kết VETC.',
    includes: ['1 voucher giảm 20.000đ phí bãi đỗ', 'Áp dụng thanh toán qua ứng dụng VETC'],
    terms: ['Mỗi khách hàng đổi tối đa 3 voucher/tháng', 'Không áp dụng cùng khuyến mãi khác'],
    usage: 'Xuất trình mã voucher trong mục Ưu đãi của tôi khi thanh toán bãi đỗ.',
    refundPolicy: 'Hoàn điểm nếu voucher chưa sử dụng và còn hạn, trong vòng 7 ngày.',
    fulfillment: 'voucher',
    addedAt: '2026-06-10',
  },
  {
    id: 'R-CAFE-30',
    title: 'Voucher cà phê Highlands 30.000đ',
    category: 'partner',
    points: 30_000,
    cashValue: 30_000,
    minTier: 'silver',
    expiry: '2026-08-15',
    locations: 'Toàn bộ cửa hàng Highlands Coffee & trạm dừng nghỉ cao tốc',
    image: 'coffee',
    description: 'Nghỉ chân trên hành trình — đổi điểm lấy voucher đồ uống tại Highlands Coffee.',
    includes: ['1 e-voucher trị giá 30.000đ', 'Áp dụng cho toàn bộ menu đồ uống'],
    terms: ['Không quy đổi thành tiền mặt', 'Mỗi hoá đơn dùng tối đa 2 voucher'],
    usage: 'Đưa mã QR trong Ưu đãi của tôi cho nhân viên thu ngân.',
    refundPolicy: 'Không hoàn điểm sau khi đổi.',
    fulfillment: 'voucher',
    isNew: true,
    addedAt: '2026-07-01',
  },
  {
    id: 'R-INS-50',
    title: 'Giảm 50.000đ bảo hiểm TNDS',
    category: 'insurance',
    points: 50_000,
    cashValue: 50_000,
    minTier: 'silver',
    expiry: '2026-12-31',
    locations: 'Mua/gia hạn trực tuyến trong ứng dụng VETC',
    image: 'shield',
    description: 'Ưu đãi khi gia hạn bảo hiểm trách nhiệm dân sự bắt buộc cho xe của bạn.',
    includes: ['Mã giảm 50.000đ phí bảo hiểm TNDS', 'Áp dụng mọi hãng bảo hiểm đối tác'],
    terms: ['Áp dụng cho hợp đồng từ 12 tháng', '1 mã cho 1 hợp đồng'],
    usage: 'Nhập mã ở bước thanh toán khi mua bảo hiểm trong ứng dụng.',
    refundPolicy: 'Hoàn điểm nếu hợp đồng không được phát hành.',
    fulfillment: 'voucher',
    addedAt: '2026-05-20',
  },
  {
    id: 'R-RSA-150',
    title: 'Giảm 15% gói cứu hộ năm đầu',
    category: 'roadside',
    points: 150_000,
    cashValue: 180_000,
    minTier: 'silver',
    expiry: '2026-10-31',
    locations: 'Dịch vụ cứu hộ VETC 24/7 toàn quốc',
    image: 'tow',
    description: 'Kích hoạt gói cứu hộ giao thông 24/7 với ưu đãi 15% phí năm đầu tiên.',
    includes: ['Giảm 15% phí gói cứu hộ 12 tháng', 'Cứu hộ không giới hạn số lần trong phạm vi gói'],
    terms: ['Áp dụng cho xe chưa có gói cứu hộ', 'Kích hoạt trong 30 ngày sau khi đổi'],
    usage: 'Ưu đãi tự động áp dụng khi đăng ký gói cứu hộ cho xe đã chọn.',
    refundPolicy: 'Hoàn điểm nếu chưa kích hoạt gói, trong vòng 30 ngày.',
    fulfillment: 'service',
    addedAt: '2026-06-15',
  },
  {
    id: 'R-EV-50',
    title: 'Voucher sạc xe điện 50.000đ',
    category: 'ev',
    points: 50_000,
    cashValue: 50_000,
    minTier: 'silver',
    expiry: '2026-07-17',
    locations: 'Trạm sạc đối tác VETC (V-GREEN, EVN, EverCharge)',
    image: 'ev',
    description: 'Ưu đãi Tuần lễ EV — giảm trực tiếp phí sạc tại trạm đối tác.',
    includes: ['1 voucher sạc trị giá 50.000đ', 'Dùng cho mọi công suất sạc'],
    terms: ['Chỉ áp dụng trong Tuần lễ EV (10/07 – 17/07)', 'Mỗi khách hàng tối đa 2 voucher'],
    usage: 'Quét QR tại trạm sạc và chọn voucher ở bước thanh toán.',
    refundPolicy: 'Không hoàn điểm sau khi đổi.',
    fulfillment: 'voucher',
    isNew: true,
    addedAt: '2026-07-10',
  },
  {
    id: 'R-WASH-40',
    title: 'Giảm 10% dịch vụ rửa xe',
    category: 'carcare',
    points: 8_000,
    cashValue: 10_000,
    minTier: 'silver',
    expiry: '2026-09-30',
    locations: 'Chuỗi rửa xe đối tác tại Hà Nội & TP.HCM',
    image: 'wash',
    description: 'Chăm sóc xe sau hành trình dài với ưu đãi từ đối tác rửa xe.',
    includes: ['Giảm 10% (tối đa 30.000đ) cho 1 lần rửa xe'],
    terms: ['Đặt lịch trước qua ứng dụng', 'Không áp dụng ngày lễ'],
    usage: 'Đặt lịch trong mục Dịch vụ, ưu đãi áp dụng khi thanh toán.',
    refundPolicy: 'Hoàn điểm nếu huỷ lịch trước 24 giờ.',
    fulfillment: 'voucher',
    addedAt: '2026-06-20',
  },
  {
    id: 'R-MAINT-220',
    title: 'Voucher bảo dưỡng xe 250.000đ',
    category: 'maintenance',
    points: 220_000,
    cashValue: 250_000,
    minTier: 'gold',
    expiry: '2026-12-31',
    locations: 'Trung tâm dịch vụ Tasco Auto toàn quốc',
    image: 'wrench',
    description: 'Gói kiểm tra 20 hạng mục và ưu đãi bảo dưỡng tại Tasco Auto.',
    includes: ['Voucher 250.000đ phí bảo dưỡng', 'Kiểm tra tổng quát 20 hạng mục miễn phí'],
    terms: ['Dành cho hội viên hạng Vàng trở lên', 'Đặt lịch trước tối thiểu 2 ngày'],
    usage: 'Đặt lịch bảo dưỡng trong mục Dịch vụ và chọn voucher.',
    refundPolicy: 'Hoàn điểm nếu huỷ lịch trước 48 giờ.',
    fulfillment: 'voucher',
    addedAt: '2026-05-05',
  },
  {
    id: 'R-FOOD-100',
    title: 'Voucher ẩm thực 100.000đ',
    category: 'partner',
    points: 100_000,
    cashValue: 100_000,
    minTier: 'silver',
    expiry: '2026-08-31',
    locations: 'Hệ thống nhà hàng đối tác & trạm dừng nghỉ',
    image: 'food',
    description: 'Bữa ngon cho cả gia đình tại chuỗi nhà hàng đối tác VETC.',
    includes: ['1 e-voucher 100.000đ', 'Áp dụng toàn hệ thống đối tác'],
    terms: ['Không quy đổi tiền mặt', 'Không áp dụng cùng chương trình khác'],
    usage: 'Đưa mã QR cho thu ngân khi thanh toán.',
    refundPolicy: 'Không hoàn điểm sau khi đổi.',
    fulfillment: 'voucher',
    addedAt: '2026-06-25',
  },
  {
    id: 'R-TRAVEL-250',
    title: 'Combo du lịch cuối tuần',
    category: 'tasco',
    points: 250_000,
    cashValue: 320_000,
    minTier: 'gold',
    expiry: '2026-07-31',
    locations: 'Đối tác khách sạn & khu nghỉ tại Đà Nẵng, Nha Trang, Đà Lạt',
    image: 'travel',
    description: 'Ưu đãi Hè — combo giảm giá khách sạn kèm voucher đổ xăng cho chuyến đi cuối tuần.',
    includes: ['Giảm 250.000đ đặt phòng đối tác', 'Voucher nhiên liệu 70.000đ'],
    terms: ['Dành cho hội viên hạng Vàng trở lên', 'Đặt phòng trước 31/07/2026'],
    usage: 'Mã ưu đãi gửi qua mục Ưu đãi của tôi, nhập khi đặt phòng.',
    refundPolicy: 'Hoàn điểm nếu chưa sử dụng mã, trong vòng 7 ngày.',
    fulfillment: 'voucher',
    addedAt: '2026-06-01',
  },
  {
    id: 'R-PRIORITY',
    title: 'Nâng hạng ưu tiên hỗ trợ',
    category: 'tasco',
    points: 400_000,
    cashValue: null,
    minTier: 'platinum',
    expiry: '2026-12-31',
    locations: 'Toàn hệ thống VETC',
    image: 'star',
    description: 'Quyền ưu tiên xử lý mọi yêu cầu hỗ trợ và cứu hộ trong 12 tháng.',
    includes: ['Ưu tiên tổng đài & cứu hộ 12 tháng', 'Tư vấn viên riêng'],
    terms: ['Dành cho hội viên Bạch Kim trở lên'],
    usage: 'Kích hoạt tự động sau khi đổi.',
    refundPolicy: 'Không hoàn điểm sau khi kích hoạt.',
    fulfillment: 'service',
    addedAt: '2026-04-01',
  },
  {
    id: 'R-X2-WEEKEND',
    title: 'Nhân đôi điểm cuối tuần',
    category: 'toll',
    points: 0,
    cashValue: null,
    minTier: 'silver',
    expiry: '2026-08-31',
    locations: 'Mọi giao dịch ETC thứ 7 & Chủ nhật',
    image: 'x2',
    description: 'Ưu đãi chiến dịch: đăng ký miễn phí để nhận điểm x2 cho phí đường bộ cuối tuần.',
    includes: ['Điểm x2 cho giao dịch ETC vào thứ 7, Chủ nhật', 'Áp dụng đến 31/08/2026'],
    terms: ['Đăng ký 1 lần cho cả chiến dịch', 'Tối đa 50.000 điểm thưởng/tháng'],
    usage: 'Kích hoạt tự động sau khi đăng ký.',
    refundPolicy: 'Ưu đãi miễn phí, không phát sinh điểm.',
    fulfillment: 'service',
    isNew: true,
    addedAt: '2026-07-05',
  },
];

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  pointsEarned: string;
  payWithPoints: boolean;
  countsTowardTier: boolean;
  availableFor: string; // vehicle availability note
  image: string;
}

export const SERVICES: Service[] = [
  {
    id: 'S-ETC',
    name: 'Quản lý ETC & nạp tài khoản',
    category: 'Di chuyển',
    description: 'Nạp tiền, xem số dư và lịch sử qua trạm của mọi phương tiện.',
    price: 'Miễn phí',
    pointsEarned: '+1 điểm / 1.000đ phí',
    payWithPoints: true,
    countsTowardTier: true,
    availableFor: 'Tất cả xe có eTag',
    image: 'road',
  },
  {
    id: 'S-TICKET',
    name: 'Vé tháng / quý đường bộ',
    category: 'Di chuyển',
    description: 'Mua vé tháng, vé quý cho tuyến đi lại thường xuyên.',
    price: 'Từ 880.000đ/tháng',
    pointsEarned: '+880 điểm trở lên',
    payWithPoints: true,
    countsTowardTier: true,
    availableFor: 'Mazda CX-5, VinFast VF 8',
    image: 'ticket',
  },
  {
    id: 'S-INS-TNDS',
    name: 'Bảo hiểm TNDS bắt buộc',
    category: 'Bảo hiểm',
    description: 'Mua và gia hạn bảo hiểm trách nhiệm dân sự trực tuyến.',
    price: 'Từ 480.700đ/năm',
    pointsEarned: '+2 điểm / 1.000đ',
    payWithPoints: true,
    countsTowardTier: true,
    availableFor: 'Mazda CX-5 (hết hạn 09/08/2026)',
    image: 'shield',
  },
  {
    id: 'S-INS-BODY',
    name: 'Bảo hiểm vật chất xe',
    category: 'Bảo hiểm',
    description: 'Bảo vệ toàn diện thân vỏ, thuỷ kích, mất cắp bộ phận.',
    price: 'Báo giá theo xe',
    pointsEarned: '+2 điểm / 1.000đ',
    payWithPoints: false,
    countsTowardTier: true,
    availableFor: 'Tất cả xe',
    image: 'shield2',
  },
  {
    id: 'S-RSA',
    name: 'Cứu hộ giao thông 24/7',
    category: 'An toàn',
    description: 'Cứu hộ toàn quốc: kéo xe, kích bình, vá lốp, tiếp nhiên liệu.',
    price: '1.200.000đ/năm',
    pointsEarned: '+1.200 điểm',
    payWithPoints: true,
    countsTowardTier: true,
    availableFor: 'VinFast VF 8 chưa kích hoạt',
    image: 'tow',
  },
  {
    id: 'S-RESCUE',
    name: 'Cứu hộ khẩn cấp',
    category: 'An toàn',
    description: 'Gọi cứu hộ ngay khi gặp sự cố trên đường.',
    price: 'Theo sự cố',
    pointsEarned: '+1 điểm / 1.000đ',
    payWithPoints: true,
    countsTowardTier: false,
    availableFor: 'Tất cả xe',
    image: 'sos',
  },
  {
    id: 'S-MAINT',
    name: 'Đặt lịch bảo dưỡng',
    category: 'Chăm sóc xe',
    description: 'Đặt lịch bảo dưỡng định kỳ tại Tasco Auto và đối tác.',
    price: 'Từ 1.500.000đ',
    pointsEarned: '+2 điểm / 1.000đ',
    payWithPoints: true,
    countsTowardTier: true,
    availableFor: 'Mazda CX-5 (đến hạn 15/09/2026)',
    image: 'wrench',
  },
  {
    id: 'S-WASH',
    name: 'Rửa xe & chăm sóc xe',
    category: 'Chăm sóc xe',
    description: 'Đặt lịch rửa xe, vệ sinh nội thất tại đối tác gần bạn.',
    price: 'Từ 80.000đ',
    pointsEarned: '+160 điểm trở lên',
    payWithPoints: true,
    countsTowardTier: false,
    availableFor: 'Tất cả xe',
    image: 'wash',
  },
  {
    id: 'S-PARK',
    name: 'Bãi đỗ thông minh',
    category: 'Di chuyển',
    description: 'Tìm và thanh toán bãi đỗ không tiền mặt qua eTag.',
    price: 'Theo bãi đỗ',
    pointsEarned: '+1 điểm / 1.000đ',
    payWithPoints: true,
    countsTowardTier: true,
    availableFor: 'Tất cả xe có eTag',
    image: 'parking',
  },
  {
    id: 'S-EV',
    name: 'Sạc xe điện',
    category: 'Xe điện',
    description: 'Tìm trạm sạc đối tác, thanh toán qua tài khoản VETC.',
    price: 'Theo kWh',
    pointsEarned: '+2 điểm / 1.000đ (Tuần lễ EV)',
    payWithPoints: true,
    countsTowardTier: true,
    availableFor: 'VinFast VF 8',
    image: 'ev',
  },
  {
    id: 'S-CAR',
    name: 'Mua xe mới & xe đã qua sử dụng',
    category: 'Tasco',
    description: 'Ưu đãi hội viên khi mua xe tại hệ thống Tasco Auto.',
    price: 'Liên hệ',
    pointsEarned: 'Ưu đãi riêng theo hạng',
    payWithPoints: false,
    countsTowardTier: true,
    availableFor: 'Mọi khách hàng',
    image: 'car',
  },
  {
    id: 'S-PARTS',
    name: 'Phụ kiện & phụ tùng',
    category: 'Tasco',
    description: 'Phụ kiện chính hãng, lắp đặt tại trung tâm dịch vụ.',
    price: 'Theo sản phẩm',
    pointsEarned: '+1 điểm / 1.000đ',
    payWithPoints: true,
    countsTowardTier: false,
    availableFor: 'Tất cả xe',
    image: 'parts',
  },
];

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: 'Hằng ngày' | 'Chiến dịch' | 'Dịch vụ' | 'An toàn' | 'EV' | 'Giới thiệu';
  campaign: string;
  progress: number;
  target: number;
  xp: number;
  loyaltyPoints: number;
  deadline: string;
  vehicle: string | null;
  aiReason: string;
  aiSignals?: string[];
  aiScore?: number;
  scoreBreakdown?: {
    segmentFit: number;
    activityFit: number;
    serviceGapFit: number;
    campaignFit: number;
    urgencyFit: number;
    rewardAffinityFit: number;
    frictionPenalty: number;
  };
  scoringFormula?: string;
  nextAction: string;
  status: 'active' | 'completed' | 'locked';
  image: string;
}

export const MISSIONS: Mission[] = [
  {
    id: 'M-SUMMER-TRIP',
    title: 'Summer Travel Challenge',
    description: 'Hoàn thành 3 chuyến ETC cuối tuần và đổi 1 ưu đãi nghỉ chân trước 31/07.',
    category: 'Chiến dịch',
    campaign: 'C001',
    progress: 2,
    target: 3,
    xp: 120,
    loyaltyPoints: 2_000,
    deadline: '2026-07-31',
    vehicle: '51K-123.45',
    aiReason: 'Bạn thường đi cuối tuần và vừa xem ưu đãi du lịch, nên nhiệm vụ này có xác suất hoàn thành cao.',
    nextAction: 'Qua thêm 1 trạm ETC cuối tuần này',
    status: 'active',
    image: 'travel',
  },
  {
    id: 'M-ROAD-SAFETY',
    title: 'Bảo vệ Mazda CX-5',
    description: 'Gia hạn bảo hiểm TNDS hoặc kích hoạt nhắc hạn trước ngày hết hiệu lực.',
    category: 'An toàn',
    campaign: 'C002',
    progress: 1,
    target: 2,
    xp: 90,
    loyaltyPoints: 1_200,
    deadline: '2026-08-09',
    vehicle: '51K-123.45',
    aiReason: 'Bảo hiểm của Mazda CX-5 hết hạn 09/08; dataset gợi ý ưu tiên responsible mobility cho nhóm Safety Focused.',
    nextAction: 'Xem ưu đãi giảm 50.000đ bảo hiểm',
    status: 'active',
    image: 'shield',
  },
  {
    id: 'M-EV-WEEK',
    title: 'EV Week: thử trạm sạc mới',
    description: 'Sạc VinFast VF 8 tại 1 trạm đối tác mới trong Tuần lễ EV.',
    category: 'EV',
    campaign: 'C004',
    progress: 0,
    target: 1,
    xp: 80,
    loyaltyPoints: 1_000,
    deadline: '2026-07-17',
    vehicle: '30A-456.78',
    aiReason: 'Tài khoản có VinFast VF 8 và giao dịch sạc gần đây; ưu đãi EV Week đang còn hiệu lực.',
    nextAction: 'Tìm trạm sạc gần nhất',
    status: 'active',
    image: 'ev',
  },
  {
    id: 'M-SERVICE-DISCOVERY',
    title: 'Khám phá 3 dịch vụ VETC',
    description: 'Dùng hoặc mở 3 dịch vụ khác nhau: bãi đỗ, cứu hộ, bảo dưỡng, bảo hiểm.',
    category: 'Dịch vụ',
    campaign: 'C006',
    progress: 2,
    target: 3,
    xp: 100,
    loyaltyPoints: 1_500,
    deadline: '2026-08-31',
    vehicle: null,
    aiReason: 'Bạn đã dùng ETC và bãi đỗ; còn thiếu 1 dịch vụ để hoàn thành cross-service challenge.',
    nextAction: 'Đặt lịch bảo dưỡng hoặc kích hoạt cứu hộ',
    status: 'active',
    image: 'grid',
  },
  {
    id: 'M-WALLET-STREAK',
    title: 'Chuỗi thanh toán cuối tuần',
    description: 'Duy trì 2 cuối tuần liên tiếp có giao dịch ETC hoặc bãi đỗ qua VETC.',
    category: 'Hằng ngày',
    campaign: 'C003',
    progress: 1,
    target: 2,
    xp: 70,
    loyaltyPoints: 700,
    deadline: '2026-08-31',
    vehicle: null,
    aiReason: 'Bạn có tần suất ETC cao và số dư tài khoản đủ cho các chuyến ngắn.',
    nextAction: 'Thanh toán ETC hoặc bãi đỗ cuối tuần này',
    status: 'active',
    image: 'road',
  },
  {
    id: 'M-REFERRAL',
    title: 'Referral Sprint',
    description: 'Mời 1 người bạn liên kết xe và hoàn tất giao dịch ETC đầu tiên.',
    category: 'Giới thiệu',
    campaign: 'C005',
    progress: 0,
    target: 1,
    xp: 150,
    loyaltyPoints: 3_000,
    deadline: '2026-07-15',
    vehicle: null,
    aiReason: 'Bạn có mức điểm Loyalty cao; dataset gợi ý referral cho nhóm khách hàng tương tác tốt.',
    nextAction: 'Chia sẻ mã giới thiệu',
    status: 'active',
    image: 'star',
  },
];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
  image: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'A-ROAD-EXPLORER',
    title: 'Road Explorer',
    description: 'Hoàn thành 100 chuyến ETC.',
    unlocked: true,
    progress: 124,
    target: 100,
    image: 'road',
  },
  {
    id: 'A-SAFE-DRIVER',
    title: 'Safe Driver',
    description: 'Duy trì bảo hiểm/cứu hộ hợp lệ cho xe chính.',
    unlocked: false,
    progress: 1,
    target: 2,
    image: 'shield',
  },
  {
    id: 'A-EV-CHAMPION',
    title: 'EV Champion',
    description: 'Sạc xe điện tại 3 trạm đối tác khác nhau.',
    unlocked: false,
    progress: 1,
    target: 3,
    image: 'ev',
  },
];

export const GAME_PROFILE = {
  levelName: 'Bronze Explorer',
  xp: 720,
  nextLevelXp: 1_000,
  streakDays: 5,
  communityProgress: 68,
  communityTarget: '100.000 chuyến ETC trong tháng 7',
};

export type ActivityKind = 'earn' | 'redeem' | 'expire' | 'adjust' | 'toll-points' | 'service' | 'tier' | 'bonus';

export interface ActivityRecord {
  id: string;
  kind: ActivityKind;
  title: string;
  datetime: string;
  vehicle: string | null;
  partner: string | null;
  points: number; // + earned, - deducted, 0 for tier events
  cash: number | null; // VND amount when applicable
  status: 'success' | 'pending' | 'failed' | 'reversed';
  detail: string;
}

export const ACTIVITY: ActivityRecord[] = [
  {
    id: 'T-1024',
    kind: 'earn',
    title: 'Qua trạm Long Phước — cao tốc HCM - Long Thành',
    datetime: '2026-07-10T16:42:00',
    vehicle: '51K-123.45',
    partner: 'VETC',
    points: 33,
    cash: 33_000,
    status: 'success',
    detail: 'Tích điểm phí đường bộ. Giao dịch được tính vào tiến trình xét hạng.',
  },
  {
    id: 'T-1023',
    kind: 'bonus',
    title: 'Thưởng chiến dịch Nhân đôi điểm cuối tuần',
    datetime: '2026-07-05T09:12:00',
    vehicle: '51K-123.45',
    partner: 'VETC',
    points: 58,
    cash: null,
    status: 'success',
    detail: 'Điểm thưởng x2 cho giao dịch ETC ngày Chủ nhật.',
  },
  {
    id: 'T-1022',
    kind: 'toll-points',
    title: 'Thanh toán phí đường bộ bằng điểm',
    datetime: '2026-07-04T08:21:00',
    vehicle: '51K-123.45',
    partner: 'Trạm Cầu Giẽ - Ninh Bình',
    points: -35_000,
    cash: 0,
    status: 'success',
    detail: 'Dùng 35.000 điểm thanh toán toàn bộ phí. Không trừ số dư tài khoản.',
  },
  {
    id: 'T-1021',
    kind: 'earn',
    title: 'Nạp tài khoản giao thông',
    datetime: '2026-07-02T20:05:00',
    vehicle: null,
    partner: 'Vietcombank',
    points: 500,
    cash: 500_000,
    status: 'success',
    detail: 'Tích điểm khuyến khích nạp qua ngân hàng liên kết.',
  },
  {
    id: 'T-1020',
    kind: 'service',
    title: 'Thanh toán bãi đỗ — Vincom Đồng Khởi',
    datetime: '2026-06-28T14:30:00',
    vehicle: '51K-123.45',
    partner: 'Bãi đỗ liên kết',
    points: 30,
    cash: 30_000,
    status: 'success',
    detail: 'Giao dịch được tính vào tiến trình xét hạng.',
  },
  {
    id: 'T-1019',
    kind: 'redeem',
    title: 'Đổi Voucher cà phê Highlands 30.000đ',
    datetime: '2026-06-25T10:15:00',
    vehicle: null,
    partner: 'Highlands Coffee',
    points: -30_000,
    cash: null,
    status: 'success',
    detail: 'Voucher đã phát hành trong mục Ưu đãi của tôi.',
  },
  {
    id: 'T-1018',
    kind: 'earn',
    title: 'Sạc xe điện — trạm V-GREEN Thảo Điền',
    datetime: '2026-06-22T19:40:00',
    vehicle: '30A-456.78',
    partner: 'V-GREEN',
    points: 240,
    cash: 120_000,
    status: 'success',
    detail: 'Tích điểm x2 theo ưu đãi dịch vụ sạc.',
  },
  {
    id: 'T-1017',
    kind: 'adjust',
    title: 'Hoàn điểm — huỷ lịch rửa xe',
    datetime: '2026-06-20T08:00:00',
    vehicle: '51K-123.45',
    partner: 'AutoSpa Quận 2',
    points: 8_000,
    cash: null,
    status: 'reversed',
    detail: 'Huỷ lịch trước 24 giờ, điểm được hoàn tự động.',
  },
  {
    id: 'T-1016',
    kind: 'service',
    title: 'Gia hạn bảo hiểm TNDS 12 tháng',
    datetime: '2026-06-15T11:22:00',
    vehicle: '30A-456.78',
    partner: 'PVI',
    points: 1_060,
    cash: 530_000,
    status: 'success',
    detail: 'Tích điểm x2 cho dịch vụ bảo hiểm. Được tính vào tiến trình xét hạng.',
  },
  {
    id: 'T-1015',
    kind: 'expire',
    title: 'Điểm hết hạn kỳ quý II/2026',
    datetime: '2026-06-30T23:59:00',
    vehicle: null,
    partner: null,
    points: -4_200,
    cash: null,
    status: 'success',
    detail: 'Điểm tích trước 30/06/2025 hết hiệu lực theo chính sách.',
  },
  {
    id: 'T-1014',
    kind: 'earn',
    title: 'Qua trạm Pháp Vân - Cầu Giẽ',
    datetime: '2026-06-12T07:55:00',
    vehicle: '51K-123.45',
    partner: 'VETC',
    points: 45,
    cash: 45_000,
    status: 'success',
    detail: 'Tích điểm phí đường bộ. Giao dịch được tính vào tiến trình xét hạng.',
  },
  {
    id: 'T-1013',
    kind: 'redeem',
    title: 'Đổi Giảm 20.000đ phí bãi đỗ',
    datetime: '2026-06-08T17:03:00',
    vehicle: null,
    partner: 'Bãi đỗ liên kết',
    points: -20_000,
    cash: null,
    status: 'success',
    detail: 'Voucher đã phát hành trong mục Ưu đãi của tôi.',
  },
  {
    id: 'T-1012',
    kind: 'service',
    title: 'Mua vé tháng tuyến HCM - Long Thành',
    datetime: '2026-06-01T09:30:00',
    vehicle: '51K-123.45',
    partner: 'VETC',
    points: 880,
    cash: 880_000,
    status: 'success',
    detail: 'Giao dịch được tính vào tiến trình xét hạng.',
  },
  {
    id: 'T-1011',
    kind: 'earn',
    title: 'Đặt lịch rửa xe — AutoSpa Quận 2',
    datetime: '2026-05-28T15:45:00',
    vehicle: '51K-123.45',
    partner: 'AutoSpa',
    points: 160,
    cash: 80_000,
    status: 'success',
    detail: 'Tích điểm dịch vụ chăm sóc xe.',
  },
  {
    id: 'T-1010',
    kind: 'tier',
    title: 'Chào mừng bạn đến hạng Bạc',
    datetime: '2026-04-01T00:00:00',
    vehicle: null,
    partner: null,
    points: 0,
    cash: null,
    status: 'success',
    detail: 'Hạng hội viên được xác nhận cho kỳ xét hạng 2026 – 2027.',
  },
];

export interface Offer {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  to: string;
  image: string;
  urgency?: string;
}

export const OFFERS: Offer[] = [
  {
    id: 'O-INS',
    tag: 'Sắp hết hạn',
    title: 'Bảo hiểm TNDS của Mazda CX-5 hết hạn 09/08',
    subtitle: 'Gia hạn ngay — nhận thêm 1.060 điểm và mã giảm 50.000đ.',
    cta: 'Gia hạn bảo hiểm',
    to: '/rewards/R-INS-50',
    image: 'shield',
    urgency: 'Còn 29 ngày',
  },
  {
    id: 'O-EV',
    tag: 'Tuần lễ EV',
    title: 'Sạc VinFast VF 8 — điểm x2 đến 17/07',
    subtitle: 'Kèm voucher sạc 50.000đ chỉ 50.000 điểm.',
    cta: 'Xem ưu đãi EV',
    to: '/rewards/R-EV-50',
    image: 'ev',
    urgency: 'Còn 6 ngày',
  },
  {
    id: 'O-X2',
    tag: 'Chiến dịch hè',
    title: 'Nhân đôi điểm phí đường bộ cuối tuần',
    subtitle: 'Đăng ký miễn phí, áp dụng mọi trạm đến 31/08.',
    cta: 'Đăng ký ngay',
    to: '/rewards/R-X2-WEEKEND',
    image: 'x2',
  },
  {
    id: 'O-TRAVEL',
    tag: 'Gợi ý cho bạn',
    title: 'Combo du lịch cuối tuần Đà Lạt',
    subtitle: 'Giảm 250.000đ khách sạn + voucher nhiên liệu.',
    cta: 'Xem chi tiết',
    to: '/rewards/R-TRAVEL-250',
    image: 'travel',
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const MEMBERSHIP_FAQ: FaqItem[] = [
  {
    q: 'Giao dịch nào được tính vào tiến trình xét hạng?',
    a: 'Phí đường bộ ETC, vé tháng/quý, bảo hiểm, cứu hộ, bảo dưỡng, bãi đỗ và giao dịch trong hệ sinh thái Tasco. Nạp tiền vào tài khoản và đổi điểm KHÔNG được tính.',
  },
  {
    q: 'Điểm VETC có phải là tiền không?',
    a: 'Không. 1 điểm có giá trị quy đổi tương đương 1đ khi thanh toán dịch vụ đủ điều kiện, nhưng không thể rút hoặc chuyển thành tiền mặt.',
  },
  {
    q: 'Khi nào hạng của tôi được xét lại?',
    a: 'Hạng được xét theo chi tiêu đủ điều kiện trong 12 tháng, kỳ xét hạng hiện tại kết thúc ngày 31/03/2027. Đạt ngưỡng sớm sẽ được nâng hạng ngay.',
  },
  {
    q: 'Điểm có hết hạn không?',
    a: 'Có. Điểm hết hạn sau 24 tháng kể từ khi tích. Ứng dụng sẽ nhắc bạn trước ít nhất 60 ngày khi có điểm sắp hết hạn.',
  },
  {
    q: 'Nếu không đủ điểm thanh toán phí đường bộ?',
    a: 'Phần còn thiếu được trừ tự động từ số dư tài khoản giao thông của bạn — chuyến đi không bị gián đoạn.',
  },
];

export const ELIGIBLE_EXAMPLES = {
  eligible: [
    'Phí đường bộ qua trạm ETC',
    'Vé tháng / vé quý',
    'Bảo hiểm TNDS & vật chất xe',
    'Gói cứu hộ giao thông',
    'Bảo dưỡng tại Tasco Auto',
    'Phí bãi đỗ liên kết',
  ],
  ineligible: [
    'Nạp tiền vào tài khoản giao thông',
    'Giao dịch bị hoàn / huỷ',
    'Đổi điểm lấy ưu đãi',
    'Phí dịch vụ ngoài hệ sinh thái',
  ],
};
