/**
 * Helpers for wiring a react-hook-form `field` onto a control that also takes
 * caller props.
 *
 * The failure these exist for: a Horizon input bound `onChange={field.onChange}`
 * and then spread the caller's props after it, so a caller `onChange` (to
 * uppercase a code, strip characters, log) silently replaced the binding. The
 * input kept showing the keystroke, react-hook-form never saw it, and the value
 * snapped back. Bind the field first, run the caller's handler after it, and
 * never let a caller key replace a bound one.
 */

/**
 * Returns one handler that calls the form binding, then the caller's handler.
 * `caller` may be `undefined`, so it can be passed through unconditionally. The
 * binding runs first so the caller observes the value the form already holds.
 *
 * `bound` may ignore the event (`field.onBlur` takes none); the returned
 * handler's signature comes from the caller's.
 */
function igrpChainHandlers<TArgs extends unknown[]>(
  bound: ((...args: TArgs) => void) | (() => void),
  caller: ((...args: TArgs) => void) | undefined
): (...args: TArgs) => void {
  return (...args: TArgs) => {
    ;(bound as (...args: TArgs) => void)(...args)
    caller?.(...args)
  }
}

/**
 * Merges refs into one callback ref. Used to hand `field.ref` to the focusable
 * element — react-hook-form calls `.focus()` on it for the first invalid field
 * on submit — without discarding a ref the caller passed.
 */
function igrpMergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.RefObject<T | null>).current = node
    }
  }
}

export { igrpChainHandlers, igrpMergeRefs }
