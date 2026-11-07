import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMedicalProfile, MedicalProfile, saveMedicalProfile } from '../../../api'

const emptyProfile: MedicalProfile = { address: '', allergies: '', medications: '', conditions: '', notes: '' }

export function HealthProfilePage() {
  const [profile, setProfile] = useState(emptyProfile)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getMedicalProfile().then((value) => setProfile({ ...emptyProfile, ...value })).catch((e) => setError(e instanceof Error ? e.message : 'Não foi possível carregar o perfil.')).finally(() => setReady(true))
  }, [])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      setProfile({ ...emptyProfile, ...await saveMedicalProfile(profile) })
      setMessage('Perfil atualizado.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar as informações.')
    }
  }

  return (
    <div className="page narrow">
      <Link className="back-link" to="/patient">← Início</Link>
      <div className="eyebrow">MEU PERFIL</div>
      <h1>Endereço e informações de saúde</h1>
      {ready ? (
        <form className="card form-card" onSubmit={save}>
          <div className="form-section">
            <label htmlFor="default-address">Endereço padrão</label>
            <input
              id="default-address"
              autoComplete="street-address"
              maxLength={240}
              value={profile.address || ''}
              onChange={(event) => setProfile({ ...profile, address: event.target.value })}
              placeholder="Rua, número, bairro e cidade"
            />
            <p className="hint">Este endereço será sugerido ao registrar uma solicitação.</p>
          </div>

          {([
            ['allergies', 'Alergias'],
            ['medications', 'Medicamentos em uso'],
            ['conditions', 'Condições informadas'],
            ['notes', 'Observações relevantes'],
          ] as const).map(([key, label]) => (
            <div className="form-section" key={key}>
              <label htmlFor={key}>{label}</label>
              <textarea
                id={key}
                rows={key === 'notes' ? 4 : 2}
                maxLength={1000}
                value={profile[key]}
                onChange={(event) => setProfile({ ...profile, [key]: event.target.value })}
              />
            </div>
          ))}

          <p className="hint">
            Última atualização: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString('pt-BR') : 'ainda não atualizada'}
          </p>
          {message && <p className="success-text" role="status">{message}</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={!navigator.onLine}>Salvar informações</button>
        </form>
      ) : error ? (
        <p className="error" role="alert">{error}</p>
      ) : (
        <p role="status">Carregando perfil…</p>
      )}
    </div>
  )
}
