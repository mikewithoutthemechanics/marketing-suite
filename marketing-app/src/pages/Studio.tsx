import { useEffect, useMemo, useState } from 'react'
import { Copy, Loader2, Save, Sparkles } from 'lucide-react'
import { Chip, Field, Input, Panel, TextArea } from '@/components/ui'
import { apiJson } from '@/lib/api'
import { copyToClipboard } from '@/lib/clipboard'
import type { BrandKit, Channel, GenerateRequest, GenerateResponse } from '@shared/types'

type ApiEnvelope<T> = { success: boolean; data: T }

const channels: Array<{ value: Channel; label: string }> = [
  { value: 'x', label: 'X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'landing', label: 'Landing Page' },
  { value: 'ads', label: 'Ads' },
  { value: 'instagram', label: 'Instagram' },
]

const tones: Array<NonNullable<GenerateRequest['knobs']>['tone']> = ['direct', 'playful', 'luxury', 'warm', 'technical']

const lengths: Array<NonNullable<GenerateRequest['knobs']>['length']> = ['short', 'medium', 'long']

export default function Studio() {
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null)
  const [channel, setChannel] = useState<Channel>('x')
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [offer, setOffer] = useState('')
  const [goal, setGoal] = useState('more signups')
  const [brandVoice, setBrandVoice] = useState('')
  const [language, setLanguage] = useState('English')
  const [claimSafeMode, setClaimSafeMode] = useState(false)
  const [doNotSay, setDoNotSay] = useState('')
  const [tone, setTone] = useState<NonNullable<GenerateRequest['knobs']>['tone']>('direct')
  const [length, setLength] = useState<NonNullable<GenerateRequest['knobs']>['length']>('medium')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiJson<ApiEnvelope<BrandKit | null>>('/api/brand')
        if (res.success) setBrandKit(res.data)
      } catch {
        setBrandKit(null)
      }
    })()
  }, [])

  useEffect(() => {
    if (!brandKit) return
    if (!product) setProduct(brandKit.product || '')
    if (!audience) setAudience(brandKit.audience || '')
    if (!brandVoice) setBrandVoice(brandKit.brandVoice || '')
    if (!doNotSay && brandKit.doNotSay?.length) setDoNotSay(brandKit.doNotSay.join('\n'))
    if (!claimSafeMode && brandKit.claimSafeMode) setClaimSafeMode(true)
  }, [brandKit, product, audience, brandVoice, doNotSay, claimSafeMode])

  const guardrails = useMemo(() => {
    const list = doNotSay
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    return {
      claimSafeMode,
      doNotSay: list.length ? list : undefined,
    }
  }, [doNotSay, claimSafeMode])

  async function onGenerate() {
    setBusy(true)
    setError(null)
    setSavedId(null)
    try {
      const payload: GenerateRequest = {
        channel,
        product,
        audience,
        offer: offer || undefined,
        goal,
        brandVoice: brandVoice || undefined,
        language,
        guardrails,
        knobs: { tone, length },
      }
      const res = await apiJson<ApiEnvelope<GenerateResponse>>('/api/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setResult(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  async function onSave() {
    if (!result) return
    try {
      const payload: GenerateRequest = {
        channel,
        product,
        audience,
        offer: offer || undefined,
        goal,
        brandVoice: brandVoice || undefined,
        language,
        guardrails,
        knobs: { tone, length },
      }
      const res = await apiJson<ApiEnvelope<{ id: string }>>('/api/history', {
        method: 'POST',
        body: JSON.stringify({ input: payload, output: result }),
      })
      setSavedId(res.data.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  const flatCopy = useMemo(() => {
    if (!result) return ''
    return result.output.variants.map((v) => `${v.title}\n${v.body}`).join('\n\n---\n\n')
  }, [result])

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-5">
        <Panel title="Inputs" subtitle="The brief. The constraints. The voice.">
          <div className="space-y-5">
            <Field label="Channel">
              <div className="grid grid-cols-2 gap-2">
                {channels.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setChannel(c.value)}
                    className={[
                      'rounded-2xl px-4 py-3 text-left text-sm transition',
                      'ring-1',
                      channel === c.value
                        ? 'bg-[rgba(183,255,42,0.12)] ring-[var(--ring)] text-[var(--panel)]'
                        : 'bg-[rgba(244,239,227,0.06)] ring-[rgba(244,239,227,0.12)] text-[rgba(244,239,227,0.78)] hover:ring-[rgba(183,255,42,0.28)]',
                    ].join(' ')}
                  >
                    <div className="font-medium">{c.label}</div>
                    <div className="mt-1 text-[11px] text-[rgba(244,239,227,0.5)]">Optimized format</div>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Product" hint="What is it, really?">
              <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g., AI inbox for founders" />
            </Field>

            <Field label="Audience" hint="Who is this for?">
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g., solo founders shipping weekly" />
            </Field>

            <Field label="Offer (optional)" hint="Pricing / trial / lead magnet">
              <Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="e.g., 14-day trial, no card" />
            </Field>

            <Field label="Goal" hint="One measurable outcome">
              <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g., more demos booked" />
            </Field>

            <Field label="Brand Voice" hint="Short style sentence">
              <Input value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} placeholder="e.g., sharp, playful, evidence-first" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tone">
                <div className="flex flex-wrap gap-2">
                  {tones.map((t) => (
                    <Chip key={t} active={tone === t} label={t} onClick={() => setTone(t)} />
                  ))}
                </div>
              </Field>
              <Field label="Length">
                <div className="flex flex-wrap gap-2">
                  {lengths.map((l) => (
                    <Chip key={l} active={length === l} label={l} onClick={() => setLength(l)} />
                  ))}
                </div>
              </Field>
            </div>

            <Field label="Language">
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="English" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 rounded-2xl bg-[rgba(244,239,227,0.06)] px-4 py-3 ring-1 ring-[rgba(244,239,227,0.12)]">
                <input
                  type="checkbox"
                  checked={claimSafeMode}
                  onChange={(e) => setClaimSafeMode(e.target.checked)}
                  className="h-4 w-4 accent-[var(--acid)]"
                />
                <div>
                  <div className="text-sm text-[var(--panel)]">Claim-safe</div>
                  <div className="text-[11px] text-[rgba(244,239,227,0.55)]">No guarantees / no hype</div>
                </div>
              </label>

              <div className="rounded-2xl bg-[rgba(244,239,227,0.06)] px-4 py-3 ring-1 ring-[rgba(244,239,227,0.12)]">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[rgba(244,239,227,0.62)]">Do not say</div>
                <div className="mt-2">
                  <TextArea
                    value={doNotSay}
                    onChange={(e) => setDoNotSay(e.target.value)}
                    rows={3}
                    placeholder="One per line (optional)"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onGenerate}
              disabled={busy}
              className={[
                'w-full rounded-2xl px-4 py-3 text-sm font-medium transition',
                'bg-[var(--acid)] text-[var(--ink)]',
                'hover:brightness-[0.98] active:brightness-[0.95] disabled:opacity-60 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Generate
              </span>
            </button>

            {error ? <div className="rounded-2xl bg-[rgba(255,80,80,0.08)] px-4 py-3 text-sm text-[rgba(255,220,220,0.92)] ring-1 ring-[rgba(255,80,80,0.22)]">{error}</div> : null}
          </div>
        </Panel>
      </div>

      <div className="col-span-7">
        <Panel
          title="Outputs"
          subtitle={result ? `${result.provider.toUpperCase()} · ${result.model}` : 'Generate to see variants.'}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[rgba(244,239,227,0.62)]">
                {result ? `Created ${new Date(result.createdAt).toLocaleString()}` : 'No output yet.'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => (flatCopy ? copyToClipboard(flatCopy) : null)}
                  disabled={!result}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition bg-[rgba(244,239,227,0.06)] text-[rgba(244,239,227,0.78)] ring-1 ring-[rgba(244,239,227,0.12)] hover:ring-[rgba(183,255,42,0.28)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Copy size={14} />
                  Copy all
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={!result}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition bg-[rgba(244,239,227,0.06)] text-[rgba(244,239,227,0.78)] ring-1 ring-[rgba(244,239,227,0.12)] hover:ring-[rgba(183,255,42,0.28)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            </div>

            {savedId ? (
              <div className="rounded-2xl bg-[rgba(183,255,42,0.08)] px-4 py-3 text-sm text-[rgba(244,239,227,0.92)] ring-1 ring-[rgba(183,255,42,0.2)]">
                Saved to history: <span className="font-mono text-xs">{savedId}</span>
              </div>
            ) : null}

            {result ? (
              <div className="space-y-3">
                {result.output.variants.map((v, idx) => (
                  <div
                    key={`${v.title}-${idx}`}
                    className="rounded-3xl bg-[var(--panel)] text-[var(--ink)] ring-1 ring-[rgba(0,0,0,0.08)]"
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-[rgba(0,0,0,0.08)] px-5 py-4">
                      <div className="font-['Fraunces'] text-lg leading-none">{v.title}</div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(v.body)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition bg-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.08)]"
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                    <div className="px-5 py-5">
                      <div className="whitespace-pre-wrap text-[15px] leading-6">{v.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-[rgba(244,239,227,0.03)] px-6 py-10 text-center ring-1 ring-[rgba(244,239,227,0.08)]">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(183,255,42,0.14)] ring-1 ring-[var(--ring)]">
                  <Sparkles className="text-[var(--acid)]" size={18} />
                </div>
                <div className="mt-4 font-['Fraunces'] text-xl text-[var(--panel)]">Make three versions you’d actually ship.</div>
                <div className="mt-2 text-sm text-[rgba(244,239,227,0.62)]">Fill the brief. Hit Generate. Refine with tone + length knobs.</div>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
