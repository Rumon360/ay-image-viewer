# Ay Image Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade React app for uploading CSVs of student image URLs, viewing/paginating them, and generating downloadable collages with custom grid and output dimensions.

**Architecture:** CSV files are parsed client-side with a hand-rolled parser, merged by `student_id` into `StudentRecord[]`, and displayed in a paginated table. Image selection feeds a Canvas-based collage generator with custom grid and output dimensions.

**Tech Stack:** React 19, TypeScript, Tailwind v4 (CSS-first), Vite, React Compiler (no manual memo needed), Vitest for utility tests, HTML5 Canvas for collage generation.

**Important — React Compiler:** `babel-plugin-react-compiler` is already wired in `vite.config.ts`. The compiler automatically memoizes components and hooks. Do NOT add manual `useMemo`/`useCallback` wrappers — the compiler handles it, and adding them manually creates conflicts.

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `src/types/index.ts` | Create | All shared TypeScript types |
| `src/utils/csvParser.ts` | Create | Parse CSV text → rows; validate student_id |
| `src/utils/dataMerger.ts` | Create | Merge ParsedFile[] by student_id → StudentRecord[] |
| `src/utils/collageGenerator.ts` | Create | Canvas collage generation + download |
| `src/utils/__tests__/csvParser.test.ts` | Create | Unit tests for CSV parser |
| `src/utils/__tests__/dataMerger.test.ts` | Create | Unit tests for data merger |
| `src/utils/__tests__/collageGenerator.test.ts` | Create | Unit tests for pure functions |
| `src/hooks/usePagination.ts` | Create | Pagination state + controls |
| `src/hooks/useFileProcessor.ts` | Create | Orchestrate upload → parse → merge state machine |
| `src/hooks/useImageSelection.ts` | Create | Track selected images as Map |
| `src/components/EmptyState.tsx` | Create | Zero state when no files loaded |
| `src/components/SkeletonTable.tsx` | Create | Animated loading skeleton |
| `src/components/FileUpload.tsx` | Create | Drag-drop + file picker + error display |
| `src/components/DataTable.tsx` | Create | Paginated table with thumbnails + checkboxes |
| `src/components/Pagination.tsx` | Create | Page controls + size picker |
| `src/components/ImageModal.tsx` | Create | Lightbox with keyboard nav |
| `src/components/SelectionToolbar.tsx` | Create | Appears when images selected |
| `src/components/CollagePanel.tsx` | Create | Collage config + canvas preview + download |
| `src/App.tsx` | Modify | Wire all components, manage modal state |
| `src/index.css` | Modify | Tailwind v4 @theme tokens + base styles |
| `index.html` | Modify | Add JetBrains Mono from Google Fonts |
| `vite.config.ts` | Modify | Add vitest test config |
| `package.json` | Modify | Add test scripts + vitest dep |

---

## Task 1: Project Setup — Vitest, Fonts, Design Tokens

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest
```

Expected output: vitest added to devDependencies.

- [ ] **Step 2: Add vitest config block to vite.config.ts**

Replace the entire file:

```ts
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Add test scripts to package.json**

Add two scripts (keep existing scripts):

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Add JetBrains Mono to index.html**

Replace the entire file:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AY Image Viewer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Configure Tailwind v4 design tokens in src/index.css**

Replace the entire file:

```css
@import "tailwindcss";

@theme {
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --color-void: #0f0f0f;
  --color-card: #000000;
  --color-cyan: #00ffff;
  --color-signal: #0089ff;
  --color-ocean: #0096ff;
  --color-charcoal: #2c2c2c;

  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  color-scheme: dark;
}

body {
  background-color: #0f0f0f;
  color: #ffffff;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  margin: 0;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Run dev server — verify no errors**

```bash
npm run dev
```

Expected: Server starts, dark page loads at localhost:5173.

- [ ] **Step 7: Commit**

```bash
git init
git add index.html vite.config.ts package.json src/index.css package-lock.json
git commit -m "feat: setup vitest, JetBrains Mono font, Tailwind v4 design tokens"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create the types file**

```ts
// src/types/index.ts

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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript types"
```

---

## Task 3: CSV Parser + Tests

**Files:**
- Create: `src/utils/csvParser.ts`
- Create: `src/utils/__tests__/csvParser.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/__tests__/csvParser.test.ts
import { describe, it, expect } from 'vitest'
import { parseCSV, validateCSV } from '../csvParser'

describe('parseCSV', () => {
  it('parses simple header and row', () => {
    const input = 'student_id,profile_image\nabc123,https://example.com/img.jpg'
    const { headers, rows } = parseCSV(input)
    expect(headers).toEqual(['student_id', 'profile_image'])
    expect(rows).toEqual([{ student_id: 'abc123', profile_image: 'https://example.com/img.jpg' }])
  })

  it('handles CRLF line endings', () => {
    const input = 'student_id,img\r\nid1,url1\r\nid2,url2'
    const { rows } = parseCSV(input)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ student_id: 'id1', img: 'url1' })
  })

  it('handles quoted fields containing commas', () => {
    const input = 'student_id,name\nabc,"Smith, John"'
    const { rows } = parseCSV(input)
    expect(rows[0].name).toBe('Smith, John')
  })

  it('handles escaped quotes inside quoted fields', () => {
    const input = 'student_id,note\nabc,"He said ""hello"""'
    const { rows } = parseCSV(input)
    expect(rows[0].note).toBe('He said "hello"')
  })

  it('skips empty rows', () => {
    const input = 'student_id,img\nabc,url\n\nxyz,url2'
    const { rows } = parseCSV(input)
    expect(rows).toHaveLength(2)
  })

  it('trims whitespace from headers and values', () => {
    const input = ' student_id , img \n abc , url '
    const { headers, rows } = parseCSV(input)
    expect(headers).toEqual(['student_id', 'img'])
    expect(rows[0]).toEqual({ student_id: 'abc', img: 'url' })
  })

  it('handles missing trailing values as empty string', () => {
    const input = 'student_id,img1,img2\nabc,url1'
    const { rows } = parseCSV(input)
    expect(rows[0].img2).toBe('')
  })
})

describe('validateCSV', () => {
  it('returns error string when student_id column is missing', () => {
    expect(validateCSV(['name', 'image'])).toBe('Missing required "student_id" column')
  })

  it('returns null when student_id is present', () => {
    expect(validateCSV(['student_id', 'image'])).toBeNull()
  })

  it('is case-insensitive for student_id detection', () => {
    expect(validateCSV(['Student_ID', 'image'])).toBeNull()
    expect(validateCSV(['STUDENT_ID', 'image'])).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test
```

