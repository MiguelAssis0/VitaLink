import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { confirmPasswordReset, requestPasswordReset } from '../../api'
import PasswordInput from '../shared/PasswordInput'

const passwordPattern='(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}'
const passwordHelp='Use pelo menos 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.'

export function PasswordResetPage() {
  const [token]=useState(() => new URLSearchParams(window.location.search).get('token') || new URLSearchParams(window.location.hash.slice(1)).get('token') || '')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [success,setSuccess]=useState(false)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)

  useEffect(() => {
    if (token) {
      const url=new URL(window.location.href)
      url.searchParams.delete('token'); url.hash=''
      window.history.replaceState(null,'',url.pathname+url.search)
    }
  },[token])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      if (token) { await confirmPasswordReset(token,password); setSuccess(true) }
      else { await requestPasswordReset(email); setSuccess(true) }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a solicitação.')
    } finally { setBusy(false) }
  }

  return <section className="page narrow">
    <Link className="back-link" to="/">← Voltar para entrar</Link>
    <div className="page-heading"><div>
      <span className="eyebrow">SEGURANÇA DA CONTA</span>
      <h1>{token ? 'Criar nova senha' : 'Recuperar senha'}</h1>
      <p>{token ? 'Escolha uma senha nova para sua conta.' : 'Enviaremos um link se houver uma conta associada ao email.'}</p>
    </div></div>
    <form className="form-card card" onSubmit={submit}>
      {!token ? <>
        <label htmlFor="reset-email">E-mail</label>
        <input id="reset-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={event=>setEmail(event.target.value)} />
      </> : <>
        <label htmlFor="reset-password">Nova senha</label>
        <PasswordInput id="reset-password" value={password} onChange={setPassword} autoComplete="new-password" minLength={8} maxLength={200} pattern={passwordPattern} title={passwordHelp} />
        <p className="hint" id="reset-password-hint">{passwordHelp}</p>
      </>}
      {error && <p className="error" role="alert">{error}</p>}
      {success && <p className="success-text" role="status">{token ? 'Senha atualizada. Você já pode entrar com a nova senha.' : 'Se o email estiver cadastrado, enviaremos um link. Na demonstração local, confira a caixa de entrada em localhost:8025.'}</p>}
      {!success && <button className="primary full" type="submit" disabled={busy}>{busy ? 'Aguarde…' : token ? 'Atualizar senha' : 'Enviar link de recuperação'}</button>}
      {success && token && <Link className="primary full" to="/">Ir para entrar</Link>}
    </form>
  </section>
}
