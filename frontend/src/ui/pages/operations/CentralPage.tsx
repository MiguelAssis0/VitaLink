import { useCallback, useEffect, useState } from 'react'
import { api, assignHospital, Emergency, getCentral, getEvents, TimelineEvent, transition, list } from '../../../api'

type MedicalSummary = {
  patientDisplayName: string
  allergies: string
  medications: string
  conditions: string
  notes: string
  selfReported: boolean
}

const hospitalId = '10000000-0000-4000-8000-000000000002'
const nextStatus: Record<string, { value: string; label: string }> = {
  REQUESTED: { value: 'ACKNOWLEDGED', label: 'Confirmar recebimento' },
  ACKNOWLEDGED: { value: 'RESOURCE_ASSIGNED', label: 'Atribuir equipe' },
  RESOURCE_ASSIGNED: { value: 'EN_ROUTE', label: 'Registrar saída' },
  EN_ROUTE: { value: 'ON_SCENE', label: 'Registrar chegada' },
  ON_SCENE: { value: 'CLOSED', label: 'Encerrar ocorrência' },
  CANCEL_REQUESTED: { value: 'CANCELLED', label: 'Confirmar cancelamento' },
}
const statusLabel: Record<string, string> = {
  REQUESTED: 'Novo', ACKNOWLEDGED: 'Recebido', RESOURCE_ASSIGNED: 'Equipe atribuída',
  EN_ROUTE: 'Em deslocamento', ON_SCENE: 'No local', CLOSED: 'Encerrado',
  CANCEL_REQUESTED: 'Cancelamento solicitado', CANCELLED: 'Cancelado',
}
const actorLabel = { PATIENT: 'Cidadão', DISPATCHER: 'Central', HOSPITAL_STAFF: 'Hospital', DEMO_ADMIN: 'Administração' }

