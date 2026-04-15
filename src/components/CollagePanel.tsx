// src/components/CollagePanel.tsx
import { useState } from 'react'
import type { CollageGrid, CollageOutputSize, CollageStyle, SelectedImage } from '../types'
import {
  getSlots,
  generateCollage,
  buildCollageFilename,
  downloadBlob,
} from '../utils/collageGenerator'

interface CollagePanelProps {
  selectedImages: SelectedImage[]
  onClose: () => void
}

const GRID_PRESETS: { label: string; cols: number; rows: number }[] = [
  { label: '2×2', cols: 2, rows: 2 },
  { label: '4×4', cols: 4, rows: 4 },
  { label: '8×8', cols: 8, rows: 8 },
  { label: '16×16', cols: 16, rows: 16 },
]

const SIZE_PRESETS: { label: string; value: number }[] = [
  { label: '512', value: 512 },
  { label: '1024', value: 1024 },
  { label: '2048', value: 2048 },
  { label: '4096', value: 4096 },
]

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div
          className="relative w-8 h-8 rounded border overflow-hidden shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.15)' }}
        >
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
            style={{ transform: 'scale(2)' }}
          />
          <div className="w-full h-full" style={{ background: value }} />
        </div>
        <input
          type="text"
          value={value}
          onChange={e => {
            const v = e.target.value
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v.length === 7 ? v : value)
          }}
          onBlur={e => {
            const v = e.target.value
            if (!/^#[0-9a-fA-F]{6}$/.test(v)) onChange(value)
          }}
          maxLength={7}
          className="flex-1 px-2 py-1.5 rounded text-xs border"
          style={{
            background: '#0a0a0a',
            borderColor: 'rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.75)',
            fontFamily: 'var(--font-mono)',
            outline: 'none',
          }}
        />
      </div>
    </div>
  )
}

