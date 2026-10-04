import { useState } from 'react'
import MenuView from '../menu/MenuView'
import { Segmented } from './ui'

// Vista previa del menú dentro de un marco de teléfono o tablet
export default function PhonePreview(props) {
  const [device, setDevice] = useState('phone')
  const [toast, setToast] = useState('')
  const fakeSubmit = () => new Promise((r) => setTimeout(r, 500))
  const fakeWa = (url) => {
    setToast('En el menú real se abriría WhatsApp con el pedido armado.')
    console.info('WhatsApp:', decodeURIComponent(url.split('text=')[1] || ''))
    setTimeout(() => setToast(''), 3000)
  }
  return (
    <div className="preview">
      <Segmented ariaLabel="Dispositivo" value={device} onChange={setDevice} options={[['phone', 'Celular'], ['tablet', 'Tablet']]} />
      <div className={`device device-${device}`}>
        <MenuView key={props.theme} {...props} embedded onSubmitOrder={fakeSubmit} onOpenWhatsApp={fakeWa} />
        {toast && <div className="device-toast">{toast}</div>}
      </div>
    </div>
  )
}
