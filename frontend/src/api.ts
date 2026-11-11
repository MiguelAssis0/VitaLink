export type Role = 'PATIENT' | 'DISPATCHER' | 'HOSPITAL_STAFF' | 'DEMO_ADMIN'
export type User = { id: string; displayName: string; email: string; role: Role; institutionName?: string }
export type Emergency = {
  id: string; status: string; simulation: boolean; createdAt: string; version?: number
  address?: string; reference?: string; locationSource?: string; latitude?: number; longitude?: number; accuracyMeters?: number
  notes?: string; hospitalName?: string
}
export type TimelineEvent = { oldStatus: string | null; status: string | null; actorRole: Role; actorLabel: string; occurredAt: string }
export type MedicalProfile = { address?: string; allergies: string; medications: string; conditions: string; notes: string; updatedAt?: string }
export type BasicProfile = { displayName: string; email: string; phone: string; address: string }
export type EmergencyContact = { id?: string; name: string; phone: string; relationship: string }
export type PrivacyRequest = { id: string; type: 'EXPORT' | 'DELETION'; status: 'COMPLETED' | 'PENDING'; createdAt: string; completedAt?: string }
export type AdminOverview = { users: number; institutions: number; emergencies: number; openEmergencies: number; pendingDeletions: number }
export type Ambulance = { id: string; code: string; status: 'AVAILABLE' | 'OCCUPIED' | 'OUT_OF_SERVICE' }
export type AmbulanceCrewMember = { id: string; name: string; position: string; phone: string; createdAt: string }
export type HospitalPatient = { id: string; name: string; birthDate: string; phone: string; createdAt: string }

const base = '/api/v1'
let csrfValue = ''
let csrfHeaderName = 'X-XSRF-TOKEN'
let csrfBootstrap: Promise<void> | undefined

async function ensureCsrf() {
  if (csrfValue) return
  csrfBootstrap ||= fetch(`${base}/auth/csrf`, { credentials: 'include', cache: 'no-store' }).then(async (response) => {
    if (!response.ok) throw new Error('Não foi possível validar a sessão segura.')
    const body = await response.json() as { token: string; headerName?: string }
    csrfValue = body.token
    csrfHeaderName = body.headerName || csrfHeaderName
  }).finally(() => { csrfBootstrap = undefined })
  await csrfBootstrap
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (init.method && !['GET', 'HEAD', 'OPTIONS'].includes(init.method.toUpperCase())) {
    await ensureCsrf()
    headers.set(csrfHeaderName, csrfValue)
  }
  let response: Response
  try { response = await fetch(`${base}${path}`, { ...init, headers, credentials: 'include', cache: 'no-store' }) }
  catch { throw new Error('Sem conexão com o VitaLink. Em uma emergência real, ligue 192.') }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || body.title || `Não foi possível concluir a operação (${response.status}).`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const getMe = () => api<User>('/auth/me')
export const login = (email: string, password: string) => api<User>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
export const register = (displayName: string, email: string, password: string, adultConfirmed: boolean) => api<{ message: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ displayName, email, password, adultConfirmed }) })
export const requestPasswordReset = (email: string) => api<{ message: string }>('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) })
export const confirmPasswordReset = (token: string, password: string) => api<void>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) })
export const logout = () => api<void>('/auth/logout', { method: 'POST' })
export const getMine = () => api<Emergency[] | { content: Emergency[] }>('/emergencies/mine')
export const getCentral = () => api<Emergency[] | { content: Emergency[] }>('/central/emergencies')
export const getHospital = () => api<Emergency[] | { content: Emergency[] }>('/hospital/emergencies')
export const getEmergency = (id: string) => api<Emergency>(`/emergencies/${encodeURIComponent(id)}`)
export const getEvents = (id: string) => api<TimelineEvent[]>(`/emergencies/${encodeURIComponent(id)}/events`)
export const getMedicalSummary = (id: string) => api<MedicalProfile>(`/hospital/emergencies/${encodeURIComponent(id)}/medical-summary`)
export const getMedicalProfile = () => api<MedicalProfile>('/patients/me/medical-profile')
export const saveMedicalProfile = (profile: MedicalProfile) => api<MedicalProfile>('/patients/me/medical-profile', { method: 'PUT', body: JSON.stringify(profile) })
export const getBasicProfile = () => api<BasicProfile>('/patients/me')
export const saveBasicProfile = (profile: BasicProfile) => api<BasicProfile>('/patients/me', { method: 'PUT', body: JSON.stringify(profile) })
export const getEmergencyContacts = () => api<EmergencyContact[]>('/patients/me/emergency-contacts')
export const saveEmergencyContacts = (contacts: EmergencyContact[]) => api<EmergencyContact[]>('/patients/me/emergency-contacts', { method: 'PUT', body: JSON.stringify(contacts.map(({ name, phone, relationship }) => ({ name, phone, relationship }))) })
export const getPrivacyRequests = () => api<PrivacyRequest[]>('/patients/me/privacy-requests')
export const getAdminOverview = () => api<AdminOverview>('/admin/overview')
export const getAmbulances = () => api<Ambulance[]>('/central/ambulances')
export const addAmbulance = (code: string) => api<Ambulance>('/central/ambulances', { method: 'POST', body: JSON.stringify({ code }) })
export const updateAmbulanceStatus = (id: string, status: Ambulance['status']) => api<Ambulance>(`/central/ambulances/${encodeURIComponent(id)}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
export const getAmbulanceCrew = () => api<AmbulanceCrewMember[]>('/hospital/ambulance-crew')
export const addAmbulanceCrewMember = (member: Omit<AmbulanceCrewMember, 'id' | 'createdAt'>) => api<AmbulanceCrewMember>('/hospital/ambulance-crew', { method: 'POST', body: JSON.stringify(member) })
export const getHospitalPatients = () => api<HospitalPatient[]>('/hospital/patients')
export const addHospitalPatient = (patient: Omit<HospitalPatient, 'id' | 'createdAt'>) => api<HospitalPatient>('/hospital/patients', { method: 'POST', body: JSON.stringify(patient) })
export const requestPrivacyAction = (type: PrivacyRequest['type']) => api<{ request: PrivacyRequest; export: unknown | null }>('/patients/me/privacy-requests', { method: 'POST', body: JSON.stringify({ type }) })

export function createEmergency(payload: { location: { source: 'MANUAL' | 'BROWSER'; address: string; reference: string; latitude?: number; longitude?: number; accuracyMeters?: number }; notes: string }, idempotencyKey: string) {
  return api<Emergency>('/emergencies', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(payload) })
}
export const transition = (id: string, status: string, expectedVersion: number) => api<Emergency>(`/central/emergencies/${encodeURIComponent(id)}/transitions`, { method: 'POST', body: JSON.stringify({ status, expectedVersion }) })
export const assignHospital = (id: string, hospitalInstitutionId: string) => api<void>(`/central/emergencies/${encodeURIComponent(id)}/hospital-assignment`, { method: 'POST', body: JSON.stringify({ hospitalInstitutionId }) })
export const requestCancel = (id: string) => api<void>(`/emergencies/${encodeURIComponent(id)}/request-cancel`, { method: 'POST' })

export const list = <T,>(value: T[] | { content: T[] } | undefined): T[] => Array.isArray(value) ? value : value?.content || []
