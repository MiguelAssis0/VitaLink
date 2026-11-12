import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { User } from '../../api'
import { roleHome } from './role-home'
import { PasskeyEnrollment } from './PasskeyEnrollment'

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

  return (
    <>
      <header className={`topbar${isLoginPage ? ' login-topbar' : ''}`}>
        <Link to={user ? roleHome(user.role) : '/'} className="brand">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>VitaLink</span>
        </Link>
        {isLoginPage && (
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
        )}
        {user && <div className="head-actions"><PasskeyEnrollment /><button className="text-button" onClick={onSignOut}>Sair</button></div>}
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
