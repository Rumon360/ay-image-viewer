export interface StudentRecord {
  student_id: string
  /** column name → URL */
  images: Record<string, string>
}

export interface ParsedFile {
  filename: string
  /** image-URL column names (excludes student_id) */
  headers: string[]
  rows: Record<string, string>[]
}

export interface AppError {
  file: string
  message: string
}

export interface SelectedImage {
  student_id: string
  column: string
  url: string
}

export type CollagePresetGrid = '2x2' | '4x4' | '8x8' | '16x16'
export type CollagePresetSize = 512 | 1024 | 2048 | 4096

export interface CollageGrid {
  cols: number
  rows: number
  preset: CollagePresetGrid | 'custom'
}

export interface CollageOutputSize {
  width: number
  height: number
  preset: CollagePresetSize | 'custom'
}

export type ProcessingState = 'idle' | 'processing' | 'done' | 'error'

export interface CollageStyle {
  gap: number          // px between images, 0–128
  gapColor: string     // hex color
  padding: number      // px around the collage border, 0–256
  paddingColor: string // hex color
}
