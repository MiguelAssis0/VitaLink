import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { register } from '../../api'
import PasswordInput from '../shared/PasswordInput'

type RegisterPageProps = {
  onRegistered?: (message: string) => void
}

const passwordPattern = '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}'
const passwordHelp = 'Use pelo menos 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.'

export function RegisterPage({ onRegistered }: RegisterPageProps = {}) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adultConfirmed, setAdultConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      const result = await register(displayName, email, password, adultConfirmed)
      setSuccess(result.message)
      onRegistered?.(result.message)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar a conta.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page narrow">
      <Link className="back-link" to="/">← Voltar para entrar</Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONTA DO CIDADÃO</span>
          <h1>Criar conta de cidadão</h1>
          <p>O cadastro é destinado a pessoas com 18 anos ou mais.</p>
        </div>
      </div>

      <form className="form-card card" onSubmit={submit}>
        <label htmlFor="register-name">Nome</label>
        <input
          id="register-name"
          name="displayName"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          autoComplete="name"
          maxLength={120}
          required
        />

        <label htmlFor="register-email">E-mail</label>
        <input
          id="register-email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          maxLength={254}
          required
        />

        <label htmlFor="register-password">Senha</label>
        <PasswordInput
          id="register-password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={8}
          maxLength={200}
          pattern={passwordPattern}
          title={passwordHelp}
        />
        <p className="hint" id="register-password-hint">{passwordHelp}</p>

        <label className="check-row" htmlFor="adult-confirmed">
          <input
            id="adult-confirmed"
            name="adultConfirmed"
            type="checkbox"
            checked={adultConfirmed}
            onChange={(event) => setAdultConfirmed(event.target.checked)}
            required
          />
          <span>Confirmo que tenho 18 anos ou mais.</span>
        </label>

        <p className="hint">O cadastro não envia confirmação por e-mail.</p>
        {error && <p className="error" role="alert">{error}</p>}
        {success && <p className="info-card success-text" role="status">{success}</p>}
        <button className="primary full" type="submit" disabled={busy || !adultConfirmed}>
          {busy ? 'Criando conta…' : 'Criar conta'}
        </button>
        <p className="hint">Já tem uma conta? <Link to="/">Entrar</Link></p>
      </form>
    </section>
  )
}
