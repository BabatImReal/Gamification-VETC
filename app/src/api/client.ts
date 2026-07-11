import type { ActivityRecord, Mission, Redemption, Reward, Service, User, Vehicle } from '../data/mock';

interface ApiEnvelope<T> {
  code?: string;
  message?: string;
  data: T;
}

export interface LoyaltySnapshot {
  pointsBalance: number;
  cashBalance: number;
  tier: User['tier'];
  eligibleSpending: number;
  expiringPoints: User['expiringPoints'];
}

export interface BootstrapPayload {
  user: User;
  vehicles: Vehicle[];
  rewards: Reward[];
  services: Service[];
  campaigns: Array<{ id: string; name: string; startDate: string; endDate: string }>;
  missions: Mission[];
  activity: ActivityRecord[];
  redemptions: Redemption[];
  loyalty: LoyaltySnapshot;
}

export interface RedeemPayload {
  redemption: Redemption;
  loyalty: LoyaltySnapshot;
  activity: ActivityRecord[];
}

export interface ActivateServicePayload {
  service: Service & { status?: string };
  activity: ActivityRecord[];
}

export interface CompleteMissionPayload {
  mission: Mission;
  missions: Mission[];
  loyalty: LoyaltySnapshot;
  activity: ActivityRecord[];
}

export interface DemoProfileSummary {
  id: string;
  label: string;
  segment: string;
  engagementScore: number;
  lastActiveDays: number;
}

export interface RecommendationPayload {
  profile: {
    id: string;
    label: string;
    name: string;
    segment: string;
    city: string;
    vehicleType: string;
    interests: string[];
    engagementScore: number;
    lastActiveDays: number;
    loyaltyPoints: number;
    preferredChannel: string;
  };
  profiles: DemoProfileSummary[];
  recommendations: Mission[];
  nextBestAction: string;
  recommendationSummary: string;
  personalizationMeta?: {
    scoringFormula: string;
    matchedActivityRules: string[];
    mode?: string;
  };
}

export interface RecommendationHistorySnapshot {
  id: number;
  profileId: string;
  createdAt: string;
  mode: string;
  nextBestAction: string;
  recommendationSummary: string;
  profile: RecommendationPayload['profile'];
  recommendations: Mission[];
  personalizationMeta?: RecommendationPayload['personalizationMeta'];
}

export interface RecommendationHistoryPayload {
  profileId: string;
  snapshots: RecommendationHistorySnapshot[];
}

export interface PaymentInitPayload {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  provider_payload: Record<string, unknown>;
}

let accessToken: string | null = null;

function idempotencyKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Trace-ID', `trace-${Date.now()}`);
  headers.set('X-Request-ID', `req-${Math.random().toString(36).slice(2)}`);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(path, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = typeof body?.message === 'string' ? body.message : `HTTP ${res.status}`;
    throw new Error(message);
  }

  return body as T;
}

export const api = {
  async ensureSession(authCode = 'mock-auth-code') {
    if (accessToken) return accessToken;
    const body = await request<{ access_token: string }>('/api/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ authCode }),
    });
    accessToken = body.access_token;
    return accessToken;
  },

  async bootstrap(authCode?: string) {
    await this.ensureSession(authCode);
    const body = await request<ApiEnvelope<BootstrapPayload>>('/api/bootstrap');
    return body.data;
  },

  async redeemReward(rewardId: string, vehicleId: string) {
    await this.ensureSession();
    const body = await request<ApiEnvelope<RedeemPayload>>('/api/rewards/redeem', {
      method: 'POST',
      headers: { IdempotencyKey: idempotencyKey('redeem') },
      body: JSON.stringify({ rewardId, vehicleId }),
    });
    return body.data;
  },

  async activateService(serviceId: string) {
    await this.ensureSession();
    const body = await request<ApiEnvelope<ActivateServicePayload>>(`/api/services/${serviceId}/activate`, {
      method: 'POST',
      headers: { IdempotencyKey: idempotencyKey('service') },
    });
    return body.data;
  },

  async completeMission(missionId: string, profileId?: string) {
    await this.ensureSession();
    const body = await request<ApiEnvelope<CompleteMissionPayload>>('/api/missions/complete', {
      method: 'POST',
      headers: { IdempotencyKey: idempotencyKey('mission') },
      body: JSON.stringify({ missionId, profileId }),
    });
    return body.data;
  },

  async getRecommendations(profileId: string) {
    await this.ensureSession();
    const body = await request<ApiEnvelope<RecommendationPayload>>(`/api/gamification/recommendations?profileId=${encodeURIComponent(profileId)}`);
    return body.data;
  },

  async getRecommendationHistory(profileId: string, limit = 10) {
    await this.ensureSession();
    const body = await request<ApiEnvelope<RecommendationHistoryPayload>>(
      `/api/gamification/recommendations/history?profileId=${encodeURIComponent(profileId)}&limit=${encodeURIComponent(String(limit))}`,
    );
    return body.data;
  },

  async initPayment(params: {
    orderId: string;
    amount: number;
    productName: string;
    merchantService: string;
    providerName?: string;
  }) {
    await this.ensureSession();
    const body = await request<ApiEnvelope<PaymentInitPayload>>('/api/payments', {
      method: 'POST',
      headers: { IdempotencyKey: idempotencyKey('payment') },
      body: JSON.stringify({
        terminal_id: 'com.vetc.loyalty',
        order_id: params.orderId,
        amount: params.amount,
        description: params.productName,
        metadata: {
          provider_name: params.providerName ?? 'VETC',
          service_name: 'VETC Loyalty',
          product_code: params.merchantService,
          product_name: params.productName,
          merchant_service: params.merchantService,
          ipn_url: '/api/ipn',
        },
      }),
    });
    return body.data;
  },
};
