// src/components/SelectionToolbar.tsx
import type { SelectedImage } from '../types'

interface SelectionToolbarProps {
  count: number
  totalVisible: number
  allVisibleSelected: boolean
  onSelectAll: () => void
  onDeselectAll: () => void
  onClearAll: () => void
  onGenerateCollage: () => void
  selectedImages: SelectedImage[]
}

export function SelectionToolbar({
  count,
  totalVisible,
  allVisibleSelected,
  onSelectAll,
  onDeselectAll,
  onClearAll,
  onGenerateCollage,
}: SelectionToolbarProps) {
  const hasSelection = count > 0

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2.5 rounded border"
      style={{
        background: hasSelection ? 'rgba(0,255,255,0.04)' : '#000',
        borderColor: hasSelection ? 'rgba(0,255,255,0.18)' : 'rgba(255,255,255,0.08)',
        transition: 'background 200ms ease-out, border-color 200ms ease-out',
      }}
    >
      {/* Left: selection info */}
      <div className="flex items-center gap-3">
        <span
          className="text-xs"
          style={{
            fontFamily: 'var(--font-mono)',
            color: hasSelection ? '#00ffff' : 'rgba(255,255,255,0.35)',
          }}
        >
          {count > 0 ? `${count} selected` : 'No images selected'}
        </span>

        {count > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs transition-opacity duration-150 opacity-50 hover:opacity-100"
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}
          >
            clear
          </button>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {totalVisible > 0 && (
          <button
            onClick={allVisibleSelected ? onDeselectAll : onSelectAll}
            className="text-xs px-3 py-1.5 rounded border transition-all duration-150"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(255,255,255,0.55)',
              borderColor: 'rgba(255,255,255,0.10)',
              background: 'transparent',
            }}
          >
            {allVisibleSelected ? 'deselect page' : 'select page'}
          </button>
        )}

        <button
          onClick={onGenerateCollage}
          disabled={count < 1}
          className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded font-medium transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: count > 0 ? 'rgba(0,255,255,0.10)' : 'transparent',
            border: '1px solid',
            borderColor: count > 0 ? 'rgba(0,255,255,0.35)' : 'rgba(255,255,255,0.12)',
            color: count > 0 ? '#00ffff' : 'rgba(255,255,255,0.35)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          Generate collage
        </button>
      </div>
    </div>
  )
}
