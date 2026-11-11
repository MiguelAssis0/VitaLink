import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { addAmbulance, getAmbulances, type Ambulance, updateAmbulanceStatus } from '../../../api'
import './AmbulanceFleetPanel.css'

const statusLabels: Record<Ambulance['status'], string> = {
  AVAILABLE: 'Disponível', OCCUPIED: 'Ocupada', OUT_OF_SERVICE: 'Fora de operação',
}
const statusOptions: Ambulance['status'][] = ['AVAILABLE', 'OCCUPIED', 'OUT_OF_SERVICE']

export function AmbulanceFleetPanel() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
    try {
      const updated = await updateAmbulanceStatus(id, status)
      setAmbulances(current => current.map(item => item.id === id ? updated : item))
      setError('')
    } catch { setError('Não foi possível atualizar o estado da ambulância.') }
    finally { setSaving(false) }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const created = await addAmbulance(code.trim())
      setAmbulances(current => [...current, created].sort((a, b) => a.code.localeCompare(b.code)))
      setCode('')
      setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível cadastrar a ambulância.') }
    finally { setSaving(false) }
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
    {error && <p className="error" role="alert">{error}</p>}
    {loading ? <p className="muted">Carregando frota…</p> : ambulances.length === 0 ? <p className="muted">Nenhuma ambulância cadastrada.</p> :
      <ul className="fleet-list">{ambulances.map(item => <li key={item.id}>
        <div><strong>{item.code}</strong><span className={`fleet-status fleet-${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span></div>
        <label className="fleet-state-label">Alterar estado
          <select value={item.status} disabled={saving} onChange={event => void changeStatus(item.id, event.target.value as Ambulance['status'])}>
            {statusOptions.map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}
          </select>
        </label>
      </li>)}</ul>}
    <form className="fleet-add-form" onSubmit={event => void submit(event)}>
      <label htmlFor="ambulance-code">Cadastrar ambulância</label>
      <div><input id="ambulance-code" maxLength={24} required value={code} onChange={event => setCode(event.target.value)} placeholder="Identificador, ex.: V-05" />
        <button className="secondary" disabled={saving || !code.trim()}>Adicionar</button></div>
    </form>
  </section>
}
