import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BasicProfile, EmergencyContact, getBasicProfile, getEmergencyContacts, getMedicalProfile, getPrivacyRequests, MedicalProfile, PrivacyRequest, requestPrivacyAction, saveBasicProfile, saveEmergencyContacts, saveMedicalProfile } from '../../../api'

const emptyProfile: MedicalProfile = { address: '', allergies: '', medications: '', conditions: '', notes: '' }
const emptyBasic: BasicProfile = { displayName: '', email: '', phone: '', address: '' }
const statusLabel: Record<PrivacyRequest['status'], string> = { COMPLETED: 'Concluída', PENDING: 'Aguardando análise' }

export function HealthProfilePage() {
  const [profile, setProfile] = useState(emptyProfile)
  const [basic, setBasic] = useState(emptyBasic)
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequest[]>([])
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([getBasicProfile(), getMedicalProfile(), getEmergencyContacts(), getPrivacyRequests()])
      .then(([basicProfile, medical, emergencyContacts, requests]) => {
        setBasic(basicProfile); setProfile({ ...emptyProfile, ...medical }); setContacts(emergencyContacts); setPrivacyRequests(requests)
      }).catch((e) => setError(e instanceof Error ? e.message : 'Não foi possível carregar o perfil.')).finally(() => setReady(true))
  }, [])

  async function saveBasic(event: React.FormEvent) {
    event.preventDefault()
    setError(''); setMessage(''); setBusy(true)
    try {
      const saved = await saveBasicProfile(basic)
      setBasic(saved); setProfile(current => ({ ...current, address: saved.address }))
      setMessage('Perfil básico atualizado.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o perfil.')
    } finally { setBusy(false) }
  }

  async function saveMedical(event: React.FormEvent) {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true)
    try { setProfile({ ...emptyProfile, ...await saveMedicalProfile(profile) }); setMessage('Informações de saúde atualizadas.') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar as informações.') }
    finally { setBusy(false) }
  }

  async function saveContacts(event: React.FormEvent) {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true)
    try { setContacts(await saveEmergencyContacts(contacts)); setMessage('Contatos de emergência atualizados.') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar os contatos.') }
    finally { setBusy(false) }
  }

  async function exportData() {
    setError(''); setMessage(''); setBusy(true)
    try {
      const result = await requestPrivacyAction('EXPORT')
      if (!result.export) throw new Error('Não foi possível preparar a exportação.')
      const blob = new Blob([JSON.stringify(result.export, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a'); link.href = url; link.download = 'vitalink-meus-dados.json'; link.click()
      URL.revokeObjectURL(url)
      setPrivacyRequests(await getPrivacyRequests())
      setMessage('Exportação criada e baixada neste dispositivo.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível exportar seus dados.') }
    finally { setBusy(false) }
  }

  async function requestDeletion() {
    if (!window.confirm('Solicitar a exclusão dos seus dados? A solicitação ficará pendente de análise e pode haver registros que precisem ser mantidos por obrigação de retenção.')) return
    setError(''); setMessage(''); setBusy(true)
    try {
      await requestPrivacyAction('DELETION')
      setPrivacyRequests(await getPrivacyRequests())
      setMessage('Solicitação de exclusão registrada para análise. Seus dados ainda não foram apagados.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível solicitar a exclusão.') }
    finally { setBusy(false) }
  }

  return (
    <div className="page narrow">
      <Link className="back-link" to="/patient">← Início</Link>
      <div className="eyebrow">MEU PERFIL</div>
      <h1>Meu perfil e privacidade</h1>
      <div className="notice" role="note">Use somente dados sintéticos. Informações de saúde são autodeclaradas e não verificadas; na demonstração, só são compartilhadas com central e hospital fictícios após autorização. Solicitações de exclusão são analisadas conforme retenção e obrigações aplicáveis; o pedido não apaga dados imediatamente.</div>
      {ready ? (
        <>
        <form className="card form-card" onSubmit={saveBasic}>
          <h2>Dados básicos</h2>
          <label htmlFor="display-name">Nome</label>
          <input id="display-name" autoComplete="name" maxLength={120} required value={basic.displayName} onChange={e=>setBasic({ ...basic, displayName: e.target.value })} />
          <label htmlFor="profile-email">E-mail</label>
          <input id="profile-email" type="email" value={basic.email} readOnly aria-describedby="email-note" />
          <p className="hint" id="email-note">O e-mail de acesso não pode ser alterado nesta tela.</p>
          <label htmlFor="profile-phone">Telefone</label>
          <input id="profile-phone" type="tel" autoComplete="tel" maxLength={30} value={basic.phone} onChange={e=>setBasic({ ...basic, phone: e.target.value })} />
          <label htmlFor="default-address">Endereço preferencial</label>
          <input id="default-address" autoComplete="street-address" maxLength={240} value={basic.address} onChange={e=>setBasic({ ...basic, address: e.target.value })} placeholder="Rua, número, bairro e cidade" />
          <p className="hint">Este endereço será sugerido ao registrar uma solicitação.</p>
          <button className="primary" disabled={busy || !navigator.onLine}>Salvar dados básicos</button>
        </form>

        <form className="card form-card" onSubmit={saveContacts}>
          <h2>Contatos de emergência</h2>
          <p className="hint">Opcional. Cadastre até três pessoas de confiança.</p>
          {contacts.map((contact,index) => <div className="form-section" key={contact.id || index}>
            <h3>Contato {index+1}</h3>
            <label htmlFor={`contact-name-${index}`}>Nome</label>
            <input id={`contact-name-${index}`} maxLength={120} required value={contact.name} onChange={e=>setContacts(current=>current.map((item,i)=>i===index?{...item,name:e.target.value}:item))} />
            <label htmlFor={`contact-phone-${index}`}>Telefone</label>
            <input id={`contact-phone-${index}`} type="tel" maxLength={30} required value={contact.phone} onChange={e=>setContacts(current=>current.map((item,i)=>i===index?{...item,phone:e.target.value}:item))} />
            <label htmlFor={`contact-relationship-${index}`}>Vínculo <span className="muted">(opcional)</span></label>
            <input id={`contact-relationship-${index}`} maxLength={80} value={contact.relationship} onChange={e=>setContacts(current=>current.map((item,i)=>i===index?{...item,relationship:e.target.value}:item))} />
            <button type="button" className="text-button" onClick={()=>setContacts(current=>current.filter((_,i)=>i!==index))}>Remover contato</button>
          </div>)}
          {contacts.length<3 && <button type="button" className="secondary" onClick={()=>setContacts(current=>[...current,{name:'',phone:'',relationship:''}])}>Adicionar contato</button>}
          <button className="primary full" disabled={busy || !navigator.onLine}>Salvar contatos</button>
        </form>

        <form className="card form-card" onSubmit={saveMedical}>
          <h2>Informações de saúde</h2>
          <p className="hint">Informado pelo paciente — não verificado.</p>
          <div className="form-section">
            <p>Endereço preferencial: {basic.address || 'não informado'}</p>
          </div>

          {([
            ['allergies', 'Alergias'],
            ['medications', 'Medicamentos em uso'],
            ['conditions', 'Condições informadas'],
            ['notes', 'Observações relevantes'],
          ] as const).map(([key, label]) => (
            <div className="form-section" key={key}>
              <label htmlFor={key}>{label}</label>
              <textarea
                id={key}
                rows={key === 'notes' ? 4 : 2}
                maxLength={1000}
                value={profile[key]}
                onChange={(event) => setProfile({ ...profile, [key]: event.target.value })}
              />
            </div>
          ))}

          <p className="hint">
            Última atualização: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString('pt-BR') : 'ainda não atualizada'}
          </p>
          <button className="primary" disabled={busy || !navigator.onLine}>Salvar informações de saúde</button>
        </form>
        <section className="card form-card" aria-labelledby="privacy-title">
          <h2 id="privacy-title">Seus dados</h2>
          <p>Exporte uma cópia legível em JSON ou solicite a exclusão para análise. A exportação inclui perfil, contatos e histórico de solicitações.</p>
          <div className="button-row wrap">
            <button className="secondary" type="button" onClick={()=>void exportData()} disabled={busy || !navigator.onLine}>Exportar meus dados</button>
            <button className="secondary" type="button" onClick={()=>void requestDeletion()} disabled={busy || !navigator.onLine}>Solicitar exclusão</button>
          </div>
          <h3>Solicitações de privacidade</h3>
          {privacyRequests.length===0 ? <p className="hint">Nenhuma solicitação registrada.</p> : <ul>{privacyRequests.map(r=><li key={r.id}>{r.type==='EXPORT'?'Exportação':'Exclusão'} · {statusLabel[r.status]} · {new Date(r.createdAt).toLocaleString('pt-BR')}</li>)}</ul>}
        </section>
        {message && <p className="success-text" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        </>
      ) : error ? (
        <p className="error" role="alert">{error}</p>
      ) : (
        <p role="status">Carregando perfil…</p>
      )}
    </div>
  )
}
