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
