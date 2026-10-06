// Comprime cualquier foto (celular, cámara o PC) a menos de 200 KB.
// Respeta la orientación del celular y prefiere WebP (JPEG si el navegador no lo soporta).

export const MAX_BYTES = 200 * 1024
const MAX_SIDE = 1200

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen. Probá con otro formato (JPG o PNG).')) }
    img.src = url
  })
}

const toBlob = (canvas, type, q) => new Promise((res) => canvas.toBlob(res, type, q))

export async function compressImage(file, { maxSide = MAX_SIDE, maxBytes = MAX_BYTES } = {}) {
  if (!file || !file.type.startsWith('image/')) throw new Error('El archivo elegido no es una imagen.')
  const img = await loadImage(file)
  let scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  let type = 'image/webp'

  for (let round = 0; round < 7; round++) {
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff' // fondo blanco para PNG con transparencia
    ctx.fillRect(0, 0, w, h)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, w, h)

    for (const q of [0.85, 0.75, 0.65, 0.55]) {
      let blob = await toBlob(canvas, type, q)
      if (blob && blob.type !== type) { type = 'image/jpeg'; blob = await toBlob(canvas, type, q) }
      if (blob && blob.size <= maxBytes) {
        const ext = type === 'image/webp' ? 'webp' : 'jpg'
        return new File([blob], `foto.${ext}`, { type })
      }
    }
    scale *= 0.8
  }
  throw new Error('No pudimos reducir la imagen a 200 KB. Probá con otra foto.')
}
