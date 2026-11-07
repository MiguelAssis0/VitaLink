import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createEmergency, Emergency, getMedicalProfile } from '../../../api'

export function EmergencyRequestPage() {
  const [address, setAddress] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState('Você pode usar a localização atual ou informar um endereço.')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<Emergency | null>(null)
  const addressEdited = useRef(false)
  const idempotency = useRef<{ payload: string; key: string } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    void getMedicalProfile().then((profile) => {
      if (!addressEdited.current && profile.address) setAddress(profile.address)
    }).catch(() => undefined)
  }, [])

  function useCurrentLocation() {
    if (!navigator.geolocation) { setLocationStatus('Este navegador não oferece localização. Informe o endereço manualmente.'); return }
    setLocationStatus('Aguardando permissão de localização…')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy })
        setLocationStatus(`Localização obtida, precisão aproximada de ${Math.round(position.coords.accuracy)} m. Confira os dados antes de continuar.`)
      },
      () => { setCoords(null); setLocationStatus('Não foi possível obter a localização. Informe o endereço manualmente.') },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }

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
          <h1>Solicitação registrada</h1>
          <p><strong>Este registro não encaminhou uma equipe de emergência.</strong></p>
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
      <div className="eyebrow">NOVA SOLICITAÇÃO</div>
      <h1>Solicitar atendimento</h1>
      <form className="card form-card" onSubmit={submit}>
        <div className="form-section">
          <h2>Onde você está?</h2>
          <p className="muted">Informe um endereço ou use a localização atual.</p>
          <button type="button" className="secondary" onClick={useCurrentLocation} disabled={Boolean(coords)}>
            Usar localização atual
          </button>
          <p className="hint" role="status">{locationStatus}</p>
          {coords && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setCoords(null)
                setLocationStatus('Informe um endereço ou use a localização atual.')
              }}
            >
              Remover localização atual
            </button>
          )}
          <label htmlFor="address">
            Endereço {coords && <span className="muted">(opcional com localização atual)</span>}
          </label>
          <input
            id="address"
            required={!coords}
            maxLength={300}
            value={address}
            onChange={(event) => {
              addressEdited.current = true
              setAddress(event.target.value)
            }}
            placeholder="Rua, número, bairro e cidade"
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
          <span>Entendo que esta solicitação não encaminha equipes de emergência. Para atendimento imediato, ligarei 192.</span>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary full" disabled={busy || !confirmed || !navigator.onLine}>
          {busy ? 'Registrando…' : 'Registrar solicitação'}
        </button>
      </form>
    </div>
  )
}
