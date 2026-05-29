export type Channel = 'x' | 'linkedin' | 'email' | 'landing' | 'ads' | 'instagram'

export type BrandKit = {
  product: string
  audience: string
  brandVoice?: string
  doNotSay?: string[]
  claimSafeMode?: boolean
  updatedAt?: string
}

export type GenerateKnobs = {
  length?: 'short' | 'medium' | 'long'
  tone?: 'direct' | 'playful' | 'luxury' | 'warm' | 'technical'
}

export type GenerateRequest = {
  channel: Channel
  product: string
  audience: string
  offer?: string
  goal: string
  brandVoice?: string
  language?: string
  guardrails?: {
    doNotSay?: string[]
    claimSafeMode?: boolean
  }
  knobs?: GenerateKnobs
}

export type GenerationOutput = {
  variants: Array<{ title: string; body: string }>
  extras?: Record<string, unknown>
  raw?: string
}

export type GenerateResponse = {
  provider: 'groq' | 'stub'
  model: string
  createdAt: string
  output: GenerationOutput
}

export type StoredGeneration = {
  id: string
  channel: Channel
  goal: string
  input: GenerateRequest
  output: GenerateResponse
  createdAt: string
}

