"use client"

import { z } from "zod"

/** Serialises one value for `FormData`: files stay binary, dates go ISO, objects go JSON. */
function appendValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return
  if (value instanceof Blob) {
    formData.append(key, value)
  } else if (value instanceof Date) {
    // An instant, not a calendar day: a date-only value at local midnight can read as the
    // previous day in UTC+ zones. Format it yourself if the backend expects "yyyy-MM-dd".
    formData.append(key, value.toISOString())
  } else if (typeof value === "object") {
    formData.append(key, JSON.stringify(value))
  } else {
    formData.append(key, String(value))
  }
}

/**
 * Converts form values to FormData for multipart/form-data submissions.
 * Top-level keys only. `File`/`Blob` values, `FileList`s and arrays append one entry per
 * item under the same key; dates become ISO strings; nested objects become JSON;
 * `null`/`undefined` are skipped.
 */
export const convertValuesToFormData = <TSchema extends z.ZodTypeAny>(values: z.infer<TSchema>): FormData => {
  const formData = new FormData()

  if (!values) {
    return formData
  }

  Object.entries(values).forEach(([key, value]) => {
    const isFileList = typeof FileList !== "undefined" && value instanceof FileList
    if (Array.isArray(value) || isFileList) {
      Array.from(value as ArrayLike<unknown>).forEach((item) => appendValue(formData, key, item))
    } else {
      appendValue(formData, key, value)
    }
  })

  return formData
}
