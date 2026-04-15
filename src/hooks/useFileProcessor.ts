// src/hooks/useFileProcessor.ts
import { useState } from 'react'
import type { StudentRecord, ParsedFile, AppError, ProcessingState } from '../types'
import { parseCSVFile } from '../utils/csvParser'
import { mergeStudentData } from '../utils/dataMerger'

interface FileProcessorState {
  processingState: ProcessingState
  records: StudentRecord[]
  errors: AppError[]
  allImageColumns: string[]
  processFiles: (files: File[]) => Promise<void>
  reset: () => void
}

export function useFileProcessor(): FileProcessorState {
  const [processingState, setProcessingState] = useState<ProcessingState>('idle')
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([])
  const [records, setRecords] = useState<StudentRecord[]>([])
  const [errors, setErrors] = useState<AppError[]>([])

  // Derived: collect all unique image column names from all loaded files
  const allImageColumns = Array.from(new Set(parsedFiles.flatMap(f => f.headers)))

  async function processFiles(newFiles: File[]) {
    setProcessingState('processing')
    setErrors([])

    const newErrors: AppError[] = []
    const newParsed: ParsedFile[] = []

    await Promise.allSettled(
      newFiles.map(async (file) => {
        try {
          const parsed = await parseCSVFile(file)
          newParsed.push(parsed)
        } catch (err) {
          newErrors.push({
            file: file.name,
            message: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      })
    )

    setErrors(newErrors)
    setParsedFiles(prev => {
      const combined = [...prev, ...newParsed]
      const merged = mergeStudentData(combined)
      setRecords(merged)
      setProcessingState(combined.length > 0 ? 'done' : 'error')
      return combined
    })
  }

  function reset() {
    setProcessingState('idle')
    setParsedFiles([])
    setRecords([])
    setErrors([])
  }

  return { processingState, records, errors, allImageColumns, processFiles, reset }
}
