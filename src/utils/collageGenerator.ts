import type { SelectedImage } from '../types'

export function getSlots(cols: number, rows: number): number {
  return cols * rows
}

export function buildCollageFilename(
  cols: number,
  rows: number,
  width: number,
  height: number,
  date: string,
): string {
  return `collage-${cols}x${rows}-${width}x${height}-${date}.png`
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load: ${url}`))
    img.src = url
  })
}

export interface CollageResult {
  blob: Blob
  corsFailures: number
}

export interface CollageOptions {
  gap?: number
  gapColor?: string
  padding?: number
  paddingColor?: string
}

export async function generateCollage(
  images: SelectedImage[],
  cols: number,
  rows: number,
  outputWidth: number,
  outputHeight: number,
  options: CollageOptions = {},
): Promise<CollageResult> {
  const {
    gap = 0,
    gapColor = '#000000',
    padding = 0,
    paddingColor = '#000000',
  } = options

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext('2d')!

  // Fill entire canvas with padding color
  ctx.fillStyle = paddingColor
  ctx.fillRect(0, 0, outputWidth, outputHeight)

  const totalSlots = getSlots(cols, rows)

  // Slot dimensions after subtracting padding and gaps
  const drawableW = outputWidth - 2 * padding - Math.max(0, cols - 1) * gap
  const drawableH = outputHeight - 2 * padding - Math.max(0, rows - 1) * gap
  const slotW = Math.max(1, drawableW / cols)
  const slotH = Math.max(1, drawableH / rows)

  // Fill inner area (padding bounds) with gap color if it differs from padding color
  if (gap > 0 && gapColor !== paddingColor) {
    ctx.fillStyle = gapColor
    ctx.fillRect(
      padding,
      padding,
      outputWidth - 2 * padding,
      outputHeight - 2 * padding,
    )
  }

  const used = images.slice(0, totalSlots)
  const results = await Promise.allSettled(used.map(img => loadImage(img.url)))
  let corsFailures = 0

  results.forEach((result, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    const x = padding + col * (slotW + gap)
    const y = padding + row * (slotH + gap)

    if (result.status === 'fulfilled') {
      const el = result.value
      const imgAspect = el.naturalWidth / el.naturalHeight
      const slotAspect = slotW / slotH
      let sx = 0, sy = 0, sw = el.naturalWidth, sh = el.naturalHeight
      if (imgAspect > slotAspect) {
        sw = el.naturalHeight * slotAspect
        sx = (el.naturalWidth - sw) / 2
      } else {
        sh = el.naturalWidth / slotAspect
        sy = (el.naturalHeight - sh) / 2
      }
      ctx.drawImage(el, sx, sy, sw, sh, x, y, slotW, slotH)
    } else {
      corsFailures++
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(x, y, slotW, slotH)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.strokeRect(x + 0.5, y + 0.5, slotW - 1, slotH - 1)
    }
  })

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => b ? resolve(b) : reject(new Error('toBlob failed')),
      'image/png',
    )
  })

  return { blob, corsFailures }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
