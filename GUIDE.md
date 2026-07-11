# VETC Loyalty Mini App

Mobile-first VETC Loyalty mini-app prototype built with Vite, React, and TypeScript.

The current priority is backend-first app correctness. Gamification is present as a prototype layer, but the core foundation is now a local backend boundary that mirrors the VETC MiniApp/Auth/Payment PDF architecture.

## What is implemented

- Vietnamese mobile UI optimized around a 390px viewport.
- Home dashboard with distinct Loyalty points, traffic account balance, and tier-spending progress.
- Rewards marketplace with filters, sorting, detail page, confirmation sheet, backend-backed redemption, voucher success state, and “Ưu đãi của tôi”.
- Membership page with tier comparison, benefits, eligible-spending rules, and FAQ.
- Activity ledger with filterable records and detail sheets.
- Services page with backend-backed service activation.
- Account page with eKYC, linked bank, two vehicles, balances, and settings.
- Local mock backend for app functionality:
  - auth-code exchange
  - protected bootstrap
  - user/profile/vehicles
  - loyalty balance
  - rewards/redemptions
  - activity
  - services/activation
  - campaigns
  - mission completion
  - payment init/detail/refund
  - IPN receiver
- SDK adapter at `app/src/sdk/miniapp.ts` that mimics `@vetc-miniapp/apis` for local development.

## Backend-first architecture

The root PDFs imply this split:

1. MiniApp frontend calls `MiniApp.getAuthCode()`.
2. MiniApp backend exchanges that auth code for user tokens.
3. Frontend uses the backend session for app data and business mutations.
4. Backend initializes payments and returns provider payload/signature.
5. Frontend calls `MiniApp.initPayment(...)` with backend-generated payment data.
6. Backend owns payment detail, refund, and IPN/webhook handling.

Local implementation:

- Backend: `app/server/mock-backend.mjs`
- Frontend API client: `app/src/api/client.ts`
- App state integration: `app/src/state/AppState.tsx`
- Vite proxy: `/api -> http://127.0.0.1:5174`

## What is still mocked

- Real VETC OAuth credentials and token exchange.
- Real database/persistence.
- Real payment signature generation and verification.
- Real IPN HMAC verification.
- Real partner reward inventory.
- Real service activation side effects.
- Real AI recommendation engine.

Restarting the mock backend resets state to the initial demo data.

## Demo data anchors

- Loyalty balance: `86.400 điểm`
- Traffic account balance: `1.250.000đ`
- Tier progress: `21,5M / 40M`
- Upgrade copy: `Còn 18.500.000đ để lên hạng Vàng`
- Expiring points alert
- Vehicles:
  - Mazda CX-5, `51K-123.45`
  - VinFast VF 8, `30A-456.78`

Points, traffic-account cash, and tier-eligible spending are intentionally separate concepts throughout the UI.

## Run locally

Open two terminals.

Terminal 1:

```bash
cd app
npm install
npm run backend
```

Terminal 2:

```bash
cd app
npm run dev
```

Then open the Vite URL, usually:

```text
http://127.0.0.1:5173
```

If running with the explicit port used during verification:

```bash
npm run dev -- --host 127.0.0.1 --port 5199
```

## Verification

```bash
cd app
npm run build
npm run lint
```

Known lint note: `AppState.tsx` currently emits React Fast Refresh warnings because it exports helper functions alongside the provider component. This is not a runtime failure.

## Backend smoke test

With `npm run backend` running:

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:5174/api/auth/exchange \
  -H 'Content-Type: application/json' \
  -d '{"authCode":"mock-auth-code"}' \
  | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).access_token))")

curl -s http://127.0.0.1:5174/api/bootstrap \
  -H "Authorization: Bearer $TOKEN"
```

Expected result: JSON envelope with `code: "00"` and app data.

## Production backend work remaining

- Replace mock auth with VETC OAuth2 backend calls:
  - client credentials token
  - auth-code exchange
  - refresh token
  - user info
- Add persistent storage for users, vehicles, balances, activity, redemptions, services, payments, and idempotency keys.
- Implement signed payment initialization using real gateway credentials.
- Verify IPN signatures and replay-protection headers.
- Add backend validation for reward availability, tier eligibility, point balance, expiration, and redemption limits.
- Add structured logging, trace/request IDs, and error taxonomy aligned with the PDFs.
- Add automated backend tests before connecting production endpoints.
