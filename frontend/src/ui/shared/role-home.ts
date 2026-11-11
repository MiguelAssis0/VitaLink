import type { User } from '../../api'

export function roleHome(role: User['role']) {
  if (role === 'PATIENT') return '/patient'
  if (role === 'DISPATCHER') return '/central'
  if (role === 'HOSPITAL_STAFF') return '/hospital'
  return '/admin'
}
