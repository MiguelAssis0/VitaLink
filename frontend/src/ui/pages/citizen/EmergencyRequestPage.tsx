import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createEmergency, Emergency } from '../../../api'

export function EmergencyRequestPage() {
  const [address, setAddress] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState('Obtendo sua localização atual…')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<Emergency | null>(null)
  const locationRequested = useRef(false)
  const idempotency = useRef<{ payload: string; key: string } | null>(null)
  const navigate = useNavigate()

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) { setCoords(null); setAddress(''); setLocationStatus('Este navegador não oferece localização. Informe o endereço manualmente.'); return }
    setLocationStatus('Aguardando permissão de localização…')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy })
        setAddress('')
        setLocationStatus(`Localização atual obtida: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)} (precisão aproximada de ${Math.round(position.coords.accuracy)} m). Edite o endereço abaixo se estiver em outro lugar.`)
      },
      () => { setCoords(null); setAddress(''); setLocationStatus('Não foi possível obter a localização. Informe o endereço manualmente.') },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  }, [])

  useEffect(() => {
    if (!locationRequested.current) {
      locationRequested.current = true
      useCurrentLocation()
    }
  }, [useCurrentLocation])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (!navigator.onLine) { setError('Sem conexão. Não foi possível registrar a solicitação.'); return }
    if (!confirmed) { setError('Confirme que esta solicitação não encaminha uma equipe de emergência.'); return }
    setBusy(true)
    try {
      const payload = {
        location: {
          source: coords ? 'BROWSER' as const : 'MANUAL' as const,
          address,
          reference,
          ...(coords ? {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracyMeters: coords.accuracy,
          } : {}),
        },
        notes,
      }
      const serialized = JSON.stringify(payload)
      if (!idempotency.current || idempotency.current.payload !== serialized) idempotency.current = { payload: serialized, key: crypto.randomUUID() }
      setCreated(await createEmergency(payload, idempotency.current.key))
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível registrar a solicitação. Em uma emergência, ligue 192.') }
    finally { setBusy(false) }
  }

  if (created) {
    return (
      <div className="page narrow">
        <section className="success-card card">
          <span className="success-icon">✓</span>
          <span className="sim-badge">SIMULAÇÃO</span>
          <h1>Pedido simulado registrado</h1>
          <p><strong>Nenhuma ambulância real foi acionada.</strong></p>
          <p>{created.message || 'O pedido foi registrado no VitaLink.'}</p>
          {created.ambulanceCode && <p>Ambulância simulada: <strong>{created.ambulanceCode}</strong></p>}
          {created.hospitalName && <p>Hospital selecionado: <strong>{created.hospitalName}</strong></p>}
          <p className="muted">Identificador: {created.id}</p>
          <div className="button-row">
            <button className="primary" onClick={() => navigate(`/patient/emergencies/${created.id}`)}>
              Acompanhar solicitação
            </button>
            <Link className="secondary" to="/patient">Voltar ao início</Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page narrow">
      <Link className="back-link" to="/patient">← Início</Link>
      <div className="eyebrow">NOVA SOLICITAÇÃO · SIMULAÇÃO</div>
      <h1>Solicitar atendimento</h1>
      <form className="card form-card" onSubmit={submit}>
        <div className="form-section">
          <h2>Onde você está?</h2>
          <p className="muted">Sua localização atual é usada por padrão. Edite o endereço abaixo para informar outro local.</p>
          <button type="button" className="secondary" onClick={useCurrentLocation}>
            {coords ? 'Atualizar localização atual' : 'Usar localização atual'}
          </button>
          <p className="hint" role="status">{locationStatus}</p>
          <label htmlFor="address">
            Endereço {coords && <span className="muted">(edite para usar outro local)</span>}
          </label>
          <input
            id="address"
            required={!coords}
            maxLength={300}
            value={address}
            onChange={(event) => {
              setAddress(event.target.value)
              if (coords) {
                setCoords(null)
                setLocationStatus('Endereço manual selecionado. A localização anterior foi removida.')
              }
            }}
            placeholder={coords ? 'Se for outro local, digite o endereço aqui' : 'Rua, número, bairro e cidade'}
          />
          <label htmlFor="reference">
            Ponto de referência <span className="muted">(opcional)</span>
          </label>
          <input
            id="reference"
            maxLength={200}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Ex.: próximo à praça central"
          />
        </div>

        <div className="form-section">
          <label htmlFor="notes">Observação curta <span className="muted">(opcional)</span></label>
          <textarea id="notes" rows={3} maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>

        <label className="check-row">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          <span>Entendo que o direcionamento acontece apenas no VitaLink e não aciona uma equipe real. Para atendimento real, ligue 192.</span>
        </label>
        <p className="hint">Se o envio de SMS estiver ativado, os contatos que autorizaram podem receber sua localização.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary full" disabled={busy || !confirmed || !navigator.onLine}>
          {busy ? 'Solicitando…' : 'Solicitar ajuda no VitaLink'}
        </button>
      </form>
    </div>
  )
}