function SliderInput({
  label,
  value,
  min,
  max,
  unit = 'px',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={e => onChange(clamp(Number(e.target.value), min, max))}
            className="w-16 px-2 py-0.5 rounded text-xs border text-right"
            style={{
              background: '#0a0a0a',
              borderColor: 'rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.75)',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded appearance-none cursor-pointer"
        style={{ accentColor: '#00ffff' }}
      />
    </div>
  )
}

export function CollagePanel({ selectedImages, onClose }: CollagePanelProps) {
  const [grid, setGrid] = useState<CollageGrid>({ cols: 2, rows: 2, preset: '2x2' })
  const [outputSize, setOutputSize] = useState<CollageOutputSize>({ width: 1024, height: 1024, preset: 1024 })
  const [style, setStyle] = useState<CollageStyle>({ gap: 0, gapColor: '#000000', padding: 0, paddingColor: '#000000' })
  const [customCols, setCustomCols] = useState(3)
  const [customRows, setCustomRows] = useState(3)
  const [customW, setCustomW] = useState(1200)
  const [customH, setCustomH] = useState(1200)
  const [generating, setGenerating] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [corsWarning, setCorsWarning] = useState<number | null>(null)

  const cols = grid.preset === 'custom' ? customCols : grid.cols
  const rows = grid.preset === 'custom' ? customRows : grid.rows
  const outW = outputSize.preset === 'custom' ? customW : outputSize.width
  const outH = outputSize.preset === 'custom' ? customH : outputSize.height

  const totalSlots = getSlots(cols, rows)
  const usedCount = Math.min(selectedImages.length, totalSlots)

  // Check if slot dimensions are valid
  const drawableW = outW - 2 * style.padding - Math.max(0, cols - 1) * style.gap
  const drawableH = outH - 2 * style.padding - Math.max(0, rows - 1) * style.gap
  const slotW = drawableW / cols
  const slotH = drawableH / rows
  const invalid = slotW < 4 || slotH < 4

  async function handleGenerate() {
    if (generating || invalid || selectedImages.length === 0) return
    setGenerating(true)
    setLastError(null)
    setCorsWarning(null)
    try {
      const result = await generateCollage(
        selectedImages,
        cols,
        rows,
        outW,
        outH,
        {
          gap: style.gap,
          gapColor: style.gapColor,
          padding: style.padding,
          paddingColor: style.paddingColor,
        },
      )
      if (result.corsFailures > 0) setCorsWarning(result.corsFailures)
      const date = new Date().toISOString().slice(0, 10)
      downloadBlob(result.blob, buildCollageFilename(cols, rows, outW, outH, date))
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const btnBase: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    padding: '5px 12px',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.45)',
    cursor: 'pointer',
    transition: 'all 150ms ease-out',
  }

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: 'rgba(0,255,255,0.08)',
    borderColor: 'rgba(0,255,255,0.30)',
    color: '#00ffff',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-y-auto"
        style={{
          width: 320,
          background: '#050505',
          borderLeft: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <span className="text-sm font-medium" style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>
            Generate Collage
          </span>
          <button
            onClick={onClose}
            className="text-xs opacity-40 hover:opacity-80 transition-opacity duration-150"
            style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}
            aria-label="Close panel"
          >
            [×]
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 px-5 py-5 flex-1">

          {/* Stats */}
          <div
            className="flex items-center justify-between px-3 py-2.5 rounded text-xs"
            style={{
              background: 'rgba(0,255,255,0.04)',
              border: '1px solid rgba(0,255,255,0.12)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>selected</span>
            <span style={{ color: '#00ffff' }}>{selectedImages.length} images</span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>slots</span>
            <span style={{ color: usedCount < totalSlots ? 'rgba(255,200,0,0.8)' : '#00ffff' }}>
              {usedCount}/{totalSlots}
            </span>
          </div>

          {/* Grid */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)', letterSpacing: '0.3px' }}>
              GRID
            </p>
            <div className="flex flex-wrap gap-1.5">
              {GRID_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setGrid({ cols: p.cols, rows: p.rows, preset: `${p.cols}x${p.rows}` as CollageGrid['preset'] })}
                  style={grid.preset === `${p.cols}x${p.rows}` ? btnActive : btnBase}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setGrid({ cols: customCols, rows: customRows, preset: 'custom' })}
                style={grid.preset === 'custom' ? btnActive : btnBase}
              >
                custom
              </button>
            </div>
            {grid.preset === 'custom' && (
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>cols</label>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={customCols}
                    onChange={e => { const v = clamp(Number(e.target.value), 1, 32); setCustomCols(v); setGrid(g => ({ ...g, cols: v })) }}
                    className="px-2 py-1.5 rounded text-xs border"
                    style={{ background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-mono)', outline: 'none' }}
                  />
                </div>
                <span className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>×</span>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>rows</label>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={customRows}
                    onChange={e => { const v = clamp(Number(e.target.value), 1, 32); setCustomRows(v); setGrid(g => ({ ...g, rows: v })) }}
                    className="px-2 py-1.5 rounded text-xs border"
                    style={{ background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-mono)', outline: 'none' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Output size */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)', letterSpacing: '0.3px' }}>
              OUTPUT SIZE
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SIZE_PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setOutputSize({ width: p.value, height: p.value, preset: p.value as CollageOutputSize['preset'] })}
                  style={outputSize.preset === p.value ? btnActive : btnBase}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setOutputSize({ width: customW, height: customH, preset: 'custom' })}
                style={outputSize.preset === 'custom' ? btnActive : btnBase}
              >
                custom
              </button>
            </div>
            {outputSize.preset === 'custom' && (
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>width</label>
                  <input
                    type="number"
                    min={64}
                    max={8192}
                    value={customW}
                    onChange={e => { const v = clamp(Number(e.target.value), 64, 8192); setCustomW(v); setOutputSize(s => ({ ...s, width: v })) }}
                    className="px-2 py-1.5 rounded text-xs border"
                    style={{ background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-mono)', outline: 'none' }}
                  />
                </div>
                <span className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>×</span>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>height</label>
                  <input
                    type="number"
                    min={64}
                    max={8192}
                    value={customH}
                    onChange={e => { const v = clamp(Number(e.target.value), 64, 8192); setCustomH(v); setOutputSize(s => ({ ...s, height: v })) }}
                    className="px-2 py-1.5 rounded text-xs border"
                    style={{ background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-mono)', outline: 'none' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Gap */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)', letterSpacing: '0.3px' }}>
              GAP
            </p>
            <SliderInput
              label="gap size"
              value={style.gap}
              min={0}
              max={128}
              onChange={v => setStyle(s => ({ ...s, gap: v }))}
            />
            <ColorPicker
              label="gap color"
              value={style.gapColor}
              onChange={v => setStyle(s => ({ ...s, gapColor: v }))}
            />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Padding */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)', letterSpacing: '0.3px' }}>
              PADDING
            </p>
            <SliderInput
              label="padding size"
              value={style.padding}
              min={0}
              max={256}
              onChange={v => setStyle(s => ({ ...s, padding: v }))}
            />
            <ColorPicker
              label="padding color"
              value={style.paddingColor}
              onChange={v => setStyle(s => ({ ...s, paddingColor: v }))}
            />
          </div>

          {/* Preview info */}
          <div
            className="px-3 py-2 rounded text-xs"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255,255,255,0.35)',
              lineHeight: 1.6,
            }}
          >
            <div>canvas {outW}×{outH}px</div>
            <div style={{ color: invalid ? 'rgba(255,80,80,0.8)' : 'rgba(255,255,255,0.35)' }}>
              slot ≈ {Math.round(slotW)}×{Math.round(slotH)}px
            </div>
          </div>

          {invalid && (
            <p className="text-xs" style={{ color: 'rgba(255,80,80,0.8)', fontFamily: 'var(--font-mono)' }}>
              Gap/padding too large — reduce them or increase output size.
            </p>
          )}

          {lastError && (
            <p className="text-xs" style={{ color: 'rgba(252,165,165,0.9)', fontFamily: 'var(--font-mono)' }}>
              Error: {lastError}
            </p>
          )}

          {corsWarning !== null && corsWarning > 0 && (
            <p className="text-xs" style={{ color: 'rgba(255,200,0,0.8)', fontFamily: 'var(--font-mono)' }}>
              {corsWarning} image{corsWarning > 1 ? 's' : ''} failed to load (CORS). Shown as placeholders.
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 border-t shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <button
            onClick={handleGenerate}
            disabled={generating || invalid || selectedImages.length === 0}
            className="w-full py-2.5 text-sm font-medium rounded transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed"
            style={{
              background: generating ? 'rgba(0,255,255,0.06)' : 'rgba(0,255,255,0.10)',
              border: '1px solid rgba(0,255,255,0.30)',
              color: '#00ffff',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {generating ? 'Generating…' : `Download PNG`}
          </button>
        </div>
      </div>
    </>
  )
}