Expected: FAIL with "Cannot find module '../csvParser'"

- [ ] **Step 3: Implement csvParser.ts**

```ts
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test
```

Expected: All 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/csvParser.ts src/utils/__tests__/csvParser.test.ts
git commit -m "feat: add CSV parser with quoted-field and CRLF support"
```

---

## Task 4: Data Merger + Tests

**Files:**
- Create: `src/utils/dataMerger.ts`
- Create: `src/utils/__tests__/dataMerger.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/__tests__/dataMerger.test.ts
import { describe, it, expect } from 'vitest'
import { mergeStudentData } from '../dataMerger'
import type { ParsedFile } from '../../types'

function makeFile(filename: string, rows: Record<string, string>[], headers: string[]): ParsedFile {
  return { filename, headers, rows }
}

describe('mergeStudentData', () => {
  it('merges two files with different image columns', () => {
    const file1 = makeFile('a.csv', [{ student_id: 's1', family_image: 'url1' }], ['family_image'])
    const file2 = makeFile('b.csv', [{ student_id: 's1', profile_image: 'url2' }], ['profile_image'])
    const result = mergeStudentData([file1, file2])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      student_id: 's1',
      images: { family_image: 'url1', profile_image: 'url2' },
    })
  })

  it('later file wins on duplicate column for the same student', () => {
    const file1 = makeFile('a.csv', [{ student_id: 's1', img: 'old' }], ['img'])
    const file2 = makeFile('b.csv', [{ student_id: 's1', img: 'new' }], ['img'])
    const result = mergeStudentData([file1, file2])
    expect(result[0].images.img).toBe('new')
  })

  it('skips rows with empty student_id', () => {
    const file = makeFile('a.csv', [
      { student_id: '', img: 'url' },
      { student_id: 's1', img: 'url2' },
    ], ['img'])
    expect(mergeStudentData([file])).toHaveLength(1)
  })

  it('skips columns with empty values', () => {
    const file = makeFile('a.csv', [{ student_id: 's1', img: '' }], ['img'])
    expect(mergeStudentData([file])[0].images).toEqual({})
  })

  it('sorts result ascending by student_id', () => {
    const file = makeFile('a.csv', [
      { student_id: 'zzz', img: 'url' },
      { student_id: 'aaa', img: 'url' },
    ], ['img'])
    const result = mergeStudentData([file])
    expect(result[0].student_id).toBe('aaa')
    expect(result[1].student_id).toBe('zzz')
  })

  it('handles multiple students across multiple files', () => {
    const file1 = makeFile('a.csv', [
      { student_id: 's1', img_a: 'url1' },
      { student_id: 's2', img_a: 'url2' },
    ], ['img_a'])
    const file2 = makeFile('b.csv', [{ student_id: 's1', img_b: 'url3' }], ['img_b'])
    const result = mergeStudentData([file1, file2])
    expect(result).toHaveLength(2)
    expect(result.find(r => r.student_id === 's1')?.images).toEqual({ img_a: 'url1', img_b: 'url3' })
  })

  it('returns empty array for empty input', () => {
    expect(mergeStudentData([])).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test
```

Expected: FAIL with "Cannot find module '../dataMerger'"

- [ ] **Step 3: Implement dataMerger.ts**

```ts
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test
```

Expected: All 17 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/dataMerger.ts src/utils/__tests__/dataMerger.test.ts
git commit -m "feat: add data merger with student_id keyed merge and sort"
```

---

## Task 5: Collage Generator Utility + Tests

**Files:**
- Create: `src/utils/collageGenerator.ts`
- Create: `src/utils/__tests__/collageGenerator.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/__tests__/collageGenerator.test.ts
import { describe, it, expect } from 'vitest'
import { buildCollageFilename, getSlots } from '../collageGenerator'

describe('getSlots', () => {
  it('returns cols * rows', () => {
    expect(getSlots(2, 2)).toBe(4)
    expect(getSlots(4, 4)).toBe(16)
    expect(getSlots(3, 5)).toBe(15)
    expect(getSlots(16, 16)).toBe(256)
  })
})

describe('buildCollageFilename', () => {
  it('builds filename with grid and output dimensions', () => {
    expect(buildCollageFilename(2, 2, 1024, 1024, '2026-04-13'))
      .toBe('collage-2x2-1024x1024-2026-04-13.png')
  })

  it('handles asymmetric custom dimensions', () => {
    expect(buildCollageFilename(3, 5, 800, 600, '2026-04-13'))
      .toBe('collage-3x5-800x600-2026-04-13.png')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test
```

Expected: FAIL with "Cannot find module '../collageGenerator'"

- [ ] **Step 3: Implement collageGenerator.ts**

```ts
// src/utils/collageGenerator.ts
import type { SelectedImage } from '../types'

export function getSlots(cols: number, rows: number): number {
  return cols * rows
}

export function buildCollageFilename(
  cols: number,
  rows: number,
  width: number,
  height: number,
  date: string,
): string {
  return `collage-${cols}x${rows}-${width}x${height}-${date}.png`
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load: ${url}`))
    img.src = url
  })
}

export interface CollageResult {
  blob: Blob
  corsFailures: number
}

export async function generateCollage(
  images: SelectedImage[],
  cols: number,
  rows: number,
  outputWidth: number,
  outputHeight: number,
): Promise<CollageResult> {
  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext('2d')!

  const totalSlots = getSlots(cols, rows)
  const slotW = outputWidth / cols
  const slotH = outputHeight / rows
  const used = images.slice(0, totalSlots)

  ctx.fillStyle = '#111111'
  ctx.fillRect(0, 0, outputWidth, outputHeight)

  const results = await Promise.allSettled(used.map(img => loadImage(img.url)))
  let corsFailures = 0

  results.forEach((result, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    const x = col * slotW
    const y = row * slotH

    if (result.status === 'fulfilled') {
      const el = result.value
      // object-cover: crop to fill slot maintaining aspect ratio
      const imgAspect = el.naturalWidth / el.naturalHeight
      const slotAspect = slotW / slotH
      let sx = 0, sy = 0, sw = el.naturalWidth, sh = el.naturalHeight
      if (imgAspect > slotAspect) {
        sw = el.naturalHeight * slotAspect
        sx = (el.naturalWidth - sw) / 2
      } else {
        sh = el.naturalWidth / slotAspect
        sy = (el.naturalHeight - sh) / 2
      }
      ctx.drawImage(el, sx, sy, sw, sh, x, y, slotW, slotH)
    } else {
      corsFailures++
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(x, y, slotW, slotH)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.strokeRect(x + 0.5, y + 0.5, slotW - 1, slotH - 1)
    }
  })

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => b ? resolve(b) : reject(new Error('toBlob failed')),
      'image/png',
    )
  })

  return { blob, corsFailures }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test
```

Expected: All tests PASS. (Canvas/DOM functions are not tested in node env — the pure functions are.)

- [ ] **Step 5: Commit**

```bash
git add src/utils/collageGenerator.ts src/utils/__tests__/collageGenerator.test.ts
git commit -m "feat: add collage generator utility — canvas draw, aspect-cover, download"
```

---

## Task 6: usePagination Hook

**Files:**
- Create: `src/hooks/usePagination.ts`

- [ ] **Step 1: Implement**

```ts
// src/hooks/usePagination.ts
import { useState } from 'react'

export type PageSize = 10 | 25 | 50 | 100

export interface PaginationState {
  currentPage: number
  pageSize: PageSize
  totalPages: number
  startIndex: number
  endIndex: number
  setPage: (page: number) => void
  setPageSize: (size: PageSize) => void
  nextPage: () => void
  prevPage: () => void
  canGoNext: boolean
  canGoPrev: boolean
}

