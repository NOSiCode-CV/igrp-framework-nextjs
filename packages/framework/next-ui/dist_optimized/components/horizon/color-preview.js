import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CopyButton } from "./copy-button";
import { Button } from "../primitives/button";
import { Separator } from "../primitives/separator";
import { useColorControlFocus } from "../../store/color-control-focus-store";
import { SquarePen } from "lucide-react";
function ColorPreviewItem({
  label,
  color,
  name
}) {
  const {
    focusColor
  } = useColorControlFocus();
  return /*#__PURE__*/_jsxs("div", {
    className: "group/color-preview hover:bg-muted relative flex items-center gap-4 rounded-md transition-colors",
    children: [/*#__PURE__*/_jsx("div", {
      className: "h-12 w-12 rounded-md border",
      style: {
        backgroundColor: color
      }
    }), /*#__PURE__*/_jsxs("div", {
      className: "flex-1",
      children: [/*#__PURE__*/_jsx("p", {
        className: "text-sm font-medium @max-3xl:text-xs",
        children: label
      }), /*#__PURE__*/_jsx("p", {
        className: "text-muted-foreground text-xs",
        children: color
      })]
    }), /*#__PURE__*/_jsx("div", {
      className: "absolute right-6 hidden rounded-md opacity-0 transition-opacity group-hover/color-preview:opacity-100 md:block",
      children: /*#__PURE__*/_jsx(Button, {
        variant: "ghost",
        size: "icon",
        onClick: () => focusColor(name),
        className: "size-6 [&>svg]:size-3.5",
        children: /*#__PURE__*/_jsx(SquarePen, {})
      })
    }), /*#__PURE__*/_jsx("div", {
      className: "absolute right-1 rounded-md opacity-0 transition-opacity group-hover/color-preview:opacity-100",
      children: /*#__PURE__*/_jsx(CopyButton, {
        textToCopy: color
      })
    })]
  });
}
const ColorPreview = ({
  styles,
  currentMode
}) => {
  if (!styles || !styles[currentMode]) {
    return null;
  }
  return /*#__PURE__*/_jsxs("div", {
    className: "@container grid grid-cols-1 gap-4 md:gap-8",
    children: [/*#__PURE__*/_jsxs("div", {
      className: "space-y-4",
      children: [/*#__PURE__*/_jsx("h3", {
        className: "text-muted-foreground pb-2 text-sm font-semibold",
        children: "Primary Theme Colors"
      }), /*#__PURE__*/_jsxs("div", {
        className: "@6xl grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4",
        children: [/*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Background",
          color: styles[currentMode].background,
          name: "background"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Foreground",
          color: styles[currentMode].foreground,
          name: "foreground"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Primary",
          color: styles[currentMode].primary,
          name: "primary"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Primary Foreground",
          color: styles[currentMode]["primary-foreground"],
          name: "primary-foreground"
        })]
      })]
    }), /*#__PURE__*/_jsx(Separator, {}), /*#__PURE__*/_jsxs("div", {
      className: "space-y-4",
      children: [/*#__PURE__*/_jsx("h3", {
        className: "text-muted-foreground pb-2 text-sm font-semibold",
        children: "Secondary & Accent Colors"
      }), /*#__PURE__*/_jsxs("div", {
        className: "@6xl grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4",
        children: [/*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Secondary",
          color: styles[currentMode].secondary,
          name: "secondary"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Secondary Foreground",
          color: styles[currentMode]["secondary-foreground"],
          name: "secondary-foreground"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Accent",
          color: styles[currentMode].accent,
          name: "accent"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Accent Foreground",
          color: styles[currentMode]["accent-foreground"],
          name: "accent-foreground"
        })]
      })]
    }), /*#__PURE__*/_jsx(Separator, {}), /*#__PURE__*/_jsxs("div", {
      className: "space-y-4",
      children: [/*#__PURE__*/_jsx("h3", {
        className: "text-muted-foreground pb-2 text-sm font-semibold",
        children: "UI Component Colors"
      }), /*#__PURE__*/_jsxs("div", {
        className: "grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4",
        children: [/*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Card",
          color: styles[currentMode].card,
          name: "card"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Card Foreground",
          color: styles[currentMode]["card-foreground"],
          name: "card-foreground"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Popover",
          color: styles[currentMode].popover,
          name: "popover"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Popover Foreground",
          color: styles[currentMode]["popover-foreground"],
          name: "popover-foreground"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Muted",
          color: styles[currentMode].muted,
          name: "muted"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Muted Foreground",
          color: styles[currentMode]["muted-foreground"],
          name: "muted-foreground"
        })]
      })]
    }), /*#__PURE__*/_jsx(Separator, {}), /*#__PURE__*/_jsxs("div", {
      className: "space-y-4",
      children: [/*#__PURE__*/_jsx("h3", {
        className: "text-muted-foreground pb-2 text-sm font-semibold",
        children: "Utility & Form Colors"
      }), /*#__PURE__*/_jsxs("div", {
        className: "grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4",
        children: [/*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Border",
          color: styles[currentMode].border,
          name: "border"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Input",
          color: styles[currentMode].input,
          name: "input"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Ring",
          color: styles[currentMode].ring,
          name: "ring"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Radius",
          color: styles[currentMode].radius,
          name: "radius"
        })]
      })]
    }), /*#__PURE__*/_jsx(Separator, {}), /*#__PURE__*/_jsxs("div", {
      className: "space-y-4",
      children: [/*#__PURE__*/_jsx("h3", {
        className: "text-muted-foreground pb-2 text-sm font-semibold",
        children: "Status & Feedback Colors"
      }), /*#__PURE__*/_jsxs("div", {
        className: "grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4",
        children: [/*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Destructive",
          color: styles[currentMode].destructive,
          name: "destructive"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Destructive Foreground",
          color: styles[currentMode]["destructive-foreground"],
          name: "destructive-foreground"
        })]
      })]
    }), /*#__PURE__*/_jsx(Separator, {}), /*#__PURE__*/_jsxs("div", {
      className: "space-y-4",
      children: [/*#__PURE__*/_jsx("h3", {
        className: "text-muted-foreground pb-2 text-sm font-semibold",
        children: "Chart & Visualization Colors"
      }), /*#__PURE__*/_jsxs("div", {
        className: "grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4",
        children: [/*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Chart 1",
          color: styles[currentMode]["chart-1"],
          name: "chart-1"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Chart 2",
          color: styles[currentMode]["chart-2"],
          name: "chart-2"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Chart 3",
          color: styles[currentMode]["chart-3"],
          name: "chart-3"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Chart 4",
          color: styles[currentMode]["chart-4"],
          name: "chart-4"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Chart 5",
          color: styles[currentMode]["chart-5"],
          name: "chart-5"
        })]
      })]
    }), /*#__PURE__*/_jsx(Separator, {}), /*#__PURE__*/_jsxs("div", {
      className: "space-y-4",
      children: [/*#__PURE__*/_jsx("h3", {
        className: "text-muted-foreground pb-2 text-sm font-semibold",
        children: "Sidebar & Navigation Colors"
      }), /*#__PURE__*/_jsxs("div", {
        className: "grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4",
        children: [/*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Sidebar Background",
          color: styles[currentMode].sidebar,
          name: "sidebar"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Sidebar Foreground",
          color: styles[currentMode]["sidebar-foreground"],
          name: "sidebar-foreground"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Sidebar Primary",
          color: styles[currentMode]["sidebar-primary"],
          name: "sidebar-primary"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Sidebar Primary Foreground",
          color: styles[currentMode]["sidebar-primary-foreground"],
          name: "sidebar-primary-foreground"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Sidebar Accent",
          color: styles[currentMode]["sidebar-accent"],
          name: "sidebar-accent"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Sidebar Accent Foreground",
          color: styles[currentMode]["sidebar-accent-foreground"],
          name: "sidebar-accent-foreground"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Sidebar Border",
          color: styles[currentMode]["sidebar-border"],
          name: "sidebar-border"
        }), /*#__PURE__*/_jsx(ColorPreviewItem, {
          label: "Sidebar Ring",
          color: styles[currentMode]["sidebar-ring"],
          name: "sidebar-ring"
        })]
      })]
    })]
  });
};
export default ColorPreview;
//# sourceMappingURL=color-preview.js.map