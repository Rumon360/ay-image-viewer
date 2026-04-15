// src/components/EmptyState.tsx

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {/* Glow icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center border"
        style={{
          background: 'rgba(0,255,255,0.05)',
          borderColor: 'rgba(0,255,255,0.18)',
          boxShadow: '0 0 40px rgba(0,255,255,0.07)',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>

      <div className="max-w-xs">
        <h2
          className="text-2xl font-normal mb-2"
          style={{ color: '#ffffff', lineHeight: '1.0' }}
        >
          No files uploaded
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Upload CSV files containing student IDs and image URLs.
          Each file must include a{' '}
          <code
            className="text-xs px-1 py-0.5 rounded-sm"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(0,255,255,0.85)',
              background: 'rgba(0,255,255,0.07)',
            }}
          >
            student_id
          </code>{' '}
          column.
        </p>
      </div>
    </div>
  )
}
