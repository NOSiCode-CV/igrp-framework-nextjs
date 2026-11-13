import { describe, expect, it } from "vitest"

import { usePagination } from "../hooks/use-pagination.js"

describe("usePagination", () => {
  it("shows no ellipsis when every page fits", () => {
    expect(usePagination({ currentPage: 5, totalPages: 5, paginationItemsToDisplay: 5 })).toEqual({
      pages: [1, 2, 3, 4, 5],
      showLeftEllipsis: false,
      showRightEllipsis: false,
    })
  })

  it("elides both sides in the middle of a long range", () => {
    const result = usePagination({ currentPage: 10, totalPages: 20, paginationItemsToDisplay: 5 })
    expect(result.showLeftEllipsis).toBe(true)
    expect(result.showRightEllipsis).toBe(true)
  })
})
