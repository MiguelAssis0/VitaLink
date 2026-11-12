import { useState } from 'react'
import { registerPasskey } from './passkeys'
import './PasskeyEnrollment.css'

export function PasskeyEnrollment() {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function enroll() {
    setBusy(true)
    setMessage('')
    try {
      await registerPasskey()
      setMessage('Acesso biométrico ativado neste aparelho.')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Não foi possível ativar o acesso biométrico.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="passkey-enrollment">
      <button className="text-button" type="button" aria-label={busy ? 'Ativando biometria' : 'Ativar biometria'} onClick={() => void enroll()} disabled={busy}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5z" /><circle cx="12" cy="15" r="1.5" /></svg>
        <span className="passkey-action-label">{busy ? 'Ativando…' : 'Ativar biometria'}</span>
      </button>
      {message && <small role="status">{message}</small>}
    </div>
  )
}
