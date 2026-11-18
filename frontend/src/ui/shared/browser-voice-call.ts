// shortcut: direct peer-to-peer audio may fail behind restrictive NATs; add a TURN relay if remote networks cannot connect.
export async function createVoicePeer(audio: HTMLAudioElement, onConnected: () => void) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false })
  try {
    const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    stream.getTracks().forEach(track => peer.addTrack(track, stream))
    peer.ontrack = event => {
      audio.srcObject = event.streams[0]
      void audio.play().catch(() => { })
    }
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') onConnected()
    }
    return { peer, stream }
  } catch (error) {
    stream.getTracks().forEach(track => track.stop())
    throw error
  }
}

export function waitForIce(peer: RTCPeerConnection) {
  if (peer.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise<void>(resolve => {
    const timeout = window.setTimeout(done, 8000)
    function done() {
      window.clearTimeout(timeout)
      peer.removeEventListener('icegatheringstatechange', check)
      resolve()
    }
    function check() { if (peer.iceGatheringState === 'complete') done() }
    peer.addEventListener('icegatheringstatechange', check)
  })
}

export function closeVoicePeer(peer: RTCPeerConnection | null, stream: MediaStream | null, audio: HTMLAudioElement | null) {
  peer?.close()
  stream?.getTracks().forEach(track => track.stop())
  if (audio) audio.srcObject = null
}
