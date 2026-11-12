import { useEffect, useRef, useState } from 'react'
import './KeywordHelpTrigger.css'

const REQUEST_EMERGENCY_EVENT = 'vitalink:request-emergency'

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } }
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> }
type RecognitionError = { error: string }

type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: RecognitionError) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

type RecognitionConstructor = new () => Recognition
type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor
  webkitSpeechRecognition?: RecognitionConstructor
}

type KeywordHelpTriggerProps = {
  onTrigger?: () => void
}

function getRecognitionConstructor() {
  if (typeof window === 'undefined') return undefined
  const speechWindow = window as SpeechWindow
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
}

export function KeywordHelpTrigger({ onTrigger }: KeywordHelpTriggerProps) {
  const recognitionRef = useRef<Recognition | null>(null)
  const triggeredRef = useRef(false)
  const stoppedByUserRef = useRef(false)
  const failedRef = useRef(false)
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState('A escuta só começa ao tocar e para após uma tentativa. Alguns navegadores podem enviar o áudio a um serviço de reconhecimento.')
  const RecognitionConstructor = getRecognitionConstructor()

  useEffect(() => () => recognitionRef.current?.stop(), [])

  function startListening() {
    if (!RecognitionConstructor) return
    const recognition = new RecognitionConstructor()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = false
    triggeredRef.current = false
    stoppedByUserRef.current = false
    failedRef.current = false

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      if (!/\b(socorro|preciso de ajuda|me ajuda|me ajude|quero ajuda)\b/.test(transcript)) return

      triggeredRef.current = true
      recognition.stop()
      setListening(false)
      setStatus('Frase reconhecida. Abrindo a solicitação de ajuda…')
      window.dispatchEvent(new CustomEvent(REQUEST_EMERGENCY_EVENT))
      onTrigger?.()
    }

    recognition.onerror = ({ error }) => {
      failedRef.current = true
      setListening(false)
      setStatus(error === 'not-allowed' || error === 'service-not-allowed'
        ? 'Permissão de microfone negada. Use o botão de ajuda na tela.'
        : 'Não foi possível reconhecer a fala. Use o botão de ajuda na tela.')
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
      if (!triggeredRef.current && !stoppedByUserRef.current && !failedRef.current) {
        setStatus('Não reconheci a frase. Você pode tentar novamente ou usar o botão de ajuda.')
      }
    }

    try {
      recognitionRef.current = recognition
      recognition.start()
      setListening(true)
      setStatus('Microfone ativo. Diga “socorro” ou “preciso de ajuda”.')
    } catch {
      recognitionRef.current = null
      setListening(false)
      setStatus('Não foi possível iniciar o microfone. Use o botão de ajuda na tela.')
    }
  }

  function stopListening() {
    stoppedByUserRef.current = true
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
    setStatus('Escuta pausada.')
  }

  if (!RecognitionConstructor) {
    return <p className="keyword-help-status" role="status">Reconhecimento por voz não está disponível neste navegador. Use o botão “Preciso de ajuda”.</p>
  }

  return (
    <div className="keyword-help-trigger">
      <button className="secondary" type="button" onClick={listening ? stopListening : startListening}>
        {listening ? 'Parar escuta' : 'Ativar ajuda por voz'}
      </button>
      <p className="keyword-help-status" role="status" aria-live="polite">{status}</p>
    </div>
  )
}
