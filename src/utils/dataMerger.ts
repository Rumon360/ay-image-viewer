// src/utils/dataMerger.ts
import type { ParsedFile, StudentRecord } from '../types'

export function mergeStudentData(files: ParsedFile[]): StudentRecord[] {
  const map = new Map<string, Record<string, string>>()

  for (const file of files) {
    for (const row of file.rows) {
      const id = row['student_id']?.trim()
      if (!id) continue

      const existing = map.get(id) ?? {}
      const images: Record<string, string> = {}

      for (const [key, val] of Object.entries(row)) {
        if (key === 'student_id') continue
        if (val?.trim()) images[key] = val.trim()
      }

      map.set(id, { ...existing, ...images })
    }
  }

  return Array.from(map.entries())
    .map(([student_id, images]) => ({ student_id, images }))
    .sort((a, b) => a.student_id.localeCompare(b.student_id))
}
