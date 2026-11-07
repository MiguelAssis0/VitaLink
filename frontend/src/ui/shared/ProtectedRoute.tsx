import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { User } from '../../api'
import { roleHome } from './role-home'

export function ProtectedRoute({ user, role, children }: { user: User | null; role: User['role']; children: ReactNode }) {
  if (!user) return <Navigate to="/" replace />
  return user.role === role ? <>{children}</> : <Navigate to={roleHome(user.role)} replace />
}
