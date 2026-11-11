import { useState } from 'react'

type Caller = 'Central' | 'Hospital'
type Call = { id: number; caller: Caller; direction: 'Recebida' | 'Realizada'; result: 'Atendida' | 'Recusada' | 'Encerrada' }
type ActiveCall = { caller: Caller; direction: Call['direction']; connected: boolean }

export function MockCallsPanel() {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [history, setHistory] = useState<Call[]>([])

  function start(caller: Caller, direction: Call['direction']) {
    setActiveCall({ caller, direction, connected: direction === 'Realizada' })
  }

  function finish(result: Call['result']) {
    if (!activeCall) return
    setHistory(current => [{ id: Date.now(), caller: activeCall.caller, direction: activeCall.direction, result }, ...current].slice(0, 5))
    setActiveCall(null)
  }

  return <section className="mock-call-card card" aria-labelledby="mock-call-title">
    <div className="mock-call-heading">
      <div>
        <h2 id="mock-call-title">Ligações</h2>
      </div>
    </div>
    <p className="muted">Converse com a central ou o hospital.</p>

    {activeCall ? <div className="mock-call-active" role="status" aria-live="polite">
      <span className={`mock-call-indicator${activeCall.connected ? ' connected' : ''}`} aria-hidden="true" />
      <div className="mock-call-copy">
        <strong>{activeCall.caller}</strong>
        <span>{activeCall.connected ? 'Ligação em andamento' : 'Chamada recebida'}</span>
      </div>
      <div className="mock-call-actions">
        {!activeCall.connected && <>
          <button className="primary" type="button" onClick={() => setActiveCall({ ...activeCall, connected: true })}>Atender</button>
          <button className="secondary" type="button" onClick={() => finish('Recusada')}>Recusar</button>
        </>}
        {activeCall.connected && <button className="secondary" type="button" onClick={() => finish('Encerrada')}>Encerrar</button>}
      </div>
    </div> : <div className="mock-call-options">
      <button className="secondary" type="button" onClick={() => start('Central', 'Recebida')}>Chamada da central</button>
      <button className="secondary" type="button" onClick={() => start('Hospital', 'Recebida')}>Chamada do hospital</button>
      <button className="text-button" type="button" onClick={() => start('Central', 'Realizada')}>Ligar para a central</button>
    </div>}

    {history.length > 0 && <div className="mock-call-history">
      <h3>Histórico desta sessão</h3>
      <ul>
        {history.map(call => <li key={call.id}>
          <span><strong>{call.caller}</strong><small>{call.direction}</small></span>
          <span className="mock-call-result">{call.result}</span>
        </li>)}
      </ul>
    </div>}
  </section>
}
