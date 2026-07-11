/**
 * Thin adapter mimicking the `@vetc-miniapp/apis` surface (vetc_mini_app_V.0.1.pdf).
 * In the real VETC shell this file is replaced by `import MiniApp from '@vetc-miniapp/apis'`.
 * Standalone (browser demo) it resolves against local mocks so every call site
 * is already written against the production contract.
 */

type Result<T = undefined> = { ok: boolean; data?: T };

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

const MiniApp = {
  async getAuthCode(): Promise<Result<{ authCode: string; scopes: string[] }>> {
    await delay();
    return { ok: true, data: { authCode: 'mock-auth-code', scopes: ['openid', 'profile'] } };
  },

  async getUserInfo(): Promise<Result<{ uid: string; name: string }>> {
    await delay();
    return { ok: true, data: { uid: 'U001', name: 'Nguyễn Minh Anh' } };
  },

  /** Client side of the payment flow; signature comes from the mini-app backend. */
  async initPayment(params: {
    merchantOrderId: string;
    merchantService: string;
    amount: number;
    productName: string;
    onResult?: (res: { status: string }) => void;
  }): Promise<Result> {
    await delay(400);
    params.onResult?.({ status: 'SUCCEEDED' });
    return { ok: true };
  },

  /** Analytics per the SDK event taxonomy (loyalty/referral fields supported). */
  async pushEvent(eventName: string, properties?: Record<string, unknown>): Promise<Result> {
    if (import.meta.env.DEV) console.debug('[pushEvent]', eventName, properties ?? {});
    return { ok: true };
  },

  async shareApp(): Promise<Result> {
    await delay();
    return { ok: true };
  },

  async openTel(phone: string): Promise<Result> {
    window.location.href = `tel:${phone}`;
    return { ok: true };
  },

  async exitMiniApp(): Promise<Result> {
    return { ok: true };
  },
};

export default MiniApp;
