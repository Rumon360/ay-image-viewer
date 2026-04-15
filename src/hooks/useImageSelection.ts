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
