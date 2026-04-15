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
