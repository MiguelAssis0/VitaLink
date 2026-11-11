import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Emergency, getEmergency, getEvents, requestCancel, TimelineEvent } from '../../../api'

const statusNames: Record<string, string> = {
  REQUESTED: 'Solicitação recebida', ACKNOWLEDGED: 'Atendimento confirmado',
  RESOURCE_ASSIGNED: 'Equipe atribuída', EN_ROUTE: 'Equipe em deslocamento',
  ON_SCENE: 'Equipe no local', CLOSED: 'Atendimento encerrado',
  CANCEL_REQUESTED: 'Cancelamento solicitado', CANCELLED: 'Atendimento cancelado',
}

export function EmergencyDetailsPage() {
  const { id = '' } = useParams()
  const [request, setRequest] = useState<Emergency | null>(null)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const refresh = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setRequest(await getEmergency(id))
      try {
        setEvents(await getEvents(id))
      } catch {
        setEvents([])
        setError('Solicitação carregada, mas o histórico está indisponível.')
      }
    } catch (cause) {
      setRequest(null)
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a solicitação.')
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => { void refresh() }, [refresh])

  async function cancel() {
    if (!request || !window.confirm('Solicitar o cancelamento desta solicitação?')) return
    setBusy(true)
    setError('')
    try {
      await requestCancel(request.id)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível solicitar o cancelamento.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page narrow">
      <Link className="back-link" to="/patient">← Solicitações</Link>
      {error && <p role="alert" className="error">{error}</p>}
      {loading && <p role="status">Carregando solicitação…</p>}
      {!loading && request && (
        <section className="card case-detail">
          <span className="sim-badge">SIMULAÇÃO · NENHUMA AMBULÂNCIA REAL FOI ACIONADA</span>
          <h1>{statusNames[request.status] || request.status}</h1>
          <p className="muted">Solicitação {request.id}</p>
          <h2>Histórico de atualizações</h2>
          <ol className="timeline-list">
            {events.map((event, index) => (
              <li key={`${event.occurredAt}-${index}`}>
                <span className="timeline-dot" aria-hidden="true" />
                <div>
                  <strong>{event.status ? statusNames[event.status] || event.status : 'Solicitação criada'}</strong>
                  <small>
                    {new Date(event.occurredAt).toLocaleString('pt-BR')} ·{' '}
                    {event.actorRole === 'PATIENT' ? 'Cidadão' : event.actorLabel || event.actorRole}
                  </small>
                </div>
              </li>
            ))}
          </ol>
          {events.length === 0 && <p className="muted">Nenhuma atualização disponível.</p>}
          {!['CLOSED', 'CANCELLED', 'CANCEL_REQUESTED'].includes(request.status) && (
            <p className="hint">O pedido de cancelamento é fictício e será tratado pela central de demonstração; não cancela atendimento real.</p>
          )}
          {!['CLOSED', 'CANCELLED', 'CANCEL_REQUESTED'].includes(request.status) && (
            <button className="secondary" disabled={busy || !navigator.onLine} onClick={() => void cancel()}>
              {busy ? 'Enviando…' : 'Solicitar cancelamento'}
            </button>
          )}
        </section>
      )}
    </div>
  )
}
