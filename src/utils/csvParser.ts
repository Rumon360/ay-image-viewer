// src/utils/csvParser.ts
import type { ParsedFile } from '../types'

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseCSVLine(lines[0]).map(h => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() ?? ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

export function validateCSV(headers: string[]): string | null {
  const hasStudentId = headers.some(h => h.toLowerCase() === 'student_id')
  if (!hasStudentId) return 'Missing required "student_id" column'
  return null
}

export function parseCSVFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)
      const error = validateCSV(headers)
      if (error) { reject(new Error(error)); return }

      // Normalize the student_id header to lowercase
      const normalizedHeaders = headers.map(h =>
        h.toLowerCase() === 'student_id' ? 'student_id' : h
      )
      const normalizedRows = rows.map(originalRow => {
        const newRow: Record<string, string> = {}
        headers.forEach((originalHeader, i) => {
          newRow[normalizedHeaders[i]] = originalRow[originalHeader] ?? ''
        })
        return newRow
      })

      resolve({
        filename: file.name,
        headers: normalizedHeaders.filter(h => h !== 'student_id'),
        rows: normalizedRows,
      })
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
