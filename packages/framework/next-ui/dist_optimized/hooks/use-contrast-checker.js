import { useState, useEffect, useCallback } from "react";
import { getContrastRatio } from "../utils/contrast-checker";
import { debounce } from "../utils/debounce";
/**
 * Hook that calculates the contrast ratio between foreground and background colors for a list of pairs.
 * @param colorPairs - An array of color pairs, each with an id, foreground color, and background color.
 * @returns An array of objects, each containing the id and calculated contrast ratio for a pair.
 */
export function useContrastChecker(colorPairs) {
  const [contrastResults, setContrastResults] = useState([]);
  const debouncedCalculation = useCallback(debounce(pairs => {
    if (!pairs.length) {
      setContrastResults([]);
      return;
    }
    try {
      const results = pairs.map(pair => {
        const ratio = parseFloat(getContrastRatio(pair.foreground, pair.background));
        return {
          id: pair.id,
          contrastRatio: ratio
        };
      });
      setContrastResults(results);
    } catch (error) {
      console.error("Error checking contrast:", error);
      setContrastResults([]);
    }
  }, 750), []);
  useEffect(() => {
    debouncedCalculation(colorPairs);
  }, [colorPairs, debouncedCalculation]);
  return contrastResults;
}
//# sourceMappingURL=use-contrast-checker.js.map