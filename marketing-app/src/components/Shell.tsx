import { NavLink, Outlet } from 'react-router-dom'
import { Sparkles, BookOpen, History } from 'lucide-react'
import type { ReactNode } from 'react'

function NavItem(props: { to: string; label: string; icon: ReactNode }) {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        [
          'group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
          'border border-transparent',
          isActive
            ? 'bg-[var(--panel)] text-[var(--ink)] border-[rgba(0,0,0,0.08)]'
            : 'text-[rgba(244,239,227,0.78)] hover:text-[var(--panel)] hover:border-[rgba(183,255,42,0.28)]',
        ].join(' ')
      }
    >
      <span className="opacity-80 group-hover:opacity-100">{props.icon}</span>
      <span className="tracking-wide">{props.label}</span>
    </NavLink>
  )
}

export default function Shell() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[rgba(183,255,42,0.16)] ring-1 ring-[var(--ring)] grid place-items-center">
              <span className="font-['Fraunces'] text-xl text-[var(--acid)]">M</span>
            </div>
            <div>
              <div className="font-['Fraunces'] text-2xl leading-none text-[var(--panel)]">Marrow Studio</div>
              <div className="text-xs text-[rgba(244,239,227,0.62)]">Free-tier friendly marketing copy on demand</div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <NavItem to="/studio" label="Studio" icon={<Sparkles size={16} />} />
            <NavItem to="/brand" label="Brand Kit" icon={<BookOpen size={16} />} />
            <NavItem to="/history" label="History" icon={<History size={16} />} />
          </nav>
        </header>

        <main className="mt-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
