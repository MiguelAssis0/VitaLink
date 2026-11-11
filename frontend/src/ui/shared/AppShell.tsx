import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '../../api'
import { roleHome } from './role-home'

type AppShellProps = {
  children: ReactNode
  user: User | null
  offline: boolean
  onSignOut?: () => void
}

export function AppShell({ children, user, offline, onSignOut }: AppShellProps) {
  return (
    <>
      <header className="topbar">
        <Link to={user ? roleHome(user.role) : '/'} className="brand">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>VitaLink</span>
        </Link>
        {user && <button className="text-button" onClick={onSignOut}>Sair</button>}
      </header>

      {offline && <div className="offline global-offline" role="status">Sem conexão: pedidos não podem ser enviados.</div>}
      <main>{children}</main>

      <footer className="emergency-footer">
        <div>
          <strong>Precisa de atendimento agora?</strong>
          <span>Somente ligar para 192 realiza contato com o serviço de emergência.</span>
        </div>
        <a className="phone-link" href="tel:192">Ligar 192</a>
      </footer>
    </>
  )
}
