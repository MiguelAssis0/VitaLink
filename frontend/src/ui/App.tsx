import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { getMe, logout } from '../api'
import type { User } from '../api'
import { CentralPage } from './pages/operations/CentralPage'
import { HospitalPage } from './pages/operations/HospitalPage'
import { CitizenHomePage } from './pages/citizen/CitizenHomePage'
import { EmergencyRequestPage } from './pages/citizen/EmergencyRequestPage'
import { HealthProfilePage } from './pages/citizen/HealthProfilePage'
import { EmergencyDetailsPage } from './pages/citizen/EmergencyDetailsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AppShell } from './shared/AppShell'
import { isOffline } from './shared/is-offline'
import { ProtectedRoute } from './shared/ProtectedRoute'
import { roleHome } from './shared/role-home'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [offline, setOffline] = useState(isOffline())
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    getMe().then(setUser).catch(() => setUser(null)).finally(() => setAuthReady(true))
  }, [])

  useEffect(() => {
    const update = () => setOffline(isOffline())
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  async function signOut() {
    try {
      await logout()
    } finally {
      setUser(null)
      navigate('/')
    }
  }

  if (!authReady) {
    return <AppShell user={null} offline={offline}><p role="status">Verificando sessão…</p></AppShell>
  }

  const signIn = (nextUser: User) => {
    setUser(nextUser)
    navigate(roleHome(nextUser.role), { replace: true })
  }

  return (
    <AppShell user={user} offline={offline} onSignOut={signOut}>
      <Routes>
        <Route path="/" element={user ? <Navigate to={roleHome(user.role)} replace /> : <LoginPage onLogin={signIn} />} />
        <Route path="/register" element={user ? <Navigate to={roleHome(user.role)} replace /> : <RegisterPage />} />
        <Route path="/patient" element={<ProtectedRoute user={user} role="PATIENT"><CitizenHomePage /></ProtectedRoute>} />
        <Route path="/patient/request" element={<ProtectedRoute user={user} role="PATIENT"><EmergencyRequestPage /></ProtectedRoute>} />
        <Route path="/patient/profile" element={<ProtectedRoute user={user} role="PATIENT"><HealthProfilePage /></ProtectedRoute>} />
        <Route path="/patient/emergencies/:id" element={<ProtectedRoute user={user} role="PATIENT"><EmergencyDetailsPage /></ProtectedRoute>} />
        <Route path="/central" element={<ProtectedRoute user={user} role="DISPATCHER"><CentralPage /></ProtectedRoute>} />
        <Route path="/hospital" element={<ProtectedRoute user={user} role="HOSPITAL_STAFF"><HospitalPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={user ? roleHome(user.role) : '/'} replace state={{ from: location.pathname }} />} />
      </Routes>
    </AppShell>
  )
}
