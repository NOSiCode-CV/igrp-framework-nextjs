/** Clamps a 1-based step index into [1, count]; 1 when there are no steps. */
function clampStepIndex(value: number, count: number): number {
  return Math.min(Math.max(value, 1), Math.max(count, 1))
}

/** 1-based index of the step with `key`; 1 when the key is absent or unknown. */
function resolveStepIndex(steps: readonly { key: string }[], key: string | undefined): number {
  const i = steps.findIndex((s) => s.key === key)
  return i === -1 ? 1 : i + 1
}

export { clampStepIndex, resolveStepIndex }
