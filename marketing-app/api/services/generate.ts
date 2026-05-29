import type { BrandKit, GenerateRequest, GenerateResponse, GenerationOutput } from '../../shared/types.js'
import { groqChat } from './groq.js'

function channelSpec(channel: GenerateRequest['channel']) {
  switch (channel) {
    case 'x':
      return { name: 'X (Twitter)', format: '1 punchy post + 2 alternates', extras: ['hashtags'] }
    case 'linkedin':
      return { name: 'LinkedIn', format: '1 structured post + 2 alternates', extras: [] }
    case 'email':
      return { name: 'Email', format: '3 subject lines + 2 body variants', extras: ['subjectLines'] }
    case 'landing':
      return { name: 'Landing Page', format: 'headline + subhead + bullets + CTA', extras: [] }
    case 'ads':
      return { name: 'Ads', format: '3 primary texts + 5 headlines + 5 descriptions', extras: ['headlines', 'descriptions'] }
    case 'instagram':
      return { name: 'Instagram', format: 'caption + hooks + CTA', extras: ['hashtags'] }
  }
}

function buildPrompt(input: GenerateRequest) {
  const spec = channelSpec(input.channel)
  const language = input.language || 'English'
  const doNotSay = input.guardrails?.doNotSay?.length ? input.guardrails.doNotSay : []
  const claimSafeMode = !!input.guardrails?.claimSafeMode
  const knobs = input.knobs || {}

  const constraints = [
    `Language: ${language}.`,
    `Channel: ${spec.name}.`,
    `Output should be ${spec.format}.`,
    claimSafeMode ? 'Avoid unverified claims, superlatives, and guarantees.' : '',
    doNotSay.length ? `Never use these phrases: ${doNotSay.map((s) => JSON.stringify(s)).join(', ')}.` : '',
    knobs.length ? `Length: ${knobs.length}.` : '',
    knobs.tone ? `Tone: ${knobs.tone}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const offerLine = input.offer ? `Offer: ${input.offer}` : ''

  return {
    system: `You are a senior conversion copywriter and creative strategist. Return only valid JSON (no markdown).`,
    user: [
      constraints,
      `Product: ${input.product}`,
      `Audience: ${input.audience}`,
      offerLine,
      `Goal: ${input.goal}`,
      input.brandVoice ? `Brand voice: ${input.brandVoice}` : '',
      `Return JSON with shape: {"variants":[{"title":string,"body":string}], "extras": object}. Provide 3 strong variants.`,
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

function stubOutput(input: GenerateRequest): GenerateResponse {
  const createdAt = new Date().toISOString()
  const variants = [
    { title: 'Direct', body: `${input.product}: a faster path to ${input.goal} for ${input.audience}.` },
    { title: 'Story', body: `I watched ${input.audience} struggle with ${input.goal} until ${input.product} changed the workflow.` },
    { title: 'Aspirational', body: `Imagine ${input.audience} hitting ${input.goal} without the usual friction. That’s ${input.product}.` },
  ]
  return { provider: 'stub', model: 'stub', createdAt, output: { variants } }
}

export async function generateMarketingCopy(input: GenerateRequest, brandKit?: BrandKit | null): Promise<GenerateResponse> {
  const merged: GenerateRequest = {
    ...input,
    product: input.product || brandKit?.product || '',
    audience: input.audience || brandKit?.audience || '',
    brandVoice: input.brandVoice || brandKit?.brandVoice,
    guardrails: {
      doNotSay: input.guardrails?.doNotSay ?? brandKit?.doNotSay,
      claimSafeMode: input.guardrails?.claimSafeMode ?? brandKit?.claimSafeMode,
    },
  }

  if (!merged.product || !merged.audience || !merged.goal || !merged.channel) {
    return stubOutput(input)
  }

  const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile'
  const createdAt = new Date().toISOString()

  try {
    const prompt = buildPrompt(merged)
    const raw = await groqChat({
      model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
    })

    let parsed: { variants?: Array<{ title?: unknown; body?: unknown }>; extras?: Record<string, unknown> } | null = null
    try {
      parsed = JSON.parse(raw) as { variants?: Array<{ title?: unknown; body?: unknown }>; extras?: Record<string, unknown> }
    } catch {
      parsed = null
    }

    const variants =
      parsed?.variants?.length
        ? parsed.variants
            .map((v, idx) => ({
              title: typeof v.title === 'string' && v.title.trim() ? v.title : `Variant ${idx + 1}`,
              body: typeof v.body === 'string' ? v.body : '',
            }))
            .filter((v) => v.body.trim())
        : []

    const output: GenerationOutput =
      variants.length > 0
        ? { variants, extras: parsed?.extras, raw }
        : { variants: [{ title: 'Draft', body: raw }], raw }

    return { provider: 'groq', model, createdAt, output }
  } catch {
    return stubOutput(merged)
  }
}

