import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

const toQr = (text) => QRCode.toDataURL(text, { width: 720, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } })

export default function QrCodes({ restaurant }) {
  const base = `${window.location.origin}/${restaurant.slug}`
  const [main, setMain] = useState('')
  const [tables, setTables] = useState(0)
  const [tableQrs, setTableQrs] = useState([])

  useEffect(() => { toQr(base).then(setMain) }, [base])
  useEffect(() => {
    const n = Math.max(0, Math.min(80, Number(tables) || 0))
    Promise.all(Array.from({ length: n }, (_, i) => toQr(`${base}?mesa=${i + 1}`))).then(setTableQrs)
  }, [tables, base])

  const file = (s) => `${restaurant.slug}-${s}.png`

  return (
    <div>
      <div className="page-head no-print">
        <div><h1>Códigos QR</h1><p className="muted">Descargalos o imprimilos para tus mesas y tu vidriera</p></div>
        <div className="page-actions"><button className="btn btn-secondary" onClick={() => window.print()}>Imprimir</button></div>
      </div>
      <div className="qr-layout">
        <div className="card qr-main print-area">
          {main && <img src={main} alt={`Código QR del menú de ${restaurant.name}`} />}
          <strong>{restaurant.name}</strong>
          <span className="muted">Escaneá para ver el menú</span>
          <a className="btn btn-primary no-print" href={main} download={file('menu')}>Descargar PNG</a>
        </div>
        <div className="card no-print">
          <h3 className="card-title">QR por mesa</h3>
          <p className="muted">Cada código abre el menú con el número de mesa ya cargado en el pedido.</p>
          <label className="field field-inline"><span>Cantidad de mesas</span>
            <input className="input" type="number" min="0" max="80" value={tables} onChange={(e) => setTables(e.target.value)} />
          </label>
        </div>
      </div>
      {tableQrs.length > 0 && (
        <div className="qr-grid print-area">
          {tableQrs.map((src, i) => (
            <a key={i} className="qr-cell" href={src} download={file(`mesa-${i + 1}`)} title="Descargar">
              <img src={src} alt={`QR mesa ${i + 1}`} />
              <strong>Mesa {i + 1}</strong>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