export function CentralPage() {
  const [cases, setCases] = useState<Emergency[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [medical, setMedical] = useState<MedicalSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [historyRevision, setHistoryRevision] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const result = list(await getCentral())
      setCases(result)
      setSelectedId(current => current || result[0]?.id || '')
      setError('')
    } catch {
      setError('Não foi possível carregar a lista de ocorrências.')
    } finally {
      setLoading(false)
      setHistoryRevision(revision => revision + 1)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => { void refresh() }, 10000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const selected = cases.find(item => item.id === selectedId)

  useEffect(() => {
    if (!selected) return
    let active = true
    api<MedicalSummary>(`/central/emergencies/${encodeURIComponent(selected.id)}/medical-summary`).then(summary => {
      if (active) setMedical(summary)
    }).catch(() => {
      if (active) { setMedical(null); setError('Não foi possível carregar as informações de saúde desta ocorrência.') }
    })
    return () => { active = false }
  }, [selected?.id])

  useEffect(() => {
    if (!selected) return
    let active = true
    getEvents(selected.id).then(timeline => {
      if (active) setEvents(timeline)
    }).catch(() => {
      if (active) { setEvents([]); setError('Não foi possível carregar o histórico desta ocorrência.') }
    })
    return () => { active = false }
  }, [selected?.id, historyRevision])

  function selectCase(id: string) {
    setEvents([])
    setMedical(null)
    setError('')
    setSelectedId(id)
  }

  async function updateStatus() {
    if (!selected) return
    const next = nextStatus[selected.status]
    if (!next) return
    setBusy(true)
    try {
      await transition(selected.id, next.value, selected.version || 0)
      await refresh()
      setEvents(await getEvents(selected.id))
    } catch {
      setError('Não foi possível atualizar o estado. Atualize a lista e tente novamente.')
    } finally { setBusy(false) }
  }

  async function linkHospital() {
    if (!selected) return
    setBusy(true)
    try {
      await assignHospital(selected.id, hospitalId)
      await refresh()
    } catch {
      setError('Não foi possível vincular a unidade. Atualize a lista e tente novamente.')
    } finally { setBusy(false) }
  }

  return <section className="page">
    <header className="page-heading">
      <div><span className="eyebrow">CENTRAL FICTÍCIA · SIMULAÇÃO</span><h1>Ocorrências</h1><p>Acompanhe pedidos recebidos e atualize seus estados. Nenhuma equipe real será acionada.</p></div>
      <button className="secondary" type="button" onClick={() => void refresh()} disabled={loading}>Atualizar lista</button>
    </header>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="institution-layout">
      <nav className="case-list" aria-label="Lista de ocorrências">
        {loading && <div className="card empty">Carregando ocorrências…</div>}
        {!loading && cases.length === 0 && <div className="card empty"><h3>Nenhuma ocorrência</h3><p>Novos pedidos aparecerão nesta lista.</p></div>}
        {cases.map(item => <button key={item.id} type="button" className={`card case-row${selectedId === item.id ? ' selected' : ''}`} onClick={() => selectCase(item.id)} aria-pressed={selectedId === item.id}>
          <span><strong>Cidadão</strong><small>{item.id}</small><small>{item.address || 'Endereço não informado'}</small></span>
          <span className="tag">{statusLabel[item.status] || item.status}</span>
        </button>)}
      </nav>
      {selected && <article className="card detail-panel" aria-label="Detalhes da ocorrência">
        <span className="eyebrow">DETALHES</span>
        <h2>Cidadão</h2>
        <dl>
          <dt>Identificador</dt><dd>{selected.id}</dd>
          <dt>Estado</dt><dd>{statusLabel[selected.status] || selected.status}</dd>
          <dt>Endereço</dt><dd>{selected.address || 'Não informado'}</dd>
          <dt>Ponto de referência</dt><dd>{selected.reference || 'Não informado'}</dd>
          <dt>Precisão da localização</dt><dd>{selected.accuracyMeters == null ? 'Não informada' : `${Math.round(selected.accuracyMeters)} m`}</dd>
          <dt>Observação</dt><dd>{selected.notes || 'Nenhuma observação'}</dd>
          <dt>Unidade vinculada</dt><dd>{selected.hospitalName || 'Nenhuma'}</dd>
        </dl>
        {medical && <section className="info-card" aria-labelledby="medical-heading">
          <h3 id="medical-heading">Informações de saúde</h3>
          <p>{medical.selfReported ? 'Informações informadas pelo cidadão.' : 'Informações de saúde.'}</p>
          <dl>
            <dt>Alergias</dt><dd>{medical.allergies || 'Não informado'}</dd>
            <dt>Medicamentos</dt><dd>{medical.medications || 'Não informado'}</dd>
            <dt>Condições</dt><dd>{medical.conditions || 'Não informado'}</dd>
            <dt>Observações</dt><dd>{medical.notes || 'Nenhuma'}</dd>
          </dl>
        </section>}
        <h3>Histórico</h3>
        <ol className="timeline-list">
          {events.map((event, index) => (
            <li key={`${event.occurredAt}-${index}`}>
              <span className="timeline-dot" aria-hidden="true" />
              <span>
                <strong>{statusLabel[event.status || ''] || event.status || 'Atualização'}</strong>
                <small>{actorLabel[event.actorRole]} · {new Date(event.occurredAt).toLocaleString('pt-BR')}</small>
              </span>
            </li>
          ))}
        </ol>
        <div className="button-row wrap">
          {selected.status !== 'CLOSED' && selected.status !== 'CANCELLED' && <>
            {!selected.hospitalName && <button className="secondary" type="button" onClick={() => void linkHospital()} disabled={busy}>Vincular hospital</button>}
            {nextStatus[selected.status] && <button className="primary" type="button" onClick={() => void updateStatus()} disabled={busy}>{nextStatus[selected.status].label}</button>}
          </>}
        </div>
      </article>}
    </div>
  </section>
}
