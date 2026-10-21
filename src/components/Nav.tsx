export type Tab = 'resumen' | 'arriendos' | 'gastos' | 'vehiculos' | 'duenos'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'resumen',
    label: 'Resumen',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    id: 'arriendos',
    label: 'Arriendos',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 2v4M16 2v4" />
      </svg>
    ),
  },
  {
    id: 'gastos',
    label: 'Gastos',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 4h16v16H4zM8 9h8M8 13h5" />
      </svg>
    ),
  },
  {
    id: 'vehiculos',
    label: 'Vehículos',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M5 13l1.5-5a2 2 0 0 1 2-1.5h7a2 2 0 0 1 2 1.5L19 13M3 13h18v5H3zM7 18v2M17 18v2" />
      </svg>
    ),
  },
  {
    id: 'duenos',
    label: 'Dueños',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
]

export function Nav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="nav" aria-label="Secciones">
      {TABS.map((t) => (
        <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => onChange(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
