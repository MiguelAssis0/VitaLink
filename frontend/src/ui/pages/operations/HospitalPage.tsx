import { useCallback, useEffect, useState } from 'react'
import { Emergency, getEvents, getHospital, getMedicalSummary, TimelineEvent, list } from '../../../api'
import { HospitalLocationSettings } from './HospitalLocationSettings'
import { HospitalRegistryPanel } from './HospitalRegistryPanel'

type MedicalSummary = {
  patientDisplayName: string
  allergies: string
  medications: string
  conditions: string
  notes: string
  selfReported: boolean
  updatedAt?: string
}

const statusLabel: Record<string, string> = {
  REQUESTED: 'Novo', ACKNOWLEDGED: 'Recebido', RESOURCE_ASSIGNED: 'Preparando saída',
  EN_ROUTE: 'Em deslocamento', ON_SCENE: 'No local', CLOSED: 'Encerrado',
  CANCEL_REQUESTED: 'Cancelamento solicitado', CANCELLED: 'Cancelado',
}
const actorLabel = { PATIENT: 'Cidadão', DISPATCHER: 'Central', HOSPITAL_STAFF: 'Hospital', DEMO_ADMIN: 'Administração' }

export function HospitalPage() {
  const [section, setSection] = useState<'cases' | 'crew' | 'patients' | 'location'>('cases')
  const [cases, setCases] = useState<Emergency[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [medical, setMedical] = useState<MedicalSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [historyRevision, setHistoryRevision] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const result = list(await getHospital())
      setCases(result)
      setSelectedId(current => current || result[0]?.id || '')
      setError('')
    } catch {
      setError('Não foi possível carregar a lista de ocorrências vinculadas.')
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
    getMedicalSummary(selected.id).then(summary => {
      if (active) setMedical(summary as MedicalSummary)
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

  return <section className="page">
    <header className="page-heading">
      <div><h1>Ocorrências vinculadas</h1><p>Consulte as informações compartilhadas de cada atendimento.</p></div>
      <button className="secondary" type="button" onClick={() => void refresh()} disabled={loading}>Atualizar lista</button>
    </header>
    <nav className="button-row wrap hospital-sections" aria-label="Seções do hospital">
      <button className={section === 'cases' ? 'primary' : 'secondary'} type="button" aria-pressed={section === 'cases'} onClick={() => setSection('cases')}>Ocorrências</button>
      <button className={section === 'crew' ? 'primary' : 'secondary'} type="button" aria-pressed={section === 'crew'} onClick={() => setSection('crew')}>Funcionários da ambulância</button>
      <button className={section === 'patients' ? 'primary' : 'secondary'} type="button" aria-pressed={section === 'patients'} onClick={() => setSection('patients')}>Pacientes</button>
      <button className={section === 'location' ? 'primary' : 'secondary'} type="button" aria-pressed={section === 'location'} onClick={() => setSection('location')}>Unidade</button>
    </nav>
    {error && <p className="error" role="alert">{error}</p>}
    {section === 'location' ? <HospitalLocationSettings /> : section === 'cases' ? <div className="institution-layout">
      <nav className="case-list" aria-label="Ocorrências vinculadas">
        {loading && <div className="card empty">Carregando ocorrências…</div>}
        {!loading && cases.length === 0 && <div className="card empty"><h3>Nenhuma ocorrência vinculada</h3><p>Ocorrências autorizadas aparecerão nesta lista.</p></div>}
        {cases.map(item => <button key={item.id} type="button" className={`card case-row${selectedId === item.id ? ' selected' : ''}`} onClick={() => selectCase(item.id)} aria-pressed={selectedId === item.id}>
          <span><strong>Cidadão</strong><small>{item.id}</small><small>{item.ambulanceCode ? `Ambulância ${item.ambulanceCode}` : 'Ambulância ainda não selecionada'}</small><small>{new Date(item.createdAt).toLocaleString('pt-BR')}</small></span>
          <span className="tag">{statusLabel[item.status] || item.status}</span>
        </button>)}
      </nav>
      {selected && <article className="card detail-panel" aria-label="Informações compartilhadas">
        <span className="eyebrow">INFORMAÇÕES COMPARTILHADAS</span>
        <h2>{medical?.patientDisplayName || 'Cidadão'}</h2>
        {medical ? <>
          {medical.selfReported && <p className="hint">Informações de saúde informadas pelo cidadão.</p>}
          <dl>
            <dt>Alergias</dt><dd>{medical.allergies || 'Não informado'}</dd>
            <dt>Medicamentos</dt><dd>{medical.medications || 'Não informado'}</dd>
            <dt>Condições</dt><dd>{medical.conditions || 'Não informado'}</dd>
            <dt>Observações</dt><dd>{medical.notes || 'Nenhuma'}</dd>
            {medical.updatedAt && <><dt>Atualizado em</dt><dd>{new Date(medical.updatedAt).toLocaleString('pt-BR')}</dd></>}
          </dl>
        </> : <p>Carregando informações…</p>}
        <h3>Estado e histórico</h3>
        <p><strong>{statusLabel[selected.status] || selected.status}</strong></p>
        <p><strong>Ambulância:</strong> {selected.ambulanceCode || 'Ainda não selecionada'}</p>
        <ol className="timeline-list">
          {events.map((event, index) => (
            <li key={`${event.occurredAt}-${index}`}>
              <span className="timeline-dot" aria-hidden="true" />
              <span>
                <strong>{statusLabel[event.status || ''] || event.status || 'Atualização'}</strong>
                <small>{event.actorLabel || actorLabel[event.actorRole]} · {new Date(event.occurredAt).toLocaleString('pt-BR')}</small>
              </span>
            </li>
          ))}
        </ol>
      </article>}
    </div> : <HospitalRegistryPanel registry={section} />}
  </section>
}
