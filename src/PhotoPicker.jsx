import { useMemo, useRef, useState } from 'react'
import { compressImage } from '../lib/image'
import { Camera, Upload, Trash, ImageIcon } from './icons'
import CameraModal from './CameraModal'

/**
 * Elegir foto: subir desde la galería/PC, sacar con la cámara, arrastrar.
 * Siempre entrega la imagen ya comprimida a menos de 200 KB.
 * onChange recibe { file, url } o { removed: true, url: null }
 */
export default function PhotoPicker({ url, onChange, shape = 'rect' }) {
  const fileRef = useRef(null)
  const camRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')
  const [err, setErr] = useState('')
  const [camera, setCamera] = useState(false)
  const [drag, setDrag] = useState(false)
  const isTouch = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches, [])

  async function handle(file) {
    if (!file) return
    setErr(''); setInfo(''); setBusy(true)
    try {
      const before = file.size
      const out = await compressImage(file)
      onChange({ file: out, url: URL.createObjectURL(out) })
      setInfo(`Optimizada: ${Math.round(before / 1024)} KB → ${Math.round(out.size / 1024)} KB`)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  function takePhoto() {
    // En celulares, la cámara nativa da mejor resultado que la del navegador
    if (isTouch) camRef.current.click()
    else setCamera(true)
  }

  return (
    <div className="photo-picker">
      <div
        className={`photo-drop photo-${shape} ${drag ? 'is-drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]) }}
      >
        {busy ? <span className="spinner" />
          : url ? <img src={url} alt="Vista previa" />
            : <div className="photo-empty"><ImageIcon size={26} /><span>{isTouch ? 'Sin foto' : 'Arrastrá una imagen acá'}</span></div>}
      </div>
      <div className="photo-side">
        <button type="button" className="btn btn-secondary" onClick={takePhoto} disabled={busy}><Camera /> Sacar foto</button>
        <button type="button" className="btn btn-secondary" onClick={() => fileRef.current.click()} disabled={busy}><Upload /> Subir imagen</button>
        {url && !busy && (
          <button type="button" className="btn btn-ghost btn-danger-text" onClick={() => { onChange({ removed: true, url: null }); setInfo('') }}>
            <Trash /> Quitar foto
          </button>
        )}
        {info && <p className="hint">{info}</p>}
        {err && <p className="form-error">{err}</p>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
      {camera && <CameraModal onClose={() => setCamera(false)} onCapture={(f) => { setCamera(false); handle(f) }} />}
    </div>
  )
}
