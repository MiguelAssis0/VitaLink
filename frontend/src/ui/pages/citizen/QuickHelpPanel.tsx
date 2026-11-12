import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEmergencyContacts, getNearestHospital, type EmergencyContact, type NearestHospital } from '../../../api'
import './QuickHelpPanel.css'

type QuickHelpPanelProps = {
  open: boolean
  onClose: () => void
}

function phoneLink(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits ? `tel:${phone.trim().startsWith('+') ? '+' : ''}${digits}` : undefined
}

export function QuickHelpPanel({ open, onClose }: QuickHelpPanelProps) {
  const [contacts, setContacts] = useState<EmergencyContact[] | null>(null)
  const [nearestHospital, setNearestHospital] = useState<NearestHospital | null>(null)
  const [locationStatus, setLocationStatus] = useState('')
  const [findingHospital, setFindingHospital] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || contacts !== null || unavailable) return
    setLoading(true)
    void getEmergencyContacts()
      .then(setContacts)
      .catch(() => setUnavailable(true))
      .finally(() => setLoading(false))
  }, [open, contacts, unavailable])

  useEffect(() => {
    if (!open) {
      setNearestHospital(null)
      setLocationStatus('')
    }
  }, [open])

  function findNearestHospital() {
    if (!navigator.geolocation) {
      setLocationStatus('Este navegador não oferece acesso à localização.')
      return
    }
    setFindingHospital(true)
    setNearestHospital(null)
    setLocationStatus('Aguardando permissão de localização…')
    navigator.geolocation.getCurrentPosition(async position => {
      const current = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }
      setLocationStatus('Localização obtida. Procurando o hospital mais próximo…')
      try {
        const hospital = await getNearestHospital(current.latitude, current.longitude)
        setNearestHospital(hospital)
        setLocationStatus(`Localização obtida com precisão aproximada de ${Math.round(current.accuracy)} m.`)
      } catch {
        setLocationStatus('Localização obtida, mas não foi possível encontrar um hospital com endereço geográfico cadastrado.')
      } finally {
        setFindingHospital(false)
      }
    }, () => {
      setFindingHospital(false)
      setLocationStatus('Não foi possível obter a localização. Confira a permissão do aparelho e tente novamente.')
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 })
  }

  const distance = nearestHospital && (nearestHospital.distanceMeters < 1000
    ? `${nearestHospital.distanceMeters} m em linha reta`
    : `${(nearestHospital.distanceMeters / 1000).toFixed(1)} km em linha reta`)

  return (
    <section id="quick-help-panel" className="quick-help-panel card" aria-labelledby="quick-help-title" hidden={!open}>
      <div className="quick-help-heading">
        <div>
          <h2 id="quick-help-title">Ajuda rápida</h2>
        </div>
        <button className="text-button" type="button" onClick={onClose} aria-label="Fechar ajuda rápida">Fechar</button>
      </div>
      <Link className="primary full quick-help-dispatch" to="/patient/request" onClick={onClose}>Solicitar ajuda agora</Link>
      <a className="quick-help-192" href="tel:192">Ligar 192</a>
      <div className="nearest-hospital">
        <button className="secondary" type="button" onClick={findNearestHospital} disabled={findingHospital}>
          {findingHospital ? 'Localizando…' : 'Localizar hospital mais próximo'}
        </button>
        {locationStatus && <p className="hint" role="status">{locationStatus}</p>}
        {nearestHospital && <div className="nearest-hospital-result">
          <strong>{nearestHospital.name}</strong>
          <span>{distance}</span>
          <div className="quick-help-contact-actions">
            {phoneLink(nearestHospital.phone) && <a className="secondary" href={phoneLink(nearestHospital.phone)}>Ligar para o hospital</a>}
            <a className="secondary" href={`https://www.google.com/maps/dir/?api=1&destination=${nearestHospital.latitude},${nearestHospital.longitude}`} target="_blank" rel="noreferrer">Ver rota</a>
          </div>
        </div>}
      </div>
      <h3>Contatos de emergência</h3>
      {loading && <p role="status">Carregando contatos…</p>}
      {unavailable && <p role="status">Não foi possível carregar seus contatos agora.</p>}
      {contacts?.length === 0 && <p>Você ainda não cadastrou contatos de emergência.</p>}
      {contacts && contacts.length > 0 && (
        <ul className="quick-help-contacts">
          {contacts.map((contact) => {
            const href = phoneLink(contact.phone)
            return (
              <li key={contact.id || `${contact.name}-${contact.phone}`}>
                <span><strong>{contact.name}</strong>{contact.relationship && <small>{contact.relationship}</small>}</span>
                <span className="quick-help-contact-actions">
                  {href ? <a className="secondary" href={href}>Ligar</a> : <span className="muted">Telefone indisponível</span>}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      <Link className="back-link" to="/patient/profile" onClick={onClose}>Gerenciar contatos</Link>
    </section>
  )
}
