import { useRef, useCallback, useEffect } from "react";
export const useInspectorScroll = ({
  inspectorEnabled,
  clearInspectorState,
  debouncedInspectorUpdate,
  rootRef,
  isOverlayHiddenRef
}) => {
  const scrollableElementRef = useRef(null);
  const hideOverlayOnScroll = useCallback(() => {
    if (!inspectorEnabled || isOverlayHiddenRef.current) return;
    clearInspectorState();
    debouncedInspectorUpdate.cancel();
  }, [inspectorEnabled, clearInspectorState, debouncedInspectorUpdate, isOverlayHiddenRef]);
  useEffect(() => {
    const rootElement = rootRef.current;
    if (!rootElement) return;
    const viewport = rootElement.querySelector("[data-radix-scroll-area-viewport]");
    scrollableElementRef.current = viewport || rootElement;
  }, [rootRef]);
  useEffect(() => {
    const scrollableElement = scrollableElementRef.current;
    if (!scrollableElement || !inspectorEnabled) return;
    scrollableElement.addEventListener("scroll", hideOverlayOnScroll, {
      passive: true
    });
    return () => {
      scrollableElement.removeEventListener("scroll", hideOverlayOnScroll);
    };
  }, [inspectorEnabled, hideOverlayOnScroll]);
  return {
    scrollableElementRef
  };
};
//# sourceMappingURL=use-inspector-scroll.js.map