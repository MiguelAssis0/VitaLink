import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { addAmbulance, getAmbulances, type Ambulance, updateAmbulanceLocation, updateAmbulanceStatus } from '../../../api'
import './AmbulanceFleetPanel.css'

const statusLabels: Record<Ambulance['status'], string> = {
  AVAILABLE: 'Disponível', OCCUPIED: 'Ocupada', OUT_OF_SERVICE: 'Fora de operação',
}
const statusOptions: Ambulance['status'][] = ['AVAILABLE', 'OCCUPIED', 'OUT_OF_SERVICE']

export function AmbulanceFleetPanel() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locatingId, setLocatingId] = useState('')

  const refresh = useCallback(async () => {
    try { setAmbulances(await getAmbulances()); setError('') }
    catch { setError('Não foi possível carregar a frota.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => { void refresh() }, 10000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function changeStatus(id: string, status: Ambulance['status']) {
    setSaving(true)
    setError(''); setMessage('')
    try {
      const updated = await updateAmbulanceStatus(id, status)
      setAmbulances(current => current.map(item => item.id === id ? updated : item))
      setMessage(`Disponibilidade da ambulância ${updated.code} atualizada.`)
    } catch { setError('Não foi possível atualizar o estado da ambulância.') }
    finally { setSaving(false) }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      const created = await addAmbulance(code.trim())
      setAmbulances(current => [...current, created].sort((a, b) => a.code.localeCompare(b.code)))
      setCode('')
      setMessage(`Ambulância ${created.code} cadastrada com sucesso.`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível cadastrar a ambulância.') }
    finally { setSaving(false) }
  }

  function setAmbulanceLocation(ambulance: Ambulance) {
    setError(''); setMessage('')
    if (!navigator.geolocation) { setError('Este navegador não oferece acesso à localização.'); return }
    setLocatingId(ambulance.id)
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const updated = await updateAmbulanceLocation(ambulance.id, {
          latitude: position.coords.latitude, longitude: position.coords.longitude,
        })
        setAmbulances(current => current.map(item => item.id === ambulance.id ? updated : item))
        setMessage(`Posição da ambulância ${ambulance.code} registrada. Ela não é rastreada ao vivo.`)
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a posição.') }
      finally { setLocatingId('') }
    }, () => {
      setError('Não foi possível obter a localização. Confira a permissão do aparelho e tente novamente.')
      setLocatingId('')
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 })
  }

  return <section className="fleet-panel card" aria-labelledby="fleet-heading">
    <div className="fleet-heading">
      <div><span className="eyebrow">RECURSOS</span><h2 id="fleet-heading">Ambulâncias</h2></div>
      <button className="text-button" type="button" onClick={() => void refresh()} disabled={loading}>Atualizar</button>
    </div>
    <div className="fleet-counts" aria-label="Resumo da frota">
      {statusOptions.map(status => <div className={`fleet-count fleet-${status.toLowerCase()}`} key={status}>
        <strong>{ambulances.filter(item => item.status === status).length}</strong><span>{statusLabels[status]}</span>
      </div>)}
    </div>
    <p className="hint">A posição de cada ambulância é informada pelo operador e não representa rastreamento ao vivo.</p>
    {error && <p className="error" role="alert">{error}</p>}
    {message && <p className="info-card success-text" role="status" aria-live="polite">{message}</p>}
    {loading ? <p className="muted">Carregando frota…</p> : ambulances.length === 0 ? <p className="muted">Nenhuma ambulância cadastrada.</p> :
      <ul className="fleet-list">{ambulances.map(item => <li key={item.id}>
        <div><strong>{item.code}</strong><span className={`fleet-status fleet-${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span></div>
        <small>{item.latitude == null || item.longitude == null ? 'Posição ainda não definida' : `Posição cadastrada: ${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}</small>
        <button className="text-button" type="button" disabled={locatingId === item.id} onClick={() => setAmbulanceLocation(item)}>
          {locatingId === item.id ? 'Obtendo posição…' : 'Atualizar posição deste aparelho'}
        </button>
        <label className="fleet-state-label">Alterar estado
          <select value={item.status} disabled={saving} onChange={event => void changeStatus(item.id, event.target.value as Ambulance['status'])}>
            {statusOptions.map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}
          </select>
        </label>
      </li>)}</ul>}
    <form className="fleet-add-form" onSubmit={event => void submit(event)}>
      <label htmlFor="ambulance-code">Cadastrar ambulância</label>
      <div><input id="ambulance-code" maxLength={24} required value={code} onChange={event => setCode(event.target.value)} placeholder="Identificador, ex.: V-05" />
        <button className="secondary" disabled={saving || !code.trim()}>{saving ? 'Salvando…' : 'Cadastrar ambulância'}</button></div>
    </form>
  </section>
}
