// src/components/FileUpload.tsx
import { useRef, useState } from 'react'
import type { AppError } from '../types'

interface FileUploadProps {
  onFiles: (files: File[]) => void
  errors: AppError[]
  isProcessing: boolean
  uploadInputRef?: React.RefObject<HTMLInputElement | null>
}

export function FileUpload({ onFiles, errors, isProcessing, uploadInputRef }: FileUploadProps) {
  const internalRef = useRef<HTMLInputElement>(null)
  const inputRef = uploadInputRef ?? internalRef
  const [isDragging, setIsDragging] = useState(false)

  function filterCSVFiles(files: File[]): File[] {
    return files.filter(f => f.type === 'text/csv' || f.name.toLowerCase().endsWith('.csv'))
  }

  function handleFiles(files: File[]) {
    const csvFiles = filterCSVFiles(files)
    if (csvFiles.length > 0) onFiles(csvFiles)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        disabled={isProcessing}
        className="w-full flex flex-col items-center justify-center gap-3 px-6 py-10 rounded border-2 border-dashed transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          borderColor: isDragging ? 'rgba(0,255,255,0.45)' : 'rgba(255,255,255,0.10)',
          background: isDragging ? 'rgba(0,255,255,0.03)' : 'transparent',
          boxShadow: isDragging ? '0 0 20px rgba(0,255,255,0.05) inset' : 'none',
        }}
      >
        <svg
          width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke={isDragging ? '#00ffff' : 'rgba(255,255,255,0.35)'}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <div className="text-center">
          <p
            className="text-sm font-medium mb-1"
            style={{ color: isDragging ? '#00ffff' : 'rgba(255,255,255,0.85)' }}
          >
            {isProcessing ? 'Processing files…' : 'Drop CSV files here or click to browse'}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Multiple files · must contain{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(0,255,255,0.7)' }}>student_id</span>
            {' '}column
          </p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      {errors.length > 0 && (
        <div className="flex flex-col gap-1.5" role="alert">
          {errors.map((err, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-3 py-2 rounded text-xs"
              style={{
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.18)',
                color: 'rgba(252,165,165,0.9)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(239,68,68,0.7)', flexShrink: 0 }}>!</span>
              <span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{err.file}</span>: {err.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
