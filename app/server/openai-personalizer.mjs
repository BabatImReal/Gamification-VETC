const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-5';
const OPENAI_API_URL = process.env.OPENAI_API_URL ?? 'https://api.openai.com/v1/responses';

export const PERSONALIZATION_SYSTEM_PROMPT = `
You are the VETC Gamification Personalization Agent.

Your job is to recommend personalized gamification missions for a single VETC user.

You are not a general chatbot. You are a product-facing recommendation engine.

Your goals are:
1. Increase long-term engagement and retention.
2. Encourage discovery and adoption of multiple VETC services.
3. Reward positive mobility behavior, not only spending.
4. Preserve and extend the existing VETC Loyalty Program instead of replacing it.
5. Produce explainable mission recommendations that product teams can inspect.

You must use the provided user profile, activity summary, service catalog, campaign list, loyalty rules, and mission template library.

You must personalize based on:
- user segment
- engagement score
- inactivity / last active days
- loyalty points
- vehicle type and vehicle age
- ETC, wallet, parking, charging, roadside, and insurance state
- recent activity signals
- active campaign timing
- service gaps
- user interests

You must prefer missions that are:
- realistic for the user to complete now
- aligned with the required scenario
- beneficial to VETC product adoption
- safe for the loyalty economy
- easy to explain

You must avoid:
- missions that are too hard for new or inactive users
- recommending EV missions to non-EV users
- recommending advanced progression before first-value actions
- replacing deterministic reward rules with freeform guesses

You do not execute rewards or update balances.
You only rank and explain missions.

For every mission, output:
- mission id
- title
- description
- category
- campaign
- progress
- target
- xp
- loyalty points
- deadline
- related vehicle if any
- ai reason
- ai signals
- ai score
- score breakdown
- next best action

Return only data that matches the schema exactly.
`.trim();

export const PERSONALIZATION_OUTPUT_SCHEMA = {
  name: 'vetc_personalized_mission_ranking',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['recommendationSummary', 'nextBestAction', 'matchedActivityRules', 'recommendations'],
    properties: {
      recommendationSummary: { type: 'string' },
      nextBestAction: { type: 'string' },
      matchedActivityRules: {
        type: 'array',
        items: { type: 'string' },
      },
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'id',
            'title',
            'description',
            'category',
            'campaign',
            'progress',
            'target',
            'xp',
            'loyaltyPoints',
            'deadline',
            'vehicle',
            'aiReason',
            'aiSignals',
            'aiScore',
            'scoreBreakdown',
            'nextAction',
          ],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            campaign: { type: 'string' },
            progress: { type: 'integer' },
            target: { type: 'integer' },
            xp: { type: 'integer' },
            loyaltyPoints: { type: 'integer' },
            deadline: { type: 'string' },
            vehicle: {
              anyOf: [
                { type: 'string' },
                { type: 'null' },
              ],
            },
            aiReason: { type: 'string' },
            aiSignals: {
              type: 'array',
              items: { type: 'string' },
            },
            aiScore: { type: 'integer' },
            scoreBreakdown: {
              type: 'object',
              additionalProperties: false,
              required: [
                'segmentFit',
                'activityFit',
                'serviceGapFit',
                'campaignFit',
                'urgencyFit',
                'rewardAffinityFit',
                'frictionPenalty',
              ],
              properties: {
                segmentFit: { type: 'integer' },
                activityFit: { type: 'integer' },
                serviceGapFit: { type: 'integer' },
                campaignFit: { type: 'integer' },
                urgencyFit: { type: 'integer' },
                rewardAffinityFit: { type: 'integer' },
                frictionPenalty: { type: 'integer' },
              },
            },
            nextAction: { type: 'string' },
          },
        },
      },
    },
  },
};

export async function rankMissionsWithOpenAI({
  apiKey,
  profile,
  activitySummary,
  services,
  campaigns,
  rewards,
  missionTemplates,
  activityRules,
  scoringFormula,
}) {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for OpenAI-powered personalization.');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: PERSONALIZATION_SYSTEM_PROMPT,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify({
                today: '2026-07-11',
                task: 'Rank personalized VETC missions for this user and return the best missions only.',
                scoringFormula,
                profile,
                activitySummary,
                services,
                campaigns,
                rewards,
                missionTemplates,
                activityRules,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          ...PERSONALIZATION_OUTPUT_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${body}`);
  }

  const payload = await response.json();
  const content = payload.output?.[0]?.content?.[0];
  if (!content) {
    throw new Error('OpenAI response did not include structured output content.');
  }

  if (content.type === 'output_text') {
    return JSON.parse(content.text);
  }

  if (content.type === 'refusal') {
    throw new Error(`OpenAI refusal: ${content.refusal}`);
  }

  throw new Error('Unsupported OpenAI response content type.');
}
