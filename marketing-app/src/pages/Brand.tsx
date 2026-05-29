import { useEffect, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { Field, Input, Panel, TextArea } from '@/components/ui'
import { apiJson } from '@/lib/api'
import type { BrandKit } from '@shared/types'

type ApiEnvelope<T> = { success: boolean; data: T }

export default function Brand() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [brandVoice, setBrandVoice] = useState('')
  const [doNotSay, setDoNotSay] = useState('')
  const [claimSafeMode, setClaimSafeMode] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiJson<ApiEnvelope<BrandKit | null>>('/api/brand')
        const kit = res.data
        if (!kit) return
        setProduct(kit.product || '')
        setAudience(kit.audience || '')
        setBrandVoice(kit.brandVoice || '')
        setDoNotSay(kit.doNotSay?.join('\n') || '')
        setClaimSafeMode(!!kit.claimSafeMode)
      } catch {
        setError(null)
      }
    })()
  }, [])

  const parsedDoNotSay = useMemo(() => {
    const items = doNotSay
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    return items.length ? items : undefined
  }, [doNotSay])

  async function onSave() {
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      const payload: BrandKit = {
        product,
        audience,
        brandVoice: brandVoice || undefined,
        doNotSay: parsedDoNotSay,
        claimSafeMode,
      }
      const res = await apiJson<ApiEnvelope<BrandKit>>('/api/brand', { method: 'PUT', body: JSON.stringify(payload) })
      setOk(`Saved ${new Date(res.data.updatedAt || Date.now()).toLocaleString()}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-7">
        <Panel title="Brand Kit" subtitle="Defaults applied to every generation unless overridden.">
          <div className="space-y-5">
            <Field label="Product">
              <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g., AI inbox for founders" />
            </Field>
            <Field label="Audience">
              <Input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., solo founders shipping weekly"
              />
            </Field>
            <Field label="Brand Voice" hint="One sentence style anchor">
              <Input
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                placeholder="e.g., sharp, playful, evidence-first"
              />
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
                  <div className="text-sm text-[var(--panel)]">Claim-safe by default</div>
                  <div className="text-[11px] text-[rgba(244,239,227,0.55)]">Avoid guarantees + hype</div>
                </div>
              </label>

              <div className="rounded-2xl bg-[rgba(244,239,227,0.06)] px-4 py-3 ring-1 ring-[rgba(244,239,227,0.12)]">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[rgba(244,239,227,0.62)]">Do not say</div>
                <div className="mt-2">
                  <TextArea value={doNotSay} onChange={(e) => setDoNotSay(e.target.value)} rows={4} placeholder="One per line" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className={[
                'w-full rounded-2xl px-4 py-3 text-sm font-medium transition',
                'bg-[var(--acid)] text-[var(--ink)]',
                'hover:brightness-[0.98] active:brightness-[0.95] disabled:opacity-60 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Save size={16} />
                Save Brand Kit
              </span>
            </button>

            {ok ? (
              <div className="rounded-2xl bg-[rgba(183,255,42,0.08)] px-4 py-3 text-sm text-[rgba(244,239,227,0.92)] ring-1 ring-[rgba(183,255,42,0.2)]">
                {ok}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-2xl bg-[rgba(255,80,80,0.08)] px-4 py-3 text-sm text-[rgba(255,220,220,0.92)] ring-1 ring-[rgba(255,80,80,0.22)]">
                {error}
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      <div className="col-span-5">
        <Panel title="How it applies" subtitle="Studio pulls these defaults when inputs are blank.">
          <div className="space-y-4 text-sm text-[rgba(244,239,227,0.7)]">
            <div className="rounded-2xl bg-[rgba(244,239,227,0.04)] p-4 ring-1 ring-[rgba(244,239,227,0.1)]">
              <div className="font-['Fraunces'] text-base text-[var(--panel)]">Consistency</div>
              <div className="mt-1">Use Brand Kit to keep tone stable while generating dozens of assets.</div>
            </div>
            <div className="rounded-2xl bg-[rgba(244,239,227,0.04)] p-4 ring-1 ring-[rgba(244,239,227,0.1)]">
              <div className="font-['Fraunces'] text-base text-[var(--panel)]">Guardrails</div>
              <div className="mt-1">Claim-safe + “do not say” phrases reduce compliance risk on autopilot.</div>
            </div>
            <div className="rounded-2xl bg-[rgba(244,239,227,0.04)] p-4 ring-1 ring-[rgba(244,239,227,0.1)]">
              <div className="font-['Fraunces'] text-base text-[var(--panel)]">Speed</div>
              <div className="mt-1">Set it once, then iterate in Studio with only goal + offer changes.</div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

