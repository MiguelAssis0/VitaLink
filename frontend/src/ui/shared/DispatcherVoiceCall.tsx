import { useEffect, useRef, useState } from 'react'
import { connectVoiceCall, endVoiceCall, getVoiceCall, sendVoiceOffer, startVoiceCall, type VoiceCall } from '../../api'
import { closeVoicePeer, createVoicePeer, waitForIce } from './browser-voice-call'
import './VoiceCall.css'

export function DispatcherVoiceCall({ emergencyId, active }: { emergencyId: string; active: boolean }) {
  const [call, setCall] = useState<VoiceCall | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const audio = useRef<HTMLAudioElement>(null)
  const peer = useRef<RTCPeerConnection | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const appliedAnswer = useRef('')

  function cleanup() {
    closeVoicePeer(peer.current, stream.current, audio.current)
    peer.current = null; stream.current = null; appliedAnswer.current = ''
  }

  async function start() {
    setBusy(true); setError('')
    let started: VoiceCall | null = null
    try {
      started = await startVoiceCall(emergencyId)
      setCall(started)
      const media = await createVoicePeer(audio.current!, () => { void connectVoiceCall(started!.id).then(setCall).catch(() => {}) })
      peer.current = media.peer; stream.current = media.stream
      const offer = await media.peer.createOffer()
      await media.peer.setLocalDescription(offer)
      await waitForIce(media.peer)
      await sendVoiceOffer(started.id, media.peer.localDescription?.sdp || offer.sdp || '')
      setCall({ ...started, status: 'RINGING' })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a chamada.')
      if (started) void endVoiceCall(started.id).catch(() => {})
      cleanup()
    } finally { setBusy(false) }
  }

  async function hangup() {
    if (call) await endVoiceCall(call.id).catch(() => {})
    cleanup()
    setCall(current => current ? { ...current, status: 'ENDED' } : null)
  }

  useEffect(() => {
    if (!call || call.status === 'ENDED' || call.status === 'DECLINED') return
    const timer = window.setInterval(() => {
      void getVoiceCall(emergencyId).then(latest => {
        setCall(latest)
        if (latest.status === 'ENDED' || latest.status === 'DECLINED') cleanup()
        else if (latest.answer && peer.current && appliedAnswer.current !== latest.answer) {
          appliedAnswer.current = latest.answer
          void peer.current.setRemoteDescription({ type: 'answer', sdp: latest.answer }).catch(() => setError('A conexão de voz não pôde ser estabelecida.'))
        }
      }).catch(() => {})
    }, 800)
    return () => window.clearInterval(timer)
  }, [call?.id, call?.status, emergencyId])

  useEffect(() => () => { if (call && call.status !== 'ENDED' && call.status !== 'DECLINED') void endVoiceCall(call.id).catch(() => {}); cleanup() }, [call?.id])

  return <div className="voice-call-control">
    <audio ref={audio} autoPlay playsInline />
    {!call || call.status === 'ENDED' || call.status === 'DECLINED' ?
      <button className="secondary" type="button" disabled={!active || busy} onClick={() => void start()}>{busy ? 'Chamando…' : 'Falar com paciente'}</button> :
      <button className="secondary" type="button" onClick={() => void hangup()}>{call.status === 'CONNECTED' ? 'Encerrar chamada' : 'Cancelar chamada'}</button>}
    {call?.status === 'RINGING' && <span role="status">Chamando paciente…</span>}
    {call?.status === 'CONNECTED' && <span role="status">Chamada de voz conectada</span>}
    {error && <span className="error" role="alert">{error}</span>}
  </div>
}
