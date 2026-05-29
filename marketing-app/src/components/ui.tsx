import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

export function Chip(props: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        'rounded-full px-3 py-1 text-xs transition',
        'border',
        props.active
          ? 'bg-[var(--acid)] text-[var(--ink)] border-[rgba(0,0,0,0.18)]'
          : 'bg-[rgba(244,239,227,0.05)] text-[rgba(244,239,227,0.75)] border-[rgba(244,239,227,0.12)] hover:border-[rgba(183,255,42,0.28)] hover:text-[var(--panel)]',
      ].join(' ')}
    >
      {props.label}
    </button>
  )
}

export function Panel(props: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-[rgba(244,239,227,0.05)] ring-1 ring-[rgba(244,239,227,0.1)] backdrop-blur">
      <div className="border-b border-[rgba(244,239,227,0.1)] px-5 py-4">
        <div className="font-['Fraunces'] text-lg text-[var(--panel)]">{props.title}</div>
        {props.subtitle ? <div className="mt-1 text-xs text-[rgba(244,239,227,0.62)]">{props.subtitle}</div> : null}
      </div>
      <div className="px-5 py-5">{props.children}</div>
    </section>
  )
}

export function Field(props: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-end justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.16em] text-[rgba(244,239,227,0.62)]">{props.label}</div>
        {props.hint ? <div className="text-[11px] text-[rgba(244,239,227,0.45)]">{props.hint}</div> : null}
      </div>
      <div className="mt-2">{props.children}</div>
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-2xl px-4 py-3 text-sm outline-none transition',
        'bg-[rgba(244,239,227,0.06)] text-[var(--panel)] placeholder:text-[rgba(244,239,227,0.35)]',
        'ring-1 ring-[rgba(244,239,227,0.12)] focus:ring-[var(--ring)]',
        props.className || '',
      ].join(' ')}
    />
  )
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        'w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none transition',
        'bg-[rgba(244,239,227,0.06)] text-[var(--panel)] placeholder:text-[rgba(244,239,227,0.35)]',
        'ring-1 ring-[rgba(244,239,227,0.12)] focus:ring-[var(--ring)]',
        props.className || '',
      ].join(' ')}
    />
  )
}

