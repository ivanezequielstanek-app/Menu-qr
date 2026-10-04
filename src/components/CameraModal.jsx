import { useEffect, useRef, useState } from 'react'
import { Modal } from './ui'
import { Camera, Swap } from './icons'

// Cámara para PC (o celulares desde el navegador de escritorio).
export default function CameraModal({ onClose, onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [facing, setFacing] = useState('environment')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [multi, setMulti] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function start() {
      setReady(false); setError('')
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Este navegador no permite usar la cámara. Usá "Subir imagen".'); return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false,
        })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
        setReady(true)
        const devices = await navigator.mediaDevices.enumerateDevices()
        setMulti(devices.filter((d) => d.kind === 'videoinput').length > 1)
      } catch (e) {
        setError(e.name === 'NotAllowedError'
          ? 'Permiso denegado. Habilitá la cámara en la configuración del navegador (ícono del candado en la barra de direcciones).'
          : 'No encontramos una cámara disponible en este dispositivo.')
      }
    }
    start()
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()) }
  }, [facing])

  function capture() {
    const v = videoRef.current
    if (!v?.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth; canvas.height = v.videoHeight
    canvas.getContext('2d').drawImage(v, 0, 0)
    canvas.toBlob((blob) => blob && onCapture(new File([blob], 'camara.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.92)
  }

  return (
    <Modal title="Sacar foto" onClose={onClose} size="lg"
      footer={<>
        {multi && <button type="button" className="btn btn-secondary" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}><Swap /> Cambiar cámara</button>}
        <button type="button" className="btn btn-primary" disabled={!ready} onClick={capture}><Camera /> Capturar</button>
      </>}>
      <div className="camera-box">
        {error ? <p className="camera-error">{error}</p> : <video ref={videoRef} playsInline muted />}
        {!ready && !error && <span className="spinner camera-spinner" />}
      </div>
    </Modal>
  )
}
