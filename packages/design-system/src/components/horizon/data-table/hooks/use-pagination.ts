/**
 * Props for the usePagination hook.
 * @see usePagination
 */
type UsePaginationProps = {
  /** Current page (1-based). */
  currentPage: number
  /** Total number of pages. */
  totalPages: number
  /** Max page numbers to show. */
  paginationItemsToDisplay: number
}

/**
 * Return value of usePagination.
 */
type UsePaginationReturn = {
  /** Page numbers to display. */
  pages: number[]
  /** Show ellipsis on the left. */
  showLeftEllipsis: boolean
  /** Show ellipsis on the right. */
  showRightEllipsis: boolean
}

/**
 * Computes page numbers and ellipsis visibility for numeric pagination.
 */
export function usePagination({
  currentPage,
  totalPages,
  paginationItemsToDisplay,
}: UsePaginationProps): UsePaginationReturn {
  const showLeftEllipsis = currentPage - 1 > paginationItemsToDisplay / 2
  const showRightEllipsis = totalPages - currentPage + 1 > paginationItemsToDisplay / 2

  function calculatePaginationRange(): number[] {
    if (totalPages <= paginationItemsToDisplay) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const halfDisplay = Math.floor(paginationItemsToDisplay / 2)
    const initialRange = {
      start: currentPage - halfDisplay,
      end: currentPage + halfDisplay,
    }

    const adjustedRange = {
      start: Math.max(1, initialRange.start),
      end: Math.min(totalPages, initialRange.end),
    }

    if (adjustedRange.start === 1) {
      adjustedRange.end = paginationItemsToDisplay
    }
    if (adjustedRange.end === totalPages) {
      adjustedRange.start = totalPages - paginationItemsToDisplay + 1
    }

    if (showLeftEllipsis) adjustedRange.start++
    if (showRightEllipsis) adjustedRange.end--

    return Array.from({ length: adjustedRange.end - adjustedRange.start + 1 }, (_, i) => adjustedRange.start + i)
  }

  const pages = calculatePaginationRange()

  return {
    pages,
    showLeftEllipsis,
    showRightEllipsis,
  }
}
