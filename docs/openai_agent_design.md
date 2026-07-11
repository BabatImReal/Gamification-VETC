# OpenAI Agent Design

This is the production upgrade path for replacing the current deterministic mission ranker with an OpenAI-powered personalization agent.

## What should stay deterministic

Do not hand control of everything to the model.

Keep these parts deterministic:

- reward issuance
- progress counting
- eligibility safety checks
- loyalty balance changes
- service activation side effects
- anti-abuse rules

The OpenAI agent should decide:

- which mission templates best fit the current user
- which service should be recommended next
- which mission should appear first
- how to explain the recommendation
- how to break down the score in a product-readable way

## Recommended OpenAI architecture

### 1. Input assembly layer

Backend gathers:

- user profile from the profile dataset
- activity summary from the activity dataset
- campaign context
- existing services
- existing rewards
- mission template library
- activity signal rules
- scoring formula and guardrails

### 2. OpenAI ranking layer

Use the OpenAI Responses API with:

- a strong system prompt
- structured output
- strict JSON schema

This is important because the agent is not writing prose for a human. It is returning machine-usable mission recommendations.

### 3. Deterministic runtime layer

The app receives:

- ranked missions
- score explanations
- next-best action

Then the app still handles:

- completion
- reward issuance
- XP / Loyalty accounting
- activity log updates

## Why the system prompt matters

The system prompt is the policy of the personalization engine.

Without a strong prompt, the model may:

- invent missions outside the VETC ecosystem
- suggest missions that do not match the user state
- collapse into generic point farming
- ignore service gaps
- ignore loyalty integration
- output text that does not fit the runtime contract

The prompt must explicitly constrain the agent to:

- use VETC services and campaigns
- optimize for the official scenarios
- prefer realistic missions
- preserve the Loyalty Program
- stay explainable
- return strict structured output

## Recommended system prompt structure

1. Role
2. Product goals
3. Allowed inputs
4. Required personalization criteria
5. Hard constraints
6. Output requirements
7. Failure modes to avoid

The actual prompt used in this repo lives in:

- [app/server/openai-personalizer.mjs](/Users/Ben Nguyen/Gamification/Gamification-VETC/app/server/openai-personalizer.mjs)

## Suggested OpenAI usage pattern

Use one primary request per recommendation cycle:

- model receives profile + activity + templates
- model returns ranked missions as JSON

Do not let the model freeform-generate rewards or mutate balances.

## Why Structured Outputs should be used

OpenAI’s docs support structured JSON outputs and strict schemas, which is the right fit here because the result must feed a deterministic app flow rather than a loose chat UI.

Relevant official docs:

- Function calling: https://developers.openai.com/api/docs/guides/function-calling
- Structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Responses API: https://platform.openai.com/docs/api-reference/responses

## Recommended production modes

### Mode 1: deterministic ranker

Used for:

- local demo stability
- fallback mode
- regression testing

### Mode 2: OpenAI ranker

Used for:

- production-like AI personalization
- richer reasoning
- more flexible ranking
- personalized explanations

The backend should be able to switch between the two using an env var, for example:

- `PERSONALIZATION_MODE=rules`
- `PERSONALIZATION_MODE=openai`

## Prompting guidance for this use case

The prompt should instruct the model to:

- treat user segment as the first scenario anchor
- use activity evidence as proof of likely completion
- detect service gaps and rank discovery missions when useful
- penalize friction for new and inactive users
- surface safety missions when insurance / roadside is missing
- prefer EV missions only for EV users
- preserve long-term progression for high loyalty users

## What “real AI” means here

In this product, “real AI” does not mean the model controls everything.

It means:

- the model is the reasoning and ranking layer
- the app remains the source of truth for operations

That is the correct engineering split for a gamification product with rewards and progression.
