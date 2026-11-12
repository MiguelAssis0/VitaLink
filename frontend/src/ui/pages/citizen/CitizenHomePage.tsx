import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Emergency, getMine, list } from '../../../api'
import { KeywordHelpTrigger } from '../../shared/KeywordHelpTrigger'
import { MockCallsPanel } from './MockCallsPanel'
import { QuickHelpPanel } from './QuickHelpPanel'
import './MockCallsPanel.css'

export const REQUEST_EMERGENCY_EVENT = 'vitalink:request-emergency'

const statusNames: Record<string, string> = {
  REQUESTED: 'Solicitação recebida', ACKNOWLEDGED: 'Atendimento confirmado',
  RESOURCE_ASSIGNED: 'Preparando saída', EN_ROUTE: 'Ambulância em deslocamento',
  ON_SCENE: 'Ambulância no local', CLOSED: 'Atendimento encerrado',
  CANCEL_REQUESTED: 'Cancelamento solicitado', CANCELLED: 'Atendimento cancelado',
}

export function CitizenHomePage() {
  const [requests, setRequests] = useState<Emergency[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [quickHelpOpen, setQuickHelpOpen] = useState(false)
  const navigate = useNavigate()
  const refresh = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setRequests(list(await getMine()))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as solicitações.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    const requestEmergency = () => navigate('/patient/request')
    window.addEventListener(REQUEST_EMERGENCY_EVENT, requestEmergency)
    return () => window.removeEventListener(REQUEST_EMERGENCY_EVENT, requestEmergency)
  }, [navigate])
  const current = requests.find((request) => !['CLOSED', 'CANCELLED'].includes(request.status))

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ÁREA DO CIDADÃO</div>
          <p>Acompanhe suas solicitações e mantenha suas informações atualizadas.</p>
        </div>
      </div>

      <div className="quick-help-actions">
        <Link className="quick-help-trigger" to="/patient/request">
          <span aria-hidden="true">!</span>
          <span><strong>Preciso de ajuda</strong><small>Iniciar solicitação com sua localização atual</small></span>
        </Link>
        <button className="secondary quick-help-more" type="button" aria-expanded={quickHelpOpen} aria-controls="quick-help-panel" onClick={() => setQuickHelpOpen((open) => !open)}>
          Contatos e hospitais próximos
        </button>
      </div>
      <QuickHelpPanel open={quickHelpOpen} onClose={() => setQuickHelpOpen(false)} />
      <KeywordHelpTrigger />

      <div className="citizen-actions">
        <Link className="action-card action-main" to="/patient/request">
          <span className="action-icon">+</span>
          <span><strong>Nova solicitação</strong><small>Revise a localização antes de confirmar</small></span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="action-card" to="/patient/profile">
          <span className="action-icon teal">♡</span>
          <span><strong>Meu perfil</strong><small>Endereço e informações de saúde</small></span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <MockCallsPanel />

      {error && <p className="error" role="alert">{error}</p>}
      {current && (
        <section className="card current-case">
          <div>
            <div className="eyebrow">SOLICITAÇÃO ATIVA</div>
            <h2>{statusNames[current.status] || current.status}</h2>
            <p className="muted">ID {current.id}</p>
          </div>
          <Link className="secondary" to={`/patient/emergencies/${current.id}`}>Acompanhar solicitação</Link>
        </section>
      )}

      <section className="section">
        <div className="section-heading">
          <h2>Solicitações recentes</h2>
          <button className="text-button" onClick={() => void refresh()} disabled={loading}>Atualizar</button>
        </div>
        {loading ? <p role="status">Carregando solicitações…</p> : requests.length === 0 ? (
          <div className="empty card">
            <span className="empty-icon">✓</span>
            <h3>Nenhuma solicitação registrada</h3>
            <p>Em uma emergência, ligue 192.</p>
          </div>
        ) : (
          <div className="case-list">
            {requests.map((request) => (
              <Link className="case-row card" key={request.id} to={`/patient/emergencies/${request.id}`}>
                <span>
                  <strong>{statusNames[request.status] || request.status}</strong>
                  <small>{new Date(request.createdAt).toLocaleString('pt-BR')}</small>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
