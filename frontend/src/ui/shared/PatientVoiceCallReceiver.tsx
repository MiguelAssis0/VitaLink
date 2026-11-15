import { useEffect, useRef, useState } from 'react'
import { connectVoiceCall, declineVoiceCall, endVoiceCall, getIncomingVoiceCall, sendVoiceAnswer, type VoiceCall } from '../../api'
import { closeVoicePeer, createVoicePeer, waitForIce } from './browser-voice-call'
import './VoiceCall.css'

export function PatientVoiceCallReceiver() {
  const [call, setCall] = useState<VoiceCall | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const audio = useRef<HTMLAudioElement>(null)
  const peer = useRef<RTCPeerConnection | null>(null)
  const stream = useRef<MediaStream | null>(null)
  function cleanup() {
    const wasConnected = Boolean(peer.current || stream.current)
    closeVoicePeer(peer.current, stream.current, audio.current)
    peer.current = null; stream.current = null
    if (wasConnected) window.dispatchEvent(new Event('vitalink:dispatcher-call-ended'))
  }

  useEffect(() => {
    const poll = () => void getIncomingVoiceCall().then(latest => {
      setCall(latest)
      if (!latest || latest.status === 'ENDED' || latest.status === 'DECLINED') cleanup()
    }).catch(() => {})
    poll()
    const timer = window.setInterval(poll, 1500)
    return () => { window.clearInterval(timer); cleanup() }
  }, [])

  async function answer() {
    if (!call?.offer) return
    setBusy(true); setError('')
    try {
      const media = await createVoicePeer(audio.current!, () => {
        window.dispatchEvent(new Event('vitalink:dispatcher-call-connected'))
        void connectVoiceCall(call.id).then(setCall).catch(() => {})
      })
      peer.current = media.peer; stream.current = media.stream
      await media.peer.setRemoteDescription({ type: 'offer', sdp: call.offer })
      const answer = await media.peer.createAnswer()
      await media.peer.setLocalDescription(answer)
      await waitForIce(media.peer)
      const updated = await sendVoiceAnswer(call.id, media.peer.localDescription?.sdp || answer.sdp || '')
      setCall(updated)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atender a chamada.')
      cleanup()
    } finally { setBusy(false) }
  }

  async function decline() {
    if (!call) return
    await declineVoiceCall(call.id).catch(() => {})
    cleanup(); setCall(current => current ? { ...current, status: 'DECLINED' } : null)
  }

  async function hangup() {
    if (!call) return
    await endVoiceCall(call.id).catch(() => {})
    cleanup(); setCall(current => current ? { ...current, status: 'ENDED' } : null)
  }

  const visible = call && call.status !== 'ENDED' && call.status !== 'DECLINED'
  return visible ? <aside className="patient-voice-call" role="dialog" aria-labelledby="voice-call-title">
    <audio ref={audio} autoPlay playsInline />
    <span className="eyebrow">CHAMADA DA CENTRAL · SIMULAÇÃO</span>
    <h2 id="voice-call-title">A central quer falar com você</h2>
    <p>Esta chamada usa o microfone e o alto-falante deste aparelho. Não é uma ligação para serviços reais.</p>
    {call.status === 'CONNECTED' ? <button className="secondary" type="button" onClick={() => void hangup()}>Encerrar chamada</button> : <div className="button-row">
      <button className="primary" type="button" disabled={!call.offer || busy} onClick={() => void answer()}>{busy ? 'Conectando…' : call.offer ? 'Atender' : 'Conectando…'}</button>
      <button className="secondary" type="button" onClick={() => void decline()}>Recusar</button>
    </div>}
    {error && <p className="error" role="alert">{error}</p>}
  </aside> : null
}
