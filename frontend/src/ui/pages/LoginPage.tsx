import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { login, type User } from '../../api'
import PasswordInput from '../shared/PasswordInput'

type LoginPageProps = {
  onLogin: (user: User) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      onLogin(await login(email, password))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível acessar sua conta.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-grid">
      <section className="hero" aria-labelledby="login-title">
        <span className="eyebrow">CIDADÃO</span>
        <h1 id="login-title">Informações úteis, quando cada minuto importa.</h1>
        <p>Organize suas informações e gerencie seus dados com segurança.</p>
      </section>

      <section className="login-card card" aria-labelledby="login-form-title">
        <span className="eyebrow">ÁREA DO CIDADÃO</span>
        <h2 id="login-form-title">Acessar minha conta</h2>
        <form onSubmit={submit}>
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Senha</label>
          <PasswordInput
            id="login-password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary full" type="submit" disabled={busy}>
            {busy ? 'Acessando…' : 'Entrar'}
          </button>
        </form>
        <p className="hint">Ainda não tem conta? <Link to="/register">Criar conta de cidadão</Link></p>
      </section>
    </div>
  )
}
