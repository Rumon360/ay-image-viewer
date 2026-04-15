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
