# ay-image-viewer

Upload CSVs with student IDs and image URLs, browse thumbnails in a paginated table, preview images in a lightbox, and generate downloadable PNG collages.

## Features

- **Multi-file CSV upload** — drag-drop or file picker, multiple files at once
- **Auto-merge by student_id** — columns from different CSVs merged per student; later file wins on duplicate columns
- **Thumbnail table** — all non-`student_id` columns treated as image URL columns and rendered as 56×56 thumbnails
- **Complete rows filter** — toggle to show only rows where every image column has a value
- **Lightbox** — click any thumbnail to preview full-size; keyboard navigate with `←` / `→`, close with `Esc`
- **Image selection** — per-image checkbox, select-page, clear-all
- **Collage generator** — configure grid (2×2 → 16×16 or custom 1–32), output size (512–4096px or custom 64–8192px), gap size + color, padding size + color; downloads as PNG
- **Pagination** — 10 / 25 / 50 / 100 rows per page

## CSV format

Every CSV must have a `student_id` column (case-insensitive). All other columns are treated as image URL columns.

```csv
student_id,profile_image,transfer_image
1001,https://example.com/1001.jpg,https://example.com/1001t.jpg
1002,https://example.com/1002.jpg,
```

Multiple files are merged additively — a student appearing in several files gets all their columns combined.

## Stack

- React 19 + React Compiler (automatic memoization)
- TypeScript
- Tailwind CSS v4
- Vite
- Vitest

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run test` | Run tests (Vitest) |
| `npm run test:watch` | Watch mode |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |
