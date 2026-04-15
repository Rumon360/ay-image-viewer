// src/components/SkeletonTable.tsx

interface SkeletonTableProps {
  rows?: number
  cols?: number
}

function SkeletonBlock({ width, height = '16px' }: { width: string; height?: string }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 2,
        background: 'rgba(255,255,255,0.07)',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function SkeletonTable({ rows = 5, cols = 3 }: SkeletonTableProps) {
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.75; }
        }
      `}</style>
      <div
        className="w-full rounded overflow-hidden border"
        style={{ borderColor: 'rgba(255,255,255,0.10)' }}
      >
        {/* Header row */}
        <div
          className="flex items-center gap-4 px-4 py-3 border-b"
          style={{ background: '#000', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <SkeletonBlock width="16px" height="16px" />
          <SkeletonBlock width="80px" />
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonBlock key={i} width="110px" />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center gap-4 px-4 py-3 border-b"
            style={{
              borderColor: 'rgba(255,255,255,0.05)',
              background: rowIdx % 2 === 0 ? '#000' : 'rgba(255,255,255,0.01)',
            }}
          >
            <SkeletonBlock width="16px" height="16px" />
            <SkeletonBlock width="72px" />
            {Array.from({ length: cols }).map((_, colIdx) => (
              <SkeletonBlock
                key={colIdx}
                width="56px"
                height="56px"
              />
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
