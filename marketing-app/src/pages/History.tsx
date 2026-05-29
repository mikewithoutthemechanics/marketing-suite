import { useEffect, useMemo, useState } from 'react'
import { Copy, Search } from 'lucide-react'
import { Field, Input, Panel } from '@/components/ui'
import { apiJson } from '@/lib/api'
import { copyToClipboard } from '@/lib/clipboard'
import type { StoredGeneration } from '@shared/types'

type ApiEnvelope<T> = { success: boolean; data: T }

function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

export default function History() {
  const [items, setItems] = useState<StoredGeneration[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiJson<ApiEnvelope<StoredGeneration[]>>('/api/history?limit=100')
        setItems(res.data)
        setSelectedId(res.data[0]?.id || null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load history')
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((g) => {
      const hay = [g.channel, g.goal, g.input.product, g.input.audience, g.input.offer || '', g.input.brandVoice || ''].join(' ')
      return hay.toLowerCase().includes(q)
    })
  }, [items, query])

  const selected = useMemo(() => filtered.find((g) => g.id === selectedId) || null, [filtered, selectedId])

  const selectedText = useMemo(() => {
    if (!selected) return ''
    const out = selected.output.output.variants.map((v) => `${v.title}\n${v.body}`).join('\n\n---\n\n')
    return out
  }, [selected])

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-5">
        <Panel title="History" subtitle="Saved runs. Reusable briefs.">
          <div className="space-y-4">
            <Field label="Search" hint={`${filtered.length} items`}>
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(244,239,227,0.5)]">
                  <Search size={16} />
                </div>
                <Input className="pl-11" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Goal, product, audience..." />
              </div>
            </Field>

            {error ? (
              <div className="rounded-2xl bg-[rgba(255,80,80,0.08)] px-4 py-3 text-sm text-[rgba(255,220,220,0.92)] ring-1 ring-[rgba(255,80,80,0.22)]">
                {error}
              </div>
            ) : null}

            <div className="max-h-[560px] space-y-2 overflow-auto pr-1">
              {filtered.map((g) => {
                const active = g.id === selectedId
                return (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => setSelectedId(g.id)}
                    className={[
                      'w-full rounded-2xl px-4 py-3 text-left transition',
                      'ring-1',
                      active
                        ? 'bg-[rgba(183,255,42,0.12)] ring-[var(--ring)]'
                        : 'bg-[rgba(244,239,227,0.04)] ring-[rgba(244,239,227,0.1)] hover:ring-[rgba(183,255,42,0.28)]',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-[rgba(244,239,227,0.62)]">{g.channel}</div>
                      <div className="text-[11px] text-[rgba(244,239,227,0.45)]">{formatWhen(g.createdAt)}</div>
                    </div>
                    <div className="mt-2 font-['Fraunces'] text-[15px] text-[var(--panel)]">{g.goal}</div>
                    <div className="mt-1 text-xs text-[rgba(244,239,227,0.62)]">
                      {g.input.product} · {g.input.audience}
                    </div>
                  </button>
                )
              })}

              {filtered.length === 0 ? (
                <div className="rounded-2xl bg-[rgba(244,239,227,0.03)] px-4 py-8 text-center text-sm text-[rgba(244,239,227,0.62)] ring-1 ring-[rgba(244,239,227,0.08)]">
                  No saved runs match your search.
                </div>
              ) : null}
            </div>
          </div>
        </Panel>
      </div>

      <div className="col-span-7">
        <Panel title="Details" subtitle={selected ? `${selected.output.provider.toUpperCase()} · ${selected.output.model}` : 'Select an item.'}>
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[rgba(244,239,227,0.62)]">
                  <span className="font-mono text-[11px]">{selected.id}</span> · {formatWhen(selected.createdAt)}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedText)}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition bg-[rgba(244,239,227,0.06)] text-[rgba(244,239,227,0.78)] ring-1 ring-[rgba(244,239,227,0.12)] hover:ring-[rgba(183,255,42,0.28)]"
                >
                  <Copy size={14} />
                  Copy all
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[rgba(244,239,227,0.04)] p-4 ring-1 ring-[rgba(244,239,227,0.1)]">
                  <div className="text-xs uppercase tracking-[0.16em] text-[rgba(244,239,227,0.62)]">Product</div>
                  <div className="mt-2 text-sm text-[rgba(244,239,227,0.82)]">{selected.input.product}</div>
                </div>
                <div className="rounded-2xl bg-[rgba(244,239,227,0.04)] p-4 ring-1 ring-[rgba(244,239,227,0.1)]">
                  <div className="text-xs uppercase tracking-[0.16em] text-[rgba(244,239,227,0.62)]">Audience</div>
                  <div className="mt-2 text-sm text-[rgba(244,239,227,0.82)]">{selected.input.audience}</div>
                </div>
              </div>

              <div className="space-y-3">
                {selected.output.output.variants.map((v, idx) => (
                  <div key={`${v.title}-${idx}`} className="rounded-3xl bg-[var(--panel)] text-[var(--ink)] ring-1 ring-[rgba(0,0,0,0.08)]">
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
            </div>
          ) : (
            <div className="rounded-3xl bg-[rgba(244,239,227,0.03)] px-6 py-10 text-center ring-1 ring-[rgba(244,239,227,0.08)]">
              <div className="font-['Fraunces'] text-xl text-[var(--panel)]">Pick a run on the left.</div>
              <div className="mt-2 text-sm text-[rgba(244,239,227,0.62)]">Save from Studio to populate this page.</div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
