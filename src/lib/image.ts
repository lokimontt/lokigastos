const MAX_LADO = 1280
const CALIDAD = 0.8

function cargarImagen(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

/**
 * Comprime una imagen en el cliente: máximo 1280px en el lado mayor, JPEG calidad 0.8.
 * Devuelve el Blob listo para subir.
 */
export async function comprimirImagen(file: File): Promise<Blob> {
  const img = await cargarImagen(file)
  let { width, height } = img
  const mayor = Math.max(width, height)
  if (mayor > MAX_LADO) {
    const f = MAX_LADO / mayor
    width = Math.round(width * f)
    height = Math.round(height * f)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  ctx.drawImage(img, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', CALIDAD))
  if (!blob) throw new Error('No se pudo comprimir la imagen')
  return blob
}

/** Sube un blob a Convex storage usando una URL de subida; devuelve el storageId. */
export async function subirBlob(uploadUrl: string, blob: Blob): Promise<string> {
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'image/jpeg' },
    body: blob,
  })
  if (!res.ok) throw new Error('Error al subir la foto (' + res.status + ')')
  const json = (await res.json()) as { storageId: string }
  return json.storageId
}
