# VETC Loyalty Mini App Clone

Mobile-first Vite + React + TypeScript prototype for a VETC Loyalty mini app.

## Scope

- Vietnamese UI, optimized around a 390px mobile viewport.
- Loyalty marketplace: rewards list, filters, sort, reward detail, confirmation sheet, voucher success state, and “Ưu đãi của tôi”.
- Membership: tier card, tier comparison, benefits, eligible-spending rules, FAQ.
- Activity ledger: filterable point/cash/tier history with detail sheets.
- Services: VETC/Tasco service discovery across ETC, wallet, insurance, roadside, parking, EV charging, car care, maintenance, travel, and parts.
- Account: eKYC, linked bank, 2 vehicles, balances, settings.
- Track 3 gamification layer: AI-recommended missions, campaigns, XP, streaks, badges, community progress, next-best-action explanations, and mission completion rewards.
- SDK adapter: `src/sdk/miniapp.ts` mimics the VETC mini-app runtime surface for auth, payment, events, sharing, phone, and exit.

## Demo data anchors

- `86.400 điểm` Loyalty balance.
- `1.250.000đ` traffic account balance.
- `21,5M / 40M` tier-spending progress with “Còn 18.500.000đ để lên hạng Vàng”.
- Expiring-points alert.
- Mazda CX-5 and VinFast VF 8 vehicle switcher.
- Points, cash balance, and tier-eligible spending are intentionally displayed as separate concepts.

## Development

```bash
npm install
npm run dev
npm run build
```

## Verification

```bash
npm run build
```

The build runs TypeScript project references and a production Vite bundle.
