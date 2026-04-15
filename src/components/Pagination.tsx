// src/components/Pagination.tsx
import type { PaginationState, PageSize } from '../hooks/usePagination'

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

const PAGE_SIZES: PageSize[] = [10, 25, 50, 100]

interface PaginationProps {
  pagination: PaginationState
  totalItems: number
}

export function Pagination({ pagination, totalItems }: PaginationProps) {
  const { currentPage, totalPages, pageSize, setPage, setPageSize, canGoNext, canGoPrev, startIndex, endIndex } = pagination
  const pages = getPageNumbers(currentPage, totalPages)

  const base: React.CSSProperties = {
    minWidth: 34,
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'var(--font-mono)',
    padding: '0 6px',
    transition: 'all 150ms ease-out',
  }

  const active: React.CSSProperties = {
    ...base,
    background: 'rgba(0,255,255,0.07)',
    borderColor: 'rgba(0,255,255,0.28)',
    color: '#00ffff',
  }

  const disabled: React.CSSProperties = {
    ...base,
    opacity: 0.25,
    cursor: 'not-allowed',
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.35)' }}>
        {totalItems === 0
          ? '0 records'
          : `${startIndex + 1}–${endIndex} of ${totalItems}`}
      </span>

      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Row size */}
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value) as PageSize)}
          aria-label="Rows per page"
          style={{
            ...base,
            padding: '0 8px',
            cursor: 'pointer',
            minWidth: 64,
            background: '#000',
          }}
        >
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
        </select>

        {/* Prev */}
        <button onClick={pagination.prevPage} disabled={!canGoPrev} style={canGoPrev ? base : disabled} aria-label="Previous page">
          ←
        </button>

        {/* Page numbers */}
        {pages.map((page, i) =>
          page === '...'
            ? <span key={`e${i}`} style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, padding: '0 4px', fontFamily: 'var(--font-mono)' }}>…</span>
            : (
              <button
                key={page}
                onClick={() => setPage(page)}
                style={page === currentPage ? active : base}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
        )}

        {/* Next */}
        <button onClick={pagination.nextPage} disabled={!canGoNext} style={canGoNext ? base : disabled} aria-label="Next page">
          →
        </button>
      </div>
    </div>
  )
}
