import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../primitives/dialog";
import { Button } from "../primitives/button";
import { Tabs, TabsContent, TabsList } from "../primitives/tabs";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Check, Copy } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import TabsTriggerPill from "./tabs-trigger-pill";
const mcpConfig = {
  mcpServers: {
    shadcn: {
      command: "npx",
      args: ["-y", "shadcn@canary", "registry:mcp"],
      env: {
        REGISTRY_URL: "https://tweakcn.com/r/themes/registry.json"
      }
    }
  }
};
export function MCPDialog({
  open,
  onOpenChange
}) {
  const {
    hasCopied,
    copyToClipboard
  } = useCopyToClipboard();
  const posthog = usePostHog();
  const handleCopy = async config => {
    copyToClipboard(JSON.stringify(config, null, 2));
    posthog.capture("COPY_MCP_SETUP");
  };
  return /*#__PURE__*/_jsx(Dialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: /*#__PURE__*/_jsxs(DialogContent, {
      className: "sm:max-w-4xl p-0 py-6 overflow-hidden rounded-lg border shadow-lg gap-6",
      children: [/*#__PURE__*/_jsxs(DialogHeader, {
        className: "px-6",
        children: [/*#__PURE__*/_jsx(DialogTitle, {
          children: "Setup MCP"
        }), /*#__PURE__*/_jsx(DialogDescription, {
          children: "Use the code below to configure the registry in your IDE."
        })]
      }), /*#__PURE__*/_jsx("div", {
        className: "px-6",
        children: /*#__PURE__*/_jsxs(Tabs, {
          defaultValue: "cursor",
          className: "w-full",
          children: [/*#__PURE__*/_jsxs(TabsList, {
            className: "inline-flex w-fit items-center justify-center rounded-full bg-background px-0 mb-2 text-muted-foreground",
            children: [/*#__PURE__*/_jsx(TabsTriggerPill, {
              value: "cursor",
              children: "Cursor"
            }), /*#__PURE__*/_jsx(TabsTriggerPill, {
              value: "windsurf",
              children: "Windsurf"
            })]
          }), /*#__PURE__*/_jsxs("div", {
            className: "flex-1 min-h-0 flex flex-col rounded-lg border overflow-hidden",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "flex-none flex justify-between items-center px-4 py-2 border-b bg-muted/50",
              children: [/*#__PURE__*/_jsx(TabsContent, {
                value: "cursor",
                className: "contents",
                children: /*#__PURE__*/_jsxs("p", {
                  className: "text-sm font-medium text-muted-foreground",
                  children: ["Copy and paste the code into", " ", /*#__PURE__*/_jsx("span", {
                    className: "bg-muted rounded-md px-1 text-foreground",
                    children: ".cursor/mcp.json"
                  })]
                })
              }), /*#__PURE__*/_jsx(TabsContent, {
                value: "windsurf",
                className: "contents",
                children: /*#__PURE__*/_jsxs("p", {
                  className: "text-sm font-medium text-muted-foreground",
                  children: ["Copy and paste the code into", " ", /*#__PURE__*/_jsx("span", {
                    className: "bg-muted rounded-md px-1 text-foreground",
                    children: ".codeium/windsurf/mcp_config.json"
                  })]
                })
              }), /*#__PURE__*/_jsx(Button, {
                variant: "outline",
                size: "sm",
                onClick: () => handleCopy(mcpConfig),
                className: "h-8",
                "aria-label": hasCopied ? "Copied to clipboard" : "Copy to clipboard",
                children: hasCopied ? /*#__PURE__*/_jsxs(_Fragment, {
                  children: [/*#__PURE__*/_jsx(Check, {
                    className: "size-4"
                  }), /*#__PURE__*/_jsx("span", {
                    className: "sr-only md:not-sr-only",
                    children: "Copied"
                  })]
                }) : /*#__PURE__*/_jsxs(_Fragment, {
                  children: [/*#__PURE__*/_jsx(Copy, {
                    className: "size-4"
                  }), /*#__PURE__*/_jsx("span", {
                    className: "sr-only md:not-sr-only",
                    children: "Copy"
                  })]
                })
              })]
            }), /*#__PURE__*/_jsx("pre", {
              className: "h-full p-4 text-sm",
              children: /*#__PURE__*/_jsx("code", {
                children: JSON.stringify(mcpConfig, null, 2)
              })
            })]
          })]
        })
      })]
    })
  });
}
//# sourceMappingURL=mcp-dialog.js.map