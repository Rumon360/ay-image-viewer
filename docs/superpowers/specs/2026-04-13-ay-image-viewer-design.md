# Ay Image Viewer — Design Spec

**Date:** 2026-04-13  
**Stack:** React 19 + TypeScript + Tailwind v4 + Vite + React Compiler  
**Design system:** DESIGN.md (Composio-inspired dark terminal aesthetic)

---

## 1. Overview

A single-page web app that lets users upload multiple CSV files, each containing a `student_id` column and one or more image-URL columns. The app merges all CSVs by `student_id`, displays a paginated table of students with their image thumbnails, supports a lightbox preview, and can generate downloadable image collages from selected thumbnails.

---

## 2. Architecture

### Project Structure

```
src/
├── types/index.ts
├── utils/
│   ├── csvParser.ts
│   ├── dataMerger.ts
│   └── collageGenerator.ts
├── hooks/
│   ├── useFileProcessor.ts
│   ├── usePagination.ts
│   └── useImageSelection.ts
├── components/
│   ├── FileUpload.tsx
│   ├── DataTable.tsx
│   ├── SelectionToolbar.tsx
│   ├── Pagination.tsx
│   ├── ImageModal.tsx
│   ├── CollagePanel.tsx
│   ├── SkeletonTable.tsx
│   └── EmptyState.tsx
├── App.tsx
├── main.tsx
└── index.css
```

### Data Flow

```
FileUpload
  └─ File[] → useFileProcessor
                ├─ csvParser.ts    → ParsedFile[]  (async, per-file)
                └─ dataMerger.ts   → StudentRecord[]  (merged by student_id)
                        │
                        ▼
              usePagination (client-side)
                        │
                        ▼
              DataTable  ──click thumbnail──▶  ImageModal (lightbox)
                        │
                        ▼ (checkbox select)
              useImageSelection
                        │
                        ▼
              SelectionToolbar ──open──▶ CollagePanel
                                              └─ collageGenerator.ts → download PNG
```

---

## 3. Core Types

```ts
type StudentRecord = {
  student_id: string;
  images: Record<string, string>; // columnName → URL
};

type ParsedFile = {
  filename: string;
  headers: string[]; // all columns except student_id
  rows: Record<string, string>[];
};

type AppError = {
  file: string;
  message: string;
};

type SelectedImage = {
  student_id: string;
  column: string;
  url: string;
};

type CollageGrid = {
  cols: number; // 1–32, default 2
  rows: number; // 1–32, default 2
  preset: "2x2" | "4x4" | "8x8" | "16x16" | "custom";
};

type CollageOutputSize = {
  width: number; // 64–8192
  height: number; // 64–8192
  preset: 512 | 1024 | 2048 | 4096 | "custom";
};
```

---

## 4. Feature Specifications

### 4.1 CSV Upload

- File picker (multiple) + drag-and-drop zone
- Validation: must be `.csv` MIME type or extension; must contain `student_id` column
- Errors shown inline below the drop zone (one error per file, not a toast)
- Multiple uploads are additive — new files merge into existing dataset
- Loading skeleton shown during parse + merge

### 4.2 CSV Parsing

- Native implementation (no external lib): handles quoted fields, escaped quotes, CRLF/LF
- Trims whitespace from headers and values
- Skips empty rows
- First column named `student_id` (case-insensitive match) is the key
- All other columns treated as image URL columns

### 4.3 Data Merging

- Key: `student_id` (exact string match after trim)
- Duplicate `student_id` across files: columns are merged; if same column appears in two files with different values, the later upload wins
- Missing values left as empty string (not rendered as thumbnail)
- Result sorted by `student_id` ascending

### 4.4 Data Table

- Responsive layout: full table on desktop, card-per-row stacking on mobile
- Columns: `student_id` (monospace, sticky-ish), one column per image key
- Thumbnails: 56×56px, `object-cover`, lazy-loaded (`loading="lazy"`)
- Broken image: show placeholder icon (no alt text noise)
- Hover on thumbnail: scale(1.05), guarded behind `@media (hover: hover)`
- Click thumbnail: opens ImageModal

### 4.5 Image Modal (Lightbox)

- Backdrop: `rgba(0,0,0,0.85)`, click-outside to close
- Content: image up to 90vw/90vh, `object-contain`
- Animation: `scale(0.95) opacity(0)` → `scale(1) opacity(1)`, 200ms ease-out
- Keyboard: `Escape` closes; `←/→` navigates between images in same row
- Shows student_id + column name as caption (JetBrains Mono)

### 4.6 Pagination

- Client-side only
- Page size options: 10, 25, 50, 100
- Controls: previous, page numbers (up to 7 shown, ellipsis if more), next
- Resets to page 1 on data change

### 4.7 Image Selection + Collage

**Selection:**

- Checkbox on each thumbnail (appears on hover, always visible on mobile)
- `useImageSelection` manages a `Set<string>` keyed by `${student_id}::${column}`
- "Select all on page" checkbox in table header

**Selection Toolbar:**

- Fixed bar above table when ≥1 image selected
- Shows: "N images selected" + "Clear" + "Create Collage"
- Animation: slides in from top, 200ms ease-out

**Collage Panel (modal/drawer):**

- Grid size: preset chips (2×2, 4×4, 8×8, 16×16) + "Custom" toggle that reveals two number inputs (columns × rows), min 1, max 32 each; total slots = cols × rows
- Output size: preset chips (512, 1024, 2048, 4096 px) + "Custom" toggle that reveals separate width and height number inputs (px), min 64, max 8192 each
- Active preset chip highlighted with cyan accent border; Custom inputs validated on blur (clamp to limits)
- Preview: live canvas preview (downscaled to fit panel) showing slot arrangement, updates on any setting change
- Images fill slots left-to-right, top-to-bottom; excess images ignored; empty slots = `#111111`
- Generate + Download: `canvas.toBlob('image/png')` → download as `collage-{cols}x{rows}-{width}x{height}-YYYY-MM-DD.png`
- CORS: load with `crossOrigin = 'anonymous'`; track failed images; show "N images could not be loaded (CORS)" warning, those slots render as dark placeholder

### 4.8 Empty State

- Shown when no files have been uploaded
- Centered layout: upload icon, heading, subtext, upload CTA
- Style: Void Black bg, Ghost White text, cyan accent on icon

### 4.9 Skeleton Loading

- Shown during CSV parse + merge (typically <500ms but could be longer for large files)
- Table skeleton: 5 placeholder rows with animated opacity pulse
- Matches real table column widths

---

## 5. Visual Design

Follows DESIGN.md exactly.

| Token                 | Value                           |
| --------------------- | ------------------------------- |
| Page background       | `#0f0f0f`                       |
| Card background       | `#000000`                       |
| Card border           | `rgba(255,255,255,0.10)`        |
| Primary text          | `#ffffff`                       |
| Secondary text        | `rgba(255,255,255,0.6)`         |
| Accent glow           | `#00ffff`                       |
| Button border         | `#0089ff`                       |
| Monospace font        | JetBrains Mono (Google Fonts)   |
| Body font             | system-ui (abcDiatype fallback) |
| Border radius (cards) | 4px                             |
| Hard-offset shadow    | `4px 4px 0 0 rgba(0,0,0,0.15)`  |

### Animation Rules (Emil Kowalski principles)

- Modal: `scale(0.95) + opacity 0` → full, 200ms `cubic-bezier(0.23, 1, 0.32, 1)`
- Thumbnail hover: `scale(1.05)`, 150ms ease-out, `@media (hover: hover)` only
- Button press: `scale(0.97)` on `:active`, 160ms ease-out
- Toolbar slide-in: `translateY(-100%)` → `translateY(0)`, 200ms ease-out
- Skeleton pulse: opacity 0.4 → 0.7 → 0.4, 1.5s linear loop
- `prefers-reduced-motion`: keep opacity transitions, remove transforms

---

## 6. Performance

- React Compiler handles memoization automatically
- Images: `loading="lazy"` + `decoding="async"`
- Large datasets: `useMemo` for sort/filter in hooks if compiler misses (manual fallback)
- Collage canvas: offscreen canvas, async image loading with `Promise.allSettled`
- CSV parsing: sync per file but kicked off in `useEffect`; show skeleton immediately

---

## 7. Accessibility

- All interactive elements: minimum 44×44px touch target
- Modal: focus trap, `role="dialog"`, `aria-modal="true"`, `aria-label`
- Thumbnails: `alt={student_id + ' ' + column}`
- Keyboard nav: Tab through controls, Enter/Space on thumbnails
- `prefers-reduced-motion` respected
- Error messages: `role="alert"`

---

## 8. Out of Scope

- Server-side processing
- Persistent storage (no localStorage)
- Authentication
- Export formats other than PNG
- Image editing beyond collage grid
