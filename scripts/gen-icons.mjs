// Genera public/icon-192.png y public/icon-512.png sin dependencias (PNG RGBA + zlib).
// Dibuja lo mismo que public/icon.svg: fondo redondeado #1a1a1a, "L" blanca y acento verde #0F6E56.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'public')

const BG = [0x1a, 0x1a, 0x1a]
const WHITE = [0xff, 0xff, 0xff]
const GREEN = [0x0f, 0x6e, 0x56]

// Formas en coordenadas 0..512 (igual que el SVG): [x, y, w, h, radio, color]
const SHAPES = [
  [150, 104, 76, 304, 12, WHITE],
  [150, 332, 226, 76, 12, WHITE],
  [300, 104, 76, 76, 20, GREEN],
]

function insideRoundRect(px, py, x, y, w, h, r) {
  if (px < x || py < y || px >= x + w || py >= y + h) return false
  const cx = px < x + r ? x + r : px >= x + w - r ? x + w - r : px
  const cy = py < y + r ? y + r : py >= y + h - r ? y + h - r : py
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= r * r
}

function render(size) {
  const ss = 3 // supersampling por eje para bordes suaves
  const scale = 512 / size
  const px = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const fx = (x + (sx + 0.5) / ss) * scale
          const fy = (y + (sy + 0.5) / ss) * scale
          if (!insideRoundRect(fx, fy, 0, 0, 512, 512, 112)) continue
          let c = BG
          for (const [rx, ry, rw, rh, rr, col] of SHAPES) if (insideRoundRect(fx, fy, rx, ry, rw, rh, rr)) c = col
          r += c[0]; g += c[1]; b += c[2]; a += 255
        }
      }
      const n = ss * ss
      const i = (y * size + x) * 4
      if (a > 0) {
        const cov = a / n / 255
        px[i] = Math.round(r / (a / 255)); px[i + 1] = Math.round(g / (a / 255)); px[i + 2] = Math.round(b / (a / 255))
        px[i + 3] = Math.round(cov * 255)
      }
    }
  }
  return px
}

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})
function crc32(buf) {
  let c = -1
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filtro None
    raw.set(rgba.subarray(y * size * 4, (y + 1) * size * 4), y * (size * 4 + 1) + 1)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  const file = join(out, `icon-${size}.png`)
  writeFileSync(file, png(size, render(size)))
  console.log('ok', file)
}
