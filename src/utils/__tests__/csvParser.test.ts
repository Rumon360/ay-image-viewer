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
