import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { login, type User } from '../../api'
import PasswordInput from '../shared/PasswordInput'
import { authenticatePasskey } from '../shared/passkeys'
import './LoginPage.css'

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

  async function submitPasskey() {
    setError('')
    setBusy(true)
    try {
      onLogin(await authenticatePasskey())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar com biometria.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-shell">
      <section className="login-intro" aria-labelledby="login-title">
        <p className="login-kicker"><span className="login-monogram" aria-hidden="true">V</span> VitaLink <span className="login-kicker-divider">/</span> Área do cidadão</p>
        <h1 id="login-title">Suas informações, sempre à mão.</h1>
        <p className="login-lede">Organize seu perfil e acompanhe solicitações demonstrativas em um só lugar.</p>

        <div className="login-points" aria-label="Sobre o VitaLink">
          <div className="login-point">
            <span className="login-point-number" aria-hidden="true">01</span>
            <span><strong>Você no controle</strong><small>Revise e atualize seu perfil quando precisar.</small></span>
          </div>
          <div className="login-point">
            <span className="login-point-number" aria-hidden="true">02</span>
            <span><strong>Clareza em cada etapa</strong><small>Acompanhe o histórico das suas simulações.</small></span>
          </div>
        </div>

        <p className="login-simulation-note"><span aria-hidden="true">i</span><span><strong>Ambiente de demonstração.</strong> Não aciona ambulâncias reais. Em uma emergência, ligue 192.</span></p>
      </section>

      <section className="login-panel card" aria-labelledby="login-form-title">
        <span className="login-panel-kicker">Bem-vindo de volta</span>
        <h2 id="login-form-title">Acessar minha conta</h2>
        <p className="login-panel-caption">Entre com seus dados para continuar.</p>
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
        <button className="secondary full login-passkey" type="button" onClick={() => void submitPasskey()} disabled={busy}>
          {busy ? 'Verificando…' : 'Entrar com biometria'}
        </button>
        <p className="login-reset-link"><Link to="/reset-password">Esqueci minha senha</Link></p>
        <p className="login-register-link">Ainda não tem conta? <Link to="/register">Criar conta</Link></p>
      </section>
    </div>
  )
}
