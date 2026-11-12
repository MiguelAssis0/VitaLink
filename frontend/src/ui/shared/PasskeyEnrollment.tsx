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
      <button className="text-button" type="button" onClick={() => void enroll()} disabled={busy}>
        {busy ? 'Ativando…' : 'Ativar biometria'}
      </button>
      {message && <small role="status">{message}</small>}
    </div>
  )
}
