import { useQueryState } from "nuqs";
const TABS = ["colors", "typography", "other", "ai"];
export const DEFAULT_TAB = TABS[0];
export const useControlsTabFromUrl = () => {
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: DEFAULT_TAB,
    parse: value => {
      // Synchronously validate the tab value, and if it's invalid, fallback to the default tab
      if (!TABS.includes(value)) {
        console.warn(`Invalid tab value: ${value}. Falling back to default.`);
        return DEFAULT_TAB;
      }
      return value;
    }
  });
  const handleSetTab = tab => {
    // If the incoming tab is invalid, fallback to the default tab
    if (!TABS.includes(tab)) {
      console.warn(`Invalid tab value: ${tab}. Falling back to default.`);
      setTab(DEFAULT_TAB);
      return;
    }
    setTab(tab);
  };
  return {
    tab,
    handleSetTab
  };
};
//# sourceMappingURL=use-controls-tab-from-url.js.map