import { useState, useRef, useCallback } from "react";
import { areInspectorStatesEqual, createInspectorState, getEmptyInspectorState } from "../../lib/inspector/inspector-state-utils";
export const useInspectorState = () => {
  const [inspector, setInspector] = useState(getEmptyInspectorState());
  const [inspectorEnabled, setInspectorEnabled] = useState(false);
  const lastElementRef = useRef(null);
  const isOverlayHiddenRef = useRef(false);
  const updateInspectorState = useCallback((rect, matches) => {
    setInspector(prev => {
      const newState = createInspectorState(rect, matches);
      if (areInspectorStatesEqual(prev, newState)) {
        return prev;
      }
      isOverlayHiddenRef.current = false;
      return newState;
    });
  }, []);
  const clearInspectorState = useCallback(() => {
    if (lastElementRef.current || !isOverlayHiddenRef.current) {
      lastElementRef.current = null;
      isOverlayHiddenRef.current = true;
      setInspector(getEmptyInspectorState());
    }
  }, []);
  const toggleInspector = useCallback(onToggleOff => {
    setInspectorEnabled(prev => {
      if (prev) {
        lastElementRef.current = null;
        isOverlayHiddenRef.current = true;
        setInspector(getEmptyInspectorState());
        onToggleOff?.();
      } else {
        isOverlayHiddenRef.current = false;
      }
      return !prev;
    });
  }, []);
  return {
    inspector,
    inspectorEnabled,
    lastElementRef,
    isOverlayHiddenRef,
    updateInspectorState,
    clearInspectorState,
    toggleInspector
  };
};
//# sourceMappingURL=use-inspector-state.js.map