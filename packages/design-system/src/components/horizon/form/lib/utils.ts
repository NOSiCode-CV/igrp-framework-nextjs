"use client"

import { z } from "zod"

/**
 * Converts form values to FormData for multipart/form-data submissions.
 * Handles arrays, File, Date, and primitives.
 */
export const convertValuesToFormData = <TSchema extends z.ZodTypeAny>(values: z.infer<TSchema>): FormData => {
  const formData = new FormData()

  if (!values) {
    return formData
  }

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)))
      } else if (value instanceof File) {
        formData.append(key, value)
      } else if (value instanceof Date) {
        formData.append(key, value.toISOString())
      } else {
        formData.append(key, String(value))
      }
    }
  })

  return formData
}
