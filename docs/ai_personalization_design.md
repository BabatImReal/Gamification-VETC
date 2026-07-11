# AI Personalization Design

This document turns the VETC gamification logic into an explicit system design grounded in the provided PDFs:

- `User Profiles`
- `User Personas`
- `User Activity`
- `Existing Services`
- `Current Campaigns`
- `Existing Loyalty Rewards`
- `Public Evaluation`

## Goal

Generate personalized missions that:

- match the user scenario
- fit real user behavior
- increase service adoption
- preserve the existing Loyalty Program
- recommend the next best action
- stay explainable in a live demo

## Personalization pipeline

1. Read user profile features
2. Read recent activity signals
3. Detect user scenario and service gaps
4. Filter eligible mission templates
5. Score each eligible template
6. Return top missions with explanation signals
7. Update ranking after mission completion

## User feature schema

The profile schema should include four groups of signals.

### 1. Identity and segment

- `id`
- `city`
- `ageGroup`
- `segment`
- `preferredChannel`

### 2. Vehicle and safety context

- `vehicleType`
- `vehicleAgeYears`
- `roadsideEnabled`
- `insuranceStatus`

### 3. Usage and engagement context

- `etcUsage`
- `walletUsage`
- `parkingUsage`
- `chargingUsage`
- `engagementScore`
- `lastActiveDays`
- `loyaltyPoints`
- `interests`

### 4. Activity evidence

- `walletTopups`
- `referralShares`
- `logins`
- `etcTrips`
- `parkingPayments`
- `carWashBookings`
- `evCharges`
- `insuranceViews`
- `roadsideViews`
- `rewardRedemptions`

## Mission template schema

Each mission should be treated as a template, not hardcoded to one user.

- `templateId`
- `scenario`
- `objective`
- `category`
- `eligibility`
- `scoringSignals`
- `progressLogic`
- `nextActionLogic`
- `rewardPolicy`
- `explanationPolicy`

## Scenario mapping

### New User Onboarding

Primary inputs:
- `segment = New User`
- `etcUsage = Mới đăng ký`
- low loyalty
- low activity

Mission style:
- profile completion
- link vehicle
- top up wallet
- try first service

### Daily Engagement

Primary inputs:
- frequent ETC
- some wallet or parking behavior
- low or medium weekly return habit

Mission style:
- weekly streak
- ETC + wallet + parking loop
- short repeatable missions

### Service Discovery

Primary inputs:
- strong ETC usage
- weak or no usage in Parking, Roadside, Insurance, Maintenance

Mission style:
- try one new service
- complete first action in that service
- cross-service quest

### Long-Term Progression

Primary inputs:
- high engagement
- high loyalty points
- multi-service potential

Mission style:
- longer milestones
- advanced badges
- multi-action challenges
- rare progression rewards

### Referral Growth

Primary inputs:
- high engagement
- prior referral shares
- strong loyalty

Mission style:
- share referral
- convert referral
- unlock social badge or bonus

### Personalized Challenges

Primary inputs:
- user interests
- segment
- activity evidence
- active campaigns

Mission style:
- EV mission for EV users
- safety mission for older vehicles / no roadside
- family trip missions for family segments
- business utility missions for business travelers

## Activity-to-mission rules

### Wallet behavior

If `walletTopups > 0`:
- boost wallet streak missions
- boost cashback loops

If `walletUsage` is low:
- boost wallet onboarding missions

### Parking behavior

If `parkingPayments = 0` and `parkingUsage` is low:
- boost Parking cross-sell mission

If `parkingUsage` is high:
- boost commuter convenience mission

### Insurance behavior

If `insuranceViews > 0` and `insuranceStatus` is `Expiring soon` or `No`:
- boost insurance conversion mission
- boost safety mission

### Roadside behavior

If `roadsideViews > 0` and `roadsideEnabled = false`:
- boost roadside activation mission

If `vehicleAgeYears >= 8`:
- increase roadside urgency

### EV behavior

If `vehicleType = EV` or `evCharges > 0`:
- boost EV mission templates
- boost charger discovery

### Referral behavior

If `referralShares > 0`:
- boost referral sprint
- shift next action from share to convert

### Reward behavior

If `rewardRedemptions > 0`:
- user is reward-responsive
- boost missions with visible short-term value

## Scoring logic

Recommended formula:

`missionScore = segmentFit + activityFit + serviceGapFit + campaignFit + urgencyFit + rewardAffinityFit - frictionPenalty`

### segmentFit

Does this mission match the persona from the profile PDF?

### activityFit

Does the activity log show the user can realistically perform the mission?

### serviceGapFit

Does the mission move the user into an unused or underused service?

### campaignFit

Does a current campaign increase relevance right now?

### urgencyFit

Is there a time-sensitive reason to act now?

Examples:
- insurance expiring soon
- 28 days inactive
- EV Week active

### rewardAffinityFit

Does the user respond to this kind of reward or progression?

### frictionPenalty

Reduce score when the mission is too difficult for the user’s current state.

Examples:
- long challenge for inactive user
- advanced progression for new user
- multi-step conversion before first-value action

## Example outcomes from the mock dataset

### U005 / U017

Signals:
- New User
- low engagement
- low loyalty
- little service usage

Recommended missions:
- onboarding 7-day path
- first wallet top-up
- first service activation

### U003

Signals:
- Inactive User
- 32 days inactive
- low engagement

Recommended missions:
- quick comeback mission
- low-friction reward mission
- then service discovery

### U010 / U016 / U025

Signals:
- EV users
- charging interest or behavior

Recommended missions:
- EV Week challenge
- charger discovery
- EV-specific rewards

### U022

Signals:
- Safety Focused
- vehicle age 11
- roadside not enabled

Recommended missions:
- roadside activation
- insurance / maintenance mission
- responsible mobility mission

### U008

Signals:
- High Loyalty User
- high engagement
- high loyalty points

Recommended missions:
- long-term progression challenge
- premium or referral missions
- rare badge path

## Implementation note

The current explicit schema and template library live in:

- [app/server/personalization-spec.mjs](/Users/Ben Nguyen/Gamification/Gamification-VETC/app/server/personalization-spec.mjs)

The current runtime ranker lives in:

- [app/server/mock-backend.mjs](/Users/Ben Nguyen/Gamification/Gamification-VETC/app/server/mock-backend.mjs)

The important design split is:

- AI decides `which mission is best for this user now`
- deterministic app rules decide `how mission progress and rewards are executed`
