import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { addAmbulanceCrewMember, addHospitalPatient, getAmbulanceCrew, getHospitalPatients, type AmbulanceCrewMember, type HospitalPatient } from '../../../api'
import './HospitalRegistryPanel.css'

type Registry = 'crew' | 'patients'
const today = new Date()
const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

export function HospitalRegistryPanel({ registry }: { registry: Registry }) {
  const [crew, setCrew] = useState<AmbulanceCrewMember[]>([])
  const [patients, setPatients] = useState<HospitalPatient[]>([])
  const [name, setName] = useState('')
  const [position, setPosition] = useState('Condutor')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    try {
      if (registry === 'crew') setCrew(await getAmbulanceCrew())
      else setPatients(await getHospitalPatients())
      setError('')
    } catch { setError('Não foi possível carregar os cadastros.') }
    finally { setLoading(false) }
  }, [registry])

  useEffect(() => { void refresh() }, [refresh])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      if (registry === 'crew') {
        const member = await addAmbulanceCrewMember({ name: name.trim(), position, phone: phone.trim() })
        setCrew(current => [...current, member].sort((a, b) => a.name.localeCompare(b.name)))
        setMessage('Funcionário cadastrado.')
      } else {
        const patient = await addHospitalPatient({ name: name.trim(), birthDate, phone: phone.trim() })
        setPatients(current => [patient, ...current])
        setMessage('Paciente cadastrado.')
      }
      setName(''); setPhone(''); setBirthDate('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o cadastro.') }
    finally { setSaving(false) }
  }

  const isCrew = registry === 'crew'
  return <section className="registry-layout" aria-labelledby="registry-heading">
    <div className="card registry-form-card">
      <h2 id="registry-heading">{isCrew ? 'Cadastrar funcionário da ambulância' : 'Cadastrar paciente'}</h2>
      <p className="muted">{isCrew ? 'Adicione um profissional à equipe do hospital.' : 'Registre os dados básicos do paciente.'}</p>
      <form onSubmit={event => void submit(event)}>
        <label htmlFor="registry-name">Nome completo</label>
        <input id="registry-name" required maxLength={120} autoComplete="name" value={name} onChange={event => setName(event.target.value)} />
        {isCrew ? <>
          <label htmlFor="crew-position">Função</label>
          <select id="crew-position" value={position} onChange={event => setPosition(event.target.value)}>
            <option>Condutor</option><option>Socorrista</option><option>Enfermeiro(a)</option><option>Médico(a)</option><option>Técnico(a) de enfermagem</option><option>Outro</option>
          </select>
        </> : <>
          <label htmlFor="patient-birth-date">Data de nascimento</label>
          <input id="patient-birth-date" type="date" required max={localDate} value={birthDate} onChange={event => setBirthDate(event.target.value)} />
        </>}
        <label htmlFor="registry-phone">Telefone <span className="muted">(opcional)</span></label>
        <input id="registry-phone" type="tel" maxLength={30} autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} />
        {error && <p className="error" role="alert">{error}</p>}
        {message && <p className="success" role="status">{message}</p>}
        <button className="primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar cadastro'}</button>
      </form>
    </div>

    <div className="card registry-list-card">
      <div className="registry-list-heading"><h2>{isCrew ? 'Equipe de ambulância' : 'Pacientes cadastrados'}</h2><span className="tag">{isCrew ? crew.length : patients.length}</span></div>
      {loading ? <p className="muted">Carregando…</p> : isCrew ? crew.length === 0 ? <p className="muted">Nenhum funcionário cadastrado.</p> :
        <ul className="registry-list">{crew.map(member => <li key={member.id}><strong>{member.name}</strong><span>{member.position}</span>{member.phone && <small>{member.phone}</small>}</li>)}</ul>
        : patients.length === 0 ? <p className="muted">Nenhum paciente cadastrado.</p> :
          <ul className="registry-list">{patients.map(patient => <li key={patient.id}><strong>{patient.name}</strong><span>Nascimento: {new Date(`${patient.birthDate}T12:00:00`).toLocaleDateString('pt-BR')}</span>{patient.phone && <small>{patient.phone}</small>}</li>)}</ul>}
    </div>
  </section>
}
