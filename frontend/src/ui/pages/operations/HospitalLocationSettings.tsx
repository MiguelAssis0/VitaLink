import { useEffect, useState, type FormEvent } from 'react'
import { getHospitalLocation, saveHospitalLocation } from '../../../api'
import './HospitalLocationSettings.css'

export function HospitalLocationSettings() {
  const [phone, setPhone] = useState('')
  const [acceptingEmergencies, setAcceptingEmergencies] = useState(true)
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void getHospitalLocation().then(location => {
      setPhone(location.phone || '')
      setAcceptingEmergencies(location.acceptingEmergencies)
      if (location.latitude !== null && location.longitude !== null) {
        setCoordinates({ latitude: location.latitude, longitude: location.longitude })
      }
    }).catch(cause => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os dados da unidade.'))
  }, [])

  function captureLocation() {
    setError('')
    if (!navigator.geolocation) {
      setError('Este navegador não oferece acesso à localização.')
      return
    }
    setStatus('Aguardando permissão de localização…')
    navigator.geolocation.getCurrentPosition(position => {
      setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude })
      setStatus(`Localização obtida com precisão aproximada de ${Math.round(position.coords.accuracy)} m.`)
    }, () => {
      setStatus('')
      setError('Não foi possível obter a localização. Confira a permissão do aparelho e tente novamente.')
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!coordinates) {
      setError('Obtenha a localização do hospital antes de salvar.')
      return
    }
    setSaving(true)
    setError('')
    setStatus('')
    try {
      await saveHospitalLocation({ ...coordinates, phone: phone.trim(), acceptingEmergencies })
      setStatus('Dados da unidade atualizados com sucesso.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar os dados da unidade.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="card hospital-location-settings" aria-labelledby="hospital-location-title">
    <h2 id="hospital-location-title">Localização e telefone da unidade</h2>
    <p className="muted">Defina a localização usando um aparelho dentro do hospital. Ela será usada para mostrar esta unidade como opção próxima.</p>
    <button className="secondary" type="button" onClick={captureLocation}>Usar localização deste aparelho</button>
    {coordinates && <p className="hint">Coordenadas: {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}</p>}
    <form onSubmit={event => void save(event)}>
      <label htmlFor="hospital-public-phone">Telefone para contato</label>
      <input id="hospital-public-phone" type="tel" autoComplete="tel" required maxLength={30} value={phone} onChange={event => setPhone(event.target.value)} />
      <label className="hospital-availability">
        <input type="checkbox" checked={acceptingEmergencies} onChange={event => setAcceptingEmergencies(event.target.checked)} />
        <span>Unidade disponível para receber ocorrências</span>
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {status && <p className="info-card success-text" role="status">{status}</p>}
      <button className="primary" type="submit" disabled={saving || !coordinates}>{saving ? 'Salvando…' : 'Salvar dados da unidade'}</button>
    </form>
  </section>
}
