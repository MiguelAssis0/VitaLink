import { useCallback, useEffect, useState } from 'react'
import { getAdminOverview, type AdminOverview } from '../../../api'
import './AdminPage.css'

const metrics: { key: keyof AdminOverview; label: string; detail: string }[] = [
  { key: 'users', label: 'Contas', detail: 'Perfis registrados' },
  { key: 'institutions', label: 'Instituições', detail: 'Centrais e hospitais' },
  { key: 'emergencies', label: 'Ocorrências', detail: 'Registros no ambiente' },
  { key: 'openEmergencies', label: 'Em andamento', detail: 'Ocorrências não encerradas' },
  { key: 'pendingDeletions', label: 'Exclusões pendentes', detail: 'Solicitações aguardando análise' },
]

export function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setOverview(await getAdminOverview())
      setError('')
    } catch {
      setError('Não foi possível carregar o resumo técnico.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  return <section className="page admin-page">
    <header className="page-heading">
      <div>
        <span className="eyebrow">VITALINK</span>
        <h1>Administração técnica</h1>
        <p>Visão geral do ambiente e dos dados operacionais.</p>
      </div>
      <button className="secondary" type="button" onClick={() => void refresh()} disabled={loading}>Atualizar</button>
    </header>

    {error && <p className="error" role="alert">{error}</p>}

    <section className="admin-metrics" aria-label="Resumo do ambiente" aria-live="polite">
      {metrics.map(metric => <article className="card admin-metric" key={metric.key}>
        <span>{metric.label}</span>
        <strong>{loading ? '—' : overview?.[metric.key] ?? '—'}</strong>
        <small>{metric.detail}</small>
      </article>)}
    </section>

    <section className="card admin-environment">
      <div>
        <span className={`admin-health-dot${overview ? '' : ' unavailable'}`} aria-hidden="true" />
        <div><h2>{overview ? 'Ambiente disponível' : 'Ambiente indisponível'}</h2><p>{overview ? 'Resumo carregado do backend e do banco de dados.' : 'O resumo técnico não foi carregado.'}</p></div>
      </div>
      <p className="muted">Esta página exibe apenas contagens agregadas. Informações pessoais e clínicas não são exibidas.</p>
    </section>
  </section>
}
