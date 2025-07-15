import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useContrastChecker } from "../../hooks/use-contrast-checker";
import { Button } from "../primitives/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../primitives/dialog";
import { Contrast, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "../primitives/card";
import { Badge } from "../primitives/badge";
import { ScrollArea } from "../primitives/scroll-area";
import { Separator } from "../primitives/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../primitives/tooltip";
const MIN_CONTRAST_RATIO = 4.5;
const ContrastChecker = ({
  currentStyles
}) => {
  const [filter, setFilter] = useState("all");
  const colorPairsToCheck = [
  // Content - Base, background, cards, containers
  {
    id: "base",
    foregroundId: "foreground",
    backgroundId: "background",
    foreground: currentStyles?.["foreground"],
    background: currentStyles?.["background"],
    label: "Base",
    category: "content"
  }, {
    id: "card",
    foregroundId: "card-foreground",
    backgroundId: "card",
    foreground: currentStyles?.["card-foreground"],
    background: currentStyles?.["card"],
    label: "Card",
    category: "content"
  }, {
    id: "popover",
    foregroundId: "popover-foreground",
    backgroundId: "popover",
    foreground: currentStyles?.["popover-foreground"],
    background: currentStyles?.["popover"],
    label: "Popover",
    category: "content"
  }, {
    id: "muted",
    foregroundId: "muted-foreground",
    backgroundId: "muted",
    foreground: currentStyles?.["muted-foreground"],
    background: currentStyles?.["muted"],
    label: "Muted",
    category: "content"
  },
  // Interactive - Buttons, links, actions
  {
    id: "primary",
    foregroundId: "primary-foreground",
    backgroundId: "primary",
    foreground: currentStyles?.["primary-foreground"],
    background: currentStyles?.["primary"],
    label: "Primary",
    category: "interactive"
  }, {
    id: "secondary",
    foregroundId: "secondary-foreground",
    backgroundId: "secondary",
    foreground: currentStyles?.["secondary-foreground"],
    background: currentStyles?.["secondary"],
    label: "Secondary",
    category: "interactive"
  }, {
    id: "accent",
    foregroundId: "accent-foreground",
    backgroundId: "accent",
    foreground: currentStyles?.["accent-foreground"],
    background: currentStyles?.["accent"],
    label: "Accent",
    category: "interactive"
  },
  // Functional - Sidebar, destructive, special purposes
  {
    id: "destructive",
    foregroundId: "destructive-foreground",
    backgroundId: "destructive",
    foreground: currentStyles?.["destructive-foreground"],
    background: currentStyles?.["destructive"],
    label: "Destructive",
    category: "functional"
  }, {
    id: "sidebar",
    foregroundId: "sidebar-foreground",
    backgroundId: "sidebar",
    foreground: currentStyles?.["sidebar-foreground"],
    background: currentStyles?.["sidebar"],
    label: "Sidebar Base",
    category: "functional"
  }, {
    id: "sidebar-primary",
    foregroundId: "sidebar-primary-foreground",
    backgroundId: "sidebar-primary",
    foreground: currentStyles?.["sidebar-primary-foreground"],
    background: currentStyles?.["sidebar-primary"],
    label: "Sidebar Primary",
    category: "functional"
  }, {
    id: "sidebar-accent",
    foregroundId: "sidebar-accent-foreground",
    backgroundId: "sidebar-accent",
    foreground: currentStyles?.["sidebar-accent-foreground"],
    background: currentStyles?.["sidebar-accent"],
    label: "Sidebar Accent",
    category: "functional"
  }];
  const validColorPairsToCheck = colorPairsToCheck.filter(pair => !!pair.foreground && !!pair.background);
  const contrastResults = useContrastChecker(validColorPairsToCheck);
  const getContrastResult = pairId => {
    return contrastResults?.find(res => res.id === pairId);
  };
  const totalIssues = contrastResults?.filter(result => result.contrastRatio < MIN_CONTRAST_RATIO).length;
  const filteredPairs = filter === "all" ? colorPairsToCheck : colorPairsToCheck.filter(pair => {
    const result = getContrastResult(pair.id);
    return result && result.contrastRatio < MIN_CONTRAST_RATIO;
  });
  // Group color pairs by category
  const categoryLabels = {
    content: "Content & Containers",
    interactive: "Interactive Elements",
    functional: "Navigation & Functional"
  };
  const categories = ["content", "interactive", "functional"];
  const groupedPairs = categories.map(category => ({
    category,
    label: categoryLabels[category],
    pairs: filteredPairs.filter(pair => pair.category === category)
  })).filter(group => group.pairs.length > 0);
  return /*#__PURE__*/_jsxs(Dialog, {
    children: [/*#__PURE__*/_jsx(DialogTrigger, {
      asChild: true,
      children: /*#__PURE__*/_jsxs(Button, {
        variant: "ghost",
        size: "sm",
        className: "w-full justify-start px-2",
        children: [/*#__PURE__*/_jsx(Contrast, {
          className: "h-4 w-4"
        }), /*#__PURE__*/_jsx("span", {
          className: "text-sm",
          children: "Contrast"
        })]
      })
    }), /*#__PURE__*/_jsxs(DialogContent, {
      className: "flex max-h-[80vh] max-w-4xl flex-col gap-6 overflow-hidden rounded-lg border p-0 py-6 shadow-lg",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "flex flex-col items-end justify-between gap-4 px-6 sm:flex-row",
        children: [/*#__PURE__*/_jsxs(DialogHeader, {
          children: [/*#__PURE__*/_jsx(DialogTitle, {
            children: "Contrast Checker"
          }), /*#__PURE__*/_jsxs(DialogDescription, {
            children: ["WCAG 2.0 AA requires a contrast ratio of at least ", MIN_CONTRAST_RATIO, ":1", " • ", /*#__PURE__*/_jsx("a", {
              href: "https://www.w3.org/TR/WCAG21/",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "text-primary hover:text-primary/80 underline transition-colors",
              children: "Learn more"
            })]
          })]
        }), /*#__PURE__*/_jsxs("div", {
          className: "hidden items-center gap-2 md:flex",
          children: [/*#__PURE__*/_jsxs(Tooltip, {
            children: [/*#__PURE__*/_jsx(TooltipTrigger, {
              asChild: true
            }), /*#__PURE__*/_jsx(TooltipContent, {
              side: "bottom",
              children: /*#__PURE__*/_jsx("p", {
                className: "text-xs",
                children: "Toggle theme"
              })
            })]
          }), /*#__PURE__*/_jsx(Button, {
            variant: filter === "all" ? "default" : "outline",
            size: "sm",
            onClick: () => setFilter("all"),
            children: "All"
          }), /*#__PURE__*/_jsxs(Button, {
            variant: filter === "issues" ? "default" : "outline",
            size: "sm",
            onClick: () => setFilter("issues"),
            children: [/*#__PURE__*/_jsx(AlertTriangle, {
              className: cn("mr-1 h-3 w-3")
            }), "Issues (", totalIssues, ")"]
          })]
        })]
      }), /*#__PURE__*/_jsx(ScrollArea, {
        className: "relative flex flex-1 flex-col",
        children: /*#__PURE__*/_jsx("div", {
          className: "space-y-6 px-6",
          children: groupedPairs.map(group => /*#__PURE__*/_jsxs("div", {
            className: "space-y-4",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "flex items-center gap-2",
              children: [/*#__PURE__*/_jsx("h2", {
                className: "text-md font-semibold",
                children: group.label
              }), /*#__PURE__*/_jsx(Separator, {
                className: "flex-1"
              })]
            }), /*#__PURE__*/_jsx("div", {
              className: "grid grid-cols-1 gap-4 md:grid-cols-2",
              children: group.pairs.map(pair => {
                const result = getContrastResult(pair.id);
                const isValid = result?.contrastRatio !== undefined && result?.contrastRatio >= MIN_CONTRAST_RATIO;
                const contrastRatio = result?.contrastRatio?.toFixed(2) ?? "N/A";
                return /*#__PURE__*/_jsx(Card, {
                  className: cn("transition-all duration-200", !isValid && "border-dashed"),
                  children: /*#__PURE__*/_jsxs(CardContent, {
                    className: "p-4",
                    children: [/*#__PURE__*/_jsxs("div", {
                      className: "mb-3 flex items-center justify-between",
                      children: [/*#__PURE__*/_jsxs("h3", {
                        className: cn("flex items-center font-medium", !isValid && "text-destructive"),
                        children: [pair.label, !isValid && /*#__PURE__*/_jsx(AlertTriangle, {
                          className: "ml-1 size-3.5"
                        })]
                      }), /*#__PURE__*/_jsx(Badge, {
                        variant: isValid ? "default" : "destructive",
                        className: cn("flex items-center gap-1 text-xs", isValid ? "bg-muted text-muted-foreground" : "bg-destructive text-destructive-foreground"),
                        children: isValid ? /*#__PURE__*/_jsxs(_Fragment, {
                          children: [/*#__PURE__*/_jsx(Check, {
                            className: "h-3 w-3"
                          }), contrastRatio]
                        }) : /*#__PURE__*/_jsxs(_Fragment, {
                          children: [/*#__PURE__*/_jsx(AlertTriangle, {
                            className: "h-3 w-3"
                          }), contrastRatio]
                        })
                      })]
                    }), /*#__PURE__*/_jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [/*#__PURE__*/_jsxs("div", {
                        className: "flex flex-1 flex-col items-center gap-3",
                        children: [/*#__PURE__*/_jsxs("div", {
                          className: "flex w-full items-center gap-3",
                          children: [/*#__PURE__*/_jsx("div", {
                            style: {
                              backgroundColor: pair.background ?? "#000000"
                            },
                            className: "h-12 w-12 flex-shrink-0 rounded-md border shadow-sm"
                          }), /*#__PURE__*/_jsxs("div", {
                            className: "flex flex-col",
                            children: [/*#__PURE__*/_jsx("span", {
                              className: "text-xs font-medium",
                              children: "Background"
                            }), /*#__PURE__*/_jsx("span", {
                              className: "text-muted-foreground font-mono text-xs",
                              children: pair.background
                            })]
                          })]
                        }), /*#__PURE__*/_jsxs("div", {
                          className: "flex w-full items-center gap-3",
                          children: [/*#__PURE__*/_jsx("div", {
                            style: {
                              backgroundColor: pair.foreground ?? "#ffffff"
                            },
                            className: "h-12 w-12 flex-shrink-0 rounded-md border shadow-sm"
                          }), /*#__PURE__*/_jsxs("div", {
                            className: "flex flex-col",
                            children: [/*#__PURE__*/_jsx("span", {
                              className: "text-xs font-medium",
                              children: "Foreground"
                            }), /*#__PURE__*/_jsx("span", {
                              className: "text-muted-foreground font-mono text-xs",
                              children: pair.foreground
                            })]
                          })]
                        })]
                      }), /*#__PURE__*/_jsx("div", {
                        style: {
                          backgroundColor: pair.background ?? "transparent"
                        },
                        className: "flex h-full min-h-[120px] flex-1 items-center justify-center overflow-hidden rounded-lg border shadow-sm",
                        children: pair.foreground && pair.background ? /*#__PURE__*/_jsxs("div", {
                          className: "p-4 text-center",
                          children: [/*#__PURE__*/_jsx("p", {
                            style: {
                              color: pair.foreground
                            },
                            className: "mb-2 text-4xl font-bold tracking-wider",
                            children: "Aa"
                          }), /*#__PURE__*/_jsx("p", {
                            style: {
                              color: pair.foreground
                            },
                            className: "text-sm font-medium",
                            children: "Sample Text"
                          })]
                        }) : /*#__PURE__*/_jsx("p", {
                          className: "text-muted-foreground text-xs",
                          children: "Preview"
                        })
                      })]
                    })]
                  })
                }, pair.id);
              })
            })]
          }, group.category))
        })
      })]
    })]
  });
};
export default ContrastChecker;
//# sourceMappingURL=contrast-checker.js.map