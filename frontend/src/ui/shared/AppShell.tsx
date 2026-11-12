import { useLayoutEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { User } from '../../api'
import { roleHome } from './role-home'
import { PasskeyEnrollment } from './PasskeyEnrollment'
import './AppShell.css'

type AppShellProps = {
  children: ReactNode
  user: User | null
  offline: boolean
  onSignOut?: () => void
}

export function AppShell({ children, user, offline, onSignOut }: AppShellProps) {
  const location = useLocation()
  const isLoginPage = !user && location.pathname === '/'
  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem('vitalink-login-theme') === 'dark')
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = darkTheme ? 'dark' : 'light'
  }, [darkTheme])
  const roleName = user ? ({
    PATIENT: 'Cidadão', DISPATCHER: 'Central', HOSPITAL_STAFF: 'Hospital', DEMO_ADMIN: 'Administração',
  } as const)[user.role] : ''

  return (
    <>
      <header className={`topbar app-topbar${isLoginPage ? ' login-topbar' : ''}${user ? ' authenticated-topbar' : ''}`}>
        <div className="app-topbar-inner">
          <Link to={user ? roleHome(user.role) : '/'} className="brand">
            <span className="brand-mark" aria-hidden="true">V</span>
            <span className="brand-name">VitaLink</span>
          </Link>
          <button
            className="login-theme-toggle"
            type="button"
            aria-label={`Ativar tema ${darkTheme ? 'claro' : 'escuro'}`}
            onClick={() => setDarkTheme((current) => {
              const next = !current
              localStorage.setItem('vitalink-login-theme', next ? 'dark' : 'light')
              return next
            })}
          >
            {darkTheme ? (
              <><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.07 7.07-1.42-1.42M6.35 6.35 4.93 4.93m14.14 0-1.42 1.42M6.35 17.65l-1.42 1.42" /></svg>Tema claro</>
            ) : (
              <><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" /></svg>Tema escuro</>
            )}
          </button>
          {user && <details className="account-menu" onClick={(event) => {
            if ((event.target as HTMLElement).closest('.account-dropdown a')) event.currentTarget.open = false
          }}>
            <summary className="account-summary" aria-label={`Conta de ${user.displayName}`}>
              <span className="account-avatar" aria-hidden="true">{user.displayName.trim().charAt(0).toLocaleUpperCase('pt-BR')}</span>
              <span className="account-copy"><strong>{user.displayName}</strong><small>{roleName}</small></span>
              <svg className="account-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
              <span className="account-hamburger" aria-hidden="true"><i /><i /><i /></span>
            </summary>
            <div className="account-dropdown">
              <div className="account-dropdown-heading"><strong>{user.displayName}</strong><small>{roleName}</small></div>
              {user.role === 'PATIENT' && <Link to="/patient/profile">Meu perfil</Link>}
              <PasskeyEnrollment />
              <button className="account-logout" type="button" onClick={onSignOut}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>
                Sair da conta
              </button>
            </div>
          </details>}
        </div>
      </header>

      {offline && <div className="offline global-offline" role="status">Sem conexão: pedidos não podem ser enviados.</div>}
      <main className={isLoginPage ? `login-main${darkTheme ? ' login-dark' : ''}` : undefined}>{children}</main>

      <footer className={`emergency-footer${isLoginPage && darkTheme ? ' login-footer-dark' : ''}`}>
        <div>
          <strong>Precisa de atendimento agora?</strong>
          <span>Somente ligar para 192 realiza contato com o serviço de emergência.</span>
        </div>
        <a className="phone-link" href="tel:192">Ligar 192</a>
      </footer>
    </>
  )
}