export function usePagination(totalItems: number): PaginationState {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSizeState] = useState<PageSize>(25)

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  function setPage(page: number) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  function setPageSize(size: PageSize) {
    setPageSizeState(size)
    setCurrentPage(1)
  }

  return {
    currentPage: safePage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    setPage,
    setPageSize,
    nextPage: () => setPage(safePage + 1),
    prevPage: () => setPage(safePage - 1),
    canGoNext: safePage < totalPages,
    canGoPrev: safePage > 1,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePagination.ts
git commit -m "feat: add usePagination hook"
```

---

## Task 7: useFileProcessor Hook

**Files:**
- Create: `src/hooks/useFileProcessor.ts`

- [ ] **Step 1: Implement**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useFileProcessor.ts
git commit -m "feat: add useFileProcessor hook — parse, merge, error state"
```

---

## Task 8: useImageSelection Hook

**Files:**
- Create: `src/hooks/useImageSelection.ts`

- [ ] **Step 1: Implement**

```ts
// src/hooks/useImageSelection.ts
import { useState } from 'react'
import type { SelectedImage } from '../types'

function imageKey(img: SelectedImage): string {
  return `${img.student_id}::${img.column}`
}

export interface ImageSelectionState {
  selectedImages: SelectedImage[]
  isSelected: (img: SelectedImage) => boolean
  toggleImage: (img: SelectedImage) => void
  selectAll: (images: SelectedImage[]) => void
  deselectAll: (images: SelectedImage[]) => void
  clearAll: () => void
  count: number
}

export function useImageSelection(): ImageSelectionState {
  const [selected, setSelected] = useState<Map<string, SelectedImage>>(new Map())

  function isSelected(img: SelectedImage): boolean {
    return selected.has(imageKey(img))
  }

  function toggleImage(img: SelectedImage) {
    const key = imageKey(img)
    setSelected(prev => {
      const next = new Map(prev)
      if (next.has(key)) next.delete(key)
      else next.set(key, img)
      return next
    })
  }

  function selectAll(images: SelectedImage[]) {
    setSelected(prev => {
      const next = new Map(prev)
      images.forEach(img => next.set(imageKey(img), img))
      return next
    })
  }

  function deselectAll(images: SelectedImage[]) {
    setSelected(prev => {
      const next = new Map(prev)
      images.forEach(img => next.delete(imageKey(img)))
      return next
    })
  }

  function clearAll() {
    setSelected(new Map())
  }

  return {
    selectedImages: Array.from(selected.values()),
    isSelected,
    toggleImage,
    selectAll,
    deselectAll,
    clearAll,
    count: selected.size,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useImageSelection.ts
git commit -m "feat: add useImageSelection hook — Map-based with selectAll/deselectAll"
```

---

## Task 9: EmptyState Component

**Files:**
- Create: `src/components/EmptyState.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/EmptyState.tsx

interface EmptyStateProps {
  onUploadClick: () => void
}

export function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4 py-12">
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

      {/* Copy */}
      <div className="text-center max-w-xs">
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

      {/* CTA */}
      <button
        onClick={onUploadClick}
        className="px-6 py-2 text-sm font-medium transition-transform duration-[160ms] ease-out active:scale-[0.97]"
        style={{
          background: '#ffffff',
          color: '#0a0a0a',
          borderRadius: '4px',
        }}
      >
        Upload CSV files
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EmptyState.tsx
git commit -m "feat: add EmptyState component"
```

---

## Task 10: SkeletonTable Component

**Files:**
- Create: `src/components/SkeletonTable.tsx`

- [ ] **Step 1: Implement**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SkeletonTable.tsx
git commit -m "feat: add SkeletonTable loading component"
```

---

## Task 11: FileUpload Component

**Files:**
- Create: `src/components/FileUpload.tsx`

- [ ] **Step 1: Implement**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FileUpload.tsx
git commit -m "feat: add FileUpload with drag-drop, file picker, error display"
```

---

## Task 12: DataTable Component

**Files:**
- Create: `src/components/DataTable.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/DataTable.tsx
import type { StudentRecord, SelectedImage } from '../types'

interface ThumbnailProps {
  img: SelectedImage
  isSelected: boolean
  onSelect: () => void
  onClick: () => void
}

function Thumbnail({ img, isSelected, onSelect, onClick }: ThumbnailProps) {
  return (
    <div className="relative w-14 h-14 shrink-0 group">
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        aria-label={`${isSelected ? 'Deselect' : 'Select'} image`}
        className="absolute top-0.5 left-0.5 z-10 w-5 h-5 flex items-center justify-center rounded-sm border transition-all duration-[120ms]"
        style={{
          background: isSelected ? '#00ffff' : 'rgba(0,0,0,0.75)',
          borderColor: isSelected ? '#00ffff' : 'rgba(255,255,255,0.25)',
        }}
      >
        {isSelected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <polyline points="1.5,5 3.8,7.5 8.5,2.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Image button */}
      <button
        onClick={onClick}
        aria-label={`View ${img.column} for ${img.student_id}`}
        className="w-14 h-14 rounded-sm overflow-hidden border transition-all duration-[150ms] block"
        style={{
          borderColor: isSelected ? 'rgba(0,255,255,0.45)' : 'rgba(255,255,255,0.08)',
          boxShadow: isSelected ? '0 0 0 1px rgba(0,255,255,0.2)' : 'none',
        }}
      >
        <img
          src={img.url}
          alt={`${img.student_id} ${img.column}`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          style={{ display: 'block' }}
          onError={(e) => {
            const wrapper = e.currentTarget.parentElement
            if (!wrapper) return
            e.currentTarget.style.display = 'none'
            const placeholder = wrapper.querySelector('[data-placeholder]') as HTMLElement
            if (placeholder) placeholder.style.display = 'flex'
          }}
        />
        <div
          data-placeholder
          className="w-full h-full items-center justify-center"
          style={{ display: 'none', background: 'rgba(255,255,255,0.03)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5">
            <line x1="3" y1="3" x2="21" y2="21" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </div>
      </button>
    </div>
  )
}

interface DataTableProps {
  records: StudentRecord[]
  imageColumns: string[]
  onImageClick: (img: SelectedImage, rowImages: SelectedImage[]) => void
  onImageSelect: (img: SelectedImage) => void
  isSelected: (img: SelectedImage) => boolean
  onSelectAllPage: (images: SelectedImage[], checked: boolean) => void
  pageImages: SelectedImage[]
  allPageSelected: boolean
}

export function DataTable({
  records,
  imageColumns,
  onImageClick,
  onImageSelect,
  isSelected,
  onSelectAllPage,
  pageImages,
  allPageSelected,
}: DataTableProps) {
  const thStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    textAlign: 'left',
    padding: '10px 16px',
    whiteSpace: 'nowrap',
  }

  return (
    <div
      className="w-full overflow-x-auto rounded border"
      style={{ borderColor: 'rgba(255,255,255,0.10)' }}
    >
      <table className="w-full border-collapse text-sm" style={{ minWidth: 480 }}>
        <thead>
          <tr style={{ background: '#000', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
            <th style={{ ...thStyle, width: 44, padding: '10px 16px' }}>
              <input
                type="checkbox"
                checked={allPageSelected && pageImages.length > 0}
                onChange={e => onSelectAllPage(pageImages, e.target.checked)}
                aria-label="Select all images on this page"
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#00ffff' }}
              />
            </th>
            <th style={thStyle}>student_id</th>
            {imageColumns.map(col => (
              <th key={col} style={thStyle}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record, rowIdx) => {
            const rowImages: SelectedImage[] = imageColumns
              .filter(col => record.images[col])
              .map(col => ({ student_id: record.student_id, column: col, url: record.images[col] }))

            return (
              <tr
                key={record.student_id}
                style={{
                  background: rowIdx % 2 === 0 ? '#000' : 'rgba(255,255,255,0.01)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <td style={{ padding: '10px 16px', width: 44 }}>
                  {/* no row-level checkbox; per-image only */}
                </td>
                <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                  <span
                    className="text-xs"
                    style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.85)' }}
                  >
                    {record.student_id}
                  </span>
                </td>
                {imageColumns.map(col => {
                  const url = record.images[col]
                  if (!url) {
                    return <td key={col} style={{ padding: '10px 16px' }}><div className="w-14 h-14" /></td>
                  }
                  const img: SelectedImage = { student_id: record.student_id, column: col, url }
                  return (
                    <td key={col} style={{ padding: '10px 16px' }}>
                      <Thumbnail
                        img={img}
                        isSelected={isSelected(img)}
                        onSelect={() => onImageSelect(img)}
                        onClick={() => onImageClick(img, rowImages)}
                      />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DataTable.tsx
git commit -m "feat: add DataTable with per-image checkboxes, thumbnails, broken-image fallback"
```

---

## Task 13: Pagination Component

**Files:**
- Create: `src/components/Pagination.tsx`

- [ ] **Step 1: Implement**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Pagination.tsx
git commit -m "feat: add Pagination component with ellipsis and page-size picker"
```

---

## Task 14: ImageModal Component

**Files:**
- Create: `src/components/ImageModal.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/ImageModal.tsx
import { useEffect, useRef } from 'react'
import type { SelectedImage } from '../types'

interface ImageModalProps {
  image: SelectedImage
  siblings: SelectedImage[]
  onClose: () => void
  onNavigate: (img: SelectedImage) => void
}

export function ImageModal({ image, siblings, onClose, onNavigate }: ImageModalProps) {
  const currentIdx = siblings.findIndex(s => s.student_id === image.student_id && s.column === image.column)
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx < siblings.length - 1
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeBtnRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(siblings[currentIdx - 1])
      if (e.key === 'ArrowRight' && hasNext) onNavigate(siblings[currentIdx + 1])
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, hasPrev, hasNext, currentIdx, siblings, onNavigate])

  return (
    <>
      <style>{`
        @keyframes ay-modal-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ay-modal-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* Backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Image: ${image.column} for ${image.student_id}`}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.88)',
          animation: 'ay-modal-fade 180ms ease-out forwards',
        }}
        onClick={onClose}
      >
        {/* Content */}
        <div
          className="relative flex flex-col items-center gap-4 px-4"
          style={{
            maxWidth: '90vw',
            animation: 'ay-modal-scale 200ms cubic-bezier(0.23,1,0.32,1) forwards',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="absolute -top-8 right-0 text-xs transition-opacity duration-150 opacity-50 hover:opacity-100"
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}
            aria-label="Close modal"
          >
            [esc]
          </button>

          {/* Image */}
          <img
            src={image.url}
            alt={`${image.student_id} — ${image.column}`}
            className="rounded object-contain"
            style={{
              maxWidth: '85vw',
              maxHeight: '78vh',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          />

          {/* Nav + caption */}
          <div className="flex items-center gap-5">
            {hasPrev
              ? <button onClick={() => onNavigate(siblings[currentIdx - 1])} className="text-xs opacity-50 hover:opacity-100 transition-opacity duration-150" style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>← prev</button>
              : <span className="w-12" />
            }
            <div className="text-center">
              <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.55)' }}>
                <span style={{ color: '#00ffff' }}>{image.student_id}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}> · </span>
                {image.column}
              </p>
            </div>
            {hasNext
              ? <button onClick={() => onNavigate(siblings[currentIdx + 1])} className="text-xs opacity-50 hover:opacity-100 transition-opacity duration-150" style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>next →</button>
              : <span className="w-12" />
            }
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ImageModal.tsx
git commit -m "feat: add ImageModal with keyboard nav and scale-in animation"
```

---

## Task 15: SelectionToolbar Component

**Files:**
- Create: `src/components/SelectionToolbar.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/SelectionToolbar.tsx

interface SelectionToolbarProps {
  count: number
  onClear: () => void
  onCreateCollage: () => void
}

export function SelectionToolbar({ count, onClear, onCreateCollage }: SelectionToolbarProps) {
  if (count === 0) return null

  return (
    <>
      <style>{`
        @keyframes ay-toolbar-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        className="flex items-center justify-between gap-4 px-4 py-2.5 rounded border"
        style={{
          background: 'rgba(0,255,255,0.03)',
          borderColor: 'rgba(0,255,255,0.14)',
          animation: 'ay-toolbar-in 200ms cubic-bezier(0.23,1,0.32,1) forwards',
        }}
      >
        <span className="text-sm" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(0,255,255,0.85)' }}>
          {count} image{count !== 1 ? 's' : ''} selected
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-xs px-3 py-1.5 rounded transition-all duration-[150ms] active:scale-[0.97]"
            style={{
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.45)',
              background: 'transparent',
            }}
          >
            Clear
          </button>
          <button
            onClick={onCreateCollage}
            className="text-xs px-4 py-1.5 rounded transition-all duration-[150ms] active:scale-[0.97]"
            style={{
              background: 'rgba(0,255,255,0.10)',
              border: '1px solid #0096ff',
              color: '#ffffff',
            }}
          >
            Create Collage →
          </button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SelectionToolbar.tsx
git commit -m "feat: add SelectionToolbar with slide-in animation"
```

---

## Task 16: CollagePanel Component

**Files:**
- Create: `src/components/CollagePanel.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/CollagePanel.tsx
import { useState, useRef, useEffect } from 'react'
import type { SelectedImage, CollageGrid, CollageOutputSize, CollagePresetGrid, CollagePresetSize } from '../types'
import { generateCollage, downloadBlob, buildCollageFilename, getSlots } from '../utils/collageGenerator'

interface CollagePanelProps {
  images: SelectedImage[]
  onClose: () => void
}

const GRID_PRESETS: Array<{ label: string; value: CollagePresetGrid; cols: number; rows: number }> = [
  { label: '2×2', value: '2x2', cols: 2, rows: 2 },
  { label: '4×4', value: '4x4', cols: 4, rows: 4 },
  { label: '8×8', value: '8x8', cols: 8, rows: 8 },
  { label: '16×16', value: '16x16', cols: 16, rows: 16 },
]

const SIZE_PRESETS: Array<{ label: string; value: CollagePresetSize }> = [
  { label: '512', value: 512 },
  { label: '1024', value: 1024 },
  { label: '2048', value: 2048 },
  { label: '4096', value: 4096 },
]

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export function CollagePanel({ images, onClose }: CollagePanelProps) {
  const [grid, setGrid] = useState<CollageGrid>({ cols: 2, rows: 2, preset: '2x2' })
  const [outputSize, setOutputSize] = useState<CollageOutputSize>({ width: 1024, height: 1024, preset: 1024 })
  const [customCols, setCustomCols] = useState('2')
  const [customRows, setCustomRows] = useState('2')
  const [customWidth, setCustomWidth] = useState('1024')
  const [customHeight, setCustomHeight] = useState('1024')
  const [isGenerating, setIsGenerating] = useState(false)
  const [corsFailures, setCorsFailures] = useState<number | null>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)

  const totalSlots = getSlots(grid.cols, grid.rows)
  const usedCount = Math.min(images.length, totalSlots)
  const emptySlots = Math.max(0, totalSlots - images.length)

  // Draw preview whenever grid or output aspect ratio changes
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const PREVIEW_W = 260
    const aspect = outputSize.height / outputSize.width
    const PREVIEW_H = Math.round(PREVIEW_W * aspect)
    canvas.width = PREVIEW_W
    canvas.height = PREVIEW_H

    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H)

    const slotW = PREVIEW_W / grid.cols
    const slotH = PREVIEW_H / grid.rows

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const idx = row * grid.cols + col
        const x = col * slotW
        const y = row * slotH
        ctx.fillStyle = idx < images.length ? 'rgba(0,255,255,0.07)' : 'rgba(255,255,255,0.025)'
        ctx.fillRect(x + 0.5, y + 0.5, slotW - 1, slotH - 1)
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'
        ctx.strokeRect(x + 0.5, y + 0.5, slotW - 1, slotH - 1)
      }
    }
  }, [grid, outputSize.height, outputSize.width, images.length])

  // Keyboard close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function selectGridPreset(p: typeof GRID_PRESETS[0]) {
    setGrid({ cols: p.cols, rows: p.rows, preset: p.value })
    setCustomCols(String(p.cols))
    setCustomRows(String(p.rows))
  }

  function applyCustomGrid() {
    const cols = clamp(parseInt(customCols) || 2, 1, 32)
    const rows = clamp(parseInt(customRows) || 2, 1, 32)
    setGrid({ cols, rows, preset: 'custom' })
    setCustomCols(String(cols))
    setCustomRows(String(rows))
  }

  function selectSizePreset(p: typeof SIZE_PRESETS[0]) {
    setOutputSize({ width: p.value, height: p.value, preset: p.value })
    setCustomWidth(String(p.value))
    setCustomHeight(String(p.value))
  }

  function applyCustomSize() {
    const width = clamp(parseInt(customWidth) || 1024, 64, 8192)
    const height = clamp(parseInt(customHeight) || 1024, 64, 8192)
    setOutputSize({ width, height, preset: 'custom' })
    setCustomWidth(String(width))
    setCustomHeight(String(height))
  }

  async function handleGenerate() {
    setIsGenerating(true)
    setCorsFailures(null)
    try {
      const { blob, corsFailures: failures } = await generateCollage(
        images, grid.cols, grid.rows, outputSize.width, outputSize.height,
      )
      setCorsFailures(failures)
      const date = new Date().toISOString().slice(0, 10)
      downloadBlob(blob, buildCollageFilename(grid.cols, grid.rows, outputSize.width, outputSize.height, date))
    } finally {
      setIsGenerating(false)
    }
  }

  // Styles
  const chipBase: React.CSSProperties = {
    padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.09)', background: 'transparent',
    color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)',
    transition: 'all 120ms ease-out',
  }
  const chipActive: React.CSSProperties = {
    ...chipBase, background: 'rgba(0,255,255,0.08)',
    borderColor: 'rgba(0,255,255,0.32)', color: '#00ffff',
  }
  const inputStyle: React.CSSProperties = {
    width: 68, padding: '4px 8px', borderRadius: 4, fontSize: 12,
    border: '1px solid rgba(255,255,255,0.10)', background: '#000',
    color: '#fff', fontFamily: 'var(--font-mono)', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
    letterSpacing: '0.3px', color: 'rgba(255,255,255,0.35)',
  }

  return (
    <>
      <style>{`
        @keyframes ay-modal-scale { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
      `}</style>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.88)' }}
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create collage"
          className="relative flex flex-col gap-5 p-6 rounded w-full max-w-md max-h-[90vh] overflow-y-auto"
          style={{
            background: '#080808',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '4px 4px 0 0 rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.5)',
            animation: 'ay-modal-scale 200ms cubic-bezier(0.23,1,0.32,1) forwards',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium" style={{ color: '#fff', lineHeight: 1 }}>
              Create Collage
            </h2>
            <button
              onClick={onClose}
              className="text-xs opacity-40 hover:opacity-70 transition-opacity"
              style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}
              aria-label="Close"
            >
              [esc]
            </button>
          </div>

          {/* Grid section */}
          <div className="flex flex-col gap-2.5">
            <span style={labelStyle}>Grid</span>
            <div className="flex flex-wrap gap-1.5">
              {GRID_PRESETS.map(p => (
                <button key={p.value} onClick={() => selectGridPreset(p)} style={grid.preset === p.value ? chipActive : chipBase}>
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setGrid(g => ({ ...g, preset: 'custom' }))}
                style={grid.preset === 'custom' ? chipActive : chipBase}
              >
                Custom
              </button>
            </div>
            {grid.preset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="number" min="1" max="32" value={customCols}
                  onChange={e => setCustomCols(e.target.value)}
                  onBlur={applyCustomGrid}
                  style={inputStyle} placeholder="cols" aria-label="Columns"
                />
                <span style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>×</span>
                <input
                  type="number" min="1" max="32" value={customRows}
                  onChange={e => setCustomRows(e.target.value)}
                  onBlur={applyCustomGrid}
                  style={inputStyle} placeholder="rows" aria-label="Rows"
                />
              </div>
            )}
            <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}>
              {images.length} selected · {usedCount} used · {emptySlots} empty
            </p>
          </div>

          {/* Output size section */}
          <div className="flex flex-col gap-2.5">
            <span style={labelStyle}>Output Size (px)</span>
            <div className="flex flex-wrap gap-1.5">
              {SIZE_PRESETS.map(p => (
                <button key={p.value} onClick={() => selectSizePreset(p)} style={outputSize.preset === p.value ? chipActive : chipBase}>
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setOutputSize(s => ({ ...s, preset: 'custom' }))}
                style={outputSize.preset === 'custom' ? chipActive : chipBase}
              >
                Custom
              </button>
            </div>
            {outputSize.preset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="number" min="64" max="8192" value={customWidth}
                  onChange={e => setCustomWidth(e.target.value)}
                  onBlur={applyCustomSize}
                  style={inputStyle} placeholder="width" aria-label="Width"
                />
                <span style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>×</span>
                <input
                  type="number" min="64" max="8192" value={customHeight}
                  onChange={e => setCustomHeight(e.target.value)}
                  onBlur={applyCustomSize}
                  style={inputStyle} placeholder="height" aria-label="Height"
                />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>px</span>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-2">
            <span style={labelStyle}>Preview</span>
            <canvas
              ref={previewRef}
              className="rounded border"
              style={{ borderColor: 'rgba(255,255,255,0.07)', width: '100%', maxWidth: 260 }}
            />
          </div>

          {/* CORS warning */}
          {corsFailures !== null && corsFailures > 0 && (
            <div
              className="text-xs px-3 py-2 rounded"
              role="alert"
              style={{
                background: 'rgba(251,146,60,0.07)',
                border: '1px solid rgba(251,146,60,0.18)',
                color: 'rgba(253,186,116,0.9)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {corsFailures} image{corsFailures !== 1 ? 's' : ''} failed to load (CORS) — shown as placeholder
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || images.length === 0}
            className="w-full py-2.5 text-sm font-medium rounded transition-all duration-[150ms] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isGenerating ? 'rgba(255,255,255,0.08)' : '#ffffff',
              color: '#0a0a0a',
              borderRadius: 4,
            }}
          >
            {isGenerating ? 'Generating…' : 'Download PNG'}
          </button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CollagePanel.tsx
git commit -m "feat: add CollagePanel — preset/custom grid and size, live preview, CORS warning"
```

---

## Task 17: App.tsx — Integration

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace App.tsx**

```tsx
// src/App.tsx
import { useState, useMemo, useRef } from 'react'
import type { SelectedImage } from './types'
import { useFileProcessor } from './hooks/useFileProcessor'
import { usePagination } from './hooks/usePagination'
import { useImageSelection } from './hooks/useImageSelection'
import { FileUpload } from './components/FileUpload'
import { DataTable } from './components/DataTable'
import { Pagination } from './components/Pagination'
import { ImageModal } from './components/ImageModal'
import { SelectionToolbar } from './components/SelectionToolbar'
import { CollagePanel } from './components/CollagePanel'
import { SkeletonTable } from './components/SkeletonTable'
import { EmptyState } from './components/EmptyState'

export default function App() {
  const { processingState, records, errors, allImageColumns, processFiles, reset } = useFileProcessor()
  const pagination = usePagination(records.length)
  const selection = useImageSelection()
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const [modalImage, setModalImage] = useState<SelectedImage | null>(null)
  const [modalSiblings, setModalSiblings] = useState<SelectedImage[]>([])
  const [showCollage, setShowCollage] = useState(false)

  const pageRecords = useMemo(
    () => records.slice(pagination.startIndex, pagination.endIndex),
    [records, pagination.startIndex, pagination.endIndex],
  )

  const pageImages = useMemo(
    () => pageRecords.flatMap(r =>
      allImageColumns
        .filter(col => r.images[col])
        .map(col => ({ student_id: r.student_id, column: col, url: r.images[col] }))
    ),
    [pageRecords, allImageColumns],
  )

  const allPageSelected =
    pageImages.length > 0 && pageImages.every(img => selection.isSelected(img))

  function handleSelectAllPage(images: SelectedImage[], checked: boolean) {
    if (checked) selection.selectAll(images)
    else selection.deselectAll(images)
  }

  function handleImageClick(img: SelectedImage, rowImages: SelectedImage[]) {
    setModalImage(img)
    setModalSiblings(rowImages)
  }

  const isLoading = processingState === 'processing'
  const hasData = records.length > 0
  const isIdle = processingState === 'idle'

  return (
    <div className="min-h-screen" style={{ background: '#0f0f0f' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b"
        style={{
          background: 'rgba(15,15,15,0.92)',
          borderColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span
          className="text-sm font-medium"
          style={{ fontFamily: 'var(--font-mono)', color: '#fff', letterSpacing: '-0.02em' }}
        >
          ay<span style={{ color: '#00ffff' }}>.</span>image
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>_viewer</span>
        </span>

        {hasData && (
          <button
            onClick={() => { reset(); selection.clearAll() }}
            className="text-xs px-3 py-1.5 rounded transition-all duration-[150ms] active:scale-[0.97]"
            style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
          >
            Reset
          </button>
        )}
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Upload zone */}
        <FileUpload
          onFiles={processFiles}
          errors={errors}
          isProcessing={isLoading}
          uploadInputRef={uploadInputRef}
        />

        {/* Loading skeleton */}
        {isLoading && <SkeletonTable rows={5} cols={Math.max(allImageColumns.length, 3)} />}

        {/* Empty state — no uploads yet */}
        {!isLoading && isIdle && (
          <EmptyState onUploadClick={() => uploadInputRef.current?.click()} />
        )}

        {/* No valid data after processing */}
        {!isLoading && !isIdle && !hasData && (
          <p
            className="text-sm text-center py-12"
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)' }}
          >
            No valid student records found.
          </p>
        )}

        {/* Main data view */}
        {!isLoading && hasData && (
          <>
            {/* Stats bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.28)' }}>
                {records.length} students · {allImageColumns.length} image column{allImageColumns.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Selection toolbar */}
            <SelectionToolbar
              count={selection.count}
              onClear={selection.clearAll}
              onCreateCollage={() => setShowCollage(true)}
            />

            {/* Table */}
            <DataTable
              records={pageRecords}
              imageColumns={allImageColumns}
              onImageClick={handleImageClick}
              onImageSelect={selection.toggleImage}
              isSelected={selection.isSelected}
              onSelectAllPage={handleSelectAllPage}
              pageImages={pageImages}
              allPageSelected={allPageSelected}
            />

            {/* Pagination */}
            <Pagination pagination={pagination} totalItems={records.length} />
          </>
        )}
      </main>

      {/* Lightbox modal */}
      {modalImage && (
        <ImageModal
          image={modalImage}
          siblings={modalSiblings}
          onClose={() => setModalImage(null)}
          onNavigate={setModalImage}
        />
      )}

      {/* Collage panel */}
      {showCollage && (
        <CollagePanel
          images={selection.selectedImages}
          onClose={() => setShowCollage(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run dev server and do a full end-to-end test**

```bash
npm run dev
```

Test each flow:
1. Open http://localhost:5173 — dark background and header visible, empty state shown
2. Click "Upload CSV files" — file picker opens
3. Upload a CSV with `student_id,image_url` columns — skeleton appears, then table renders
4. Upload a second CSV with different columns — columns merge correctly
5. Click a thumbnail — modal opens with caption
6. Press `←`/`→` to navigate between images in the same row
7. Press `Escape` — modal closes
8. Check a thumbnail checkbox — SelectionToolbar appears
9. Click "Create Collage" — CollagePanel opens
10. Pick 4×4 grid, 2048px output, click "Download PNG" — file downloads
11. Switch to Custom grid, enter 3×5, tab out — preview updates to 3×5 grid
12. Enter custom width 800 × height 600, tab out — preview aspect ratio updates
13. Verify pagination: page size dropdown, prev/next buttons, page numbers

- [ ] **Step 3: Run all utility tests**

```bash
npm run test
```

Expected: All tests PASS.

- [ ] **Step 4: Final commit**

```bash
git add src/App.tsx
git commit -m "feat: wire all components in App.tsx — Ay Image Viewer complete"
```

---

## Self-Review Checklist

- [x] CSV upload: file picker + drag-drop + validation errors ✓
- [x] CSV parsing: quoted fields, CRLF, whitespace trim ✓
- [x] Data merging: student_id key, later-wins, sort ascending ✓
- [x] Table: thumbnails, broken-image fallback, lazy load ✓
- [x] Image modal: scale-in animation, keyboard nav, body scroll lock ✓
- [x] Pagination: ellipsis, page-size picker, resets on data change ✓
- [x] Image selection: per-image checkbox, select-all page, clear ✓
- [x] Selection toolbar: appears/disappears, count, clear, collage CTA ✓
- [x] Collage presets: 2×2/4×4/8×8/16×16 ✓
- [x] Custom grid: 1–32 cols × rows, validated on blur ✓
- [x] Collage output presets: 512/1024/2048/4096 ✓
- [x] Custom output size: 64–8192 px width × height, validated on blur ✓
- [x] Live collage preview: canvas redraws on any change ✓
- [x] CORS failure: per-image, count shown in UI ✓
- [x] Filename encodes grid + size: `collage-2x2-1024x1024-2026-04-13.png` ✓
- [x] DESIGN.md: Void Black bg, Ghost White text, cyan accents, JetBrains Mono ✓
- [x] Animations: scale(0.95)→1 modal, toolbar slide-in, no ease-in ✓
- [x] prefers-reduced-motion: global CSS rule removes all animation ✓
- [x] Accessibility: role=dialog, aria-modal, aria-label, focus management ✓
- [x] React Compiler: no manual useMemo/useCallback in hooks ✓
- [x] TypeScript: strict types throughout, no `any` ✓
