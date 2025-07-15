'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Home, Settings, User, FileText, LifeBuoy, LogOut, UserPlus, Search } from 'lucide-react';
import { Button } from '../primitives/button';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '../primitives/command';
// TODO: add messages, and the lis of search, with the respective url
export function IGRPCommandSearch() {
  const $ = _c(23);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      const controller = new AbortController();
      const signal = controller.signal;
      const down = e => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setOpen(_temp);
        }
      };
      document.addEventListener("keydown", down, {
        signal
      });
      return () => {
        controller.abort();
      };
    };
    t1 = [];
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  React.useEffect(t0, t1);
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = command => {
      setOpen(false);
      command();
    };
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const runCommand = t2;
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = () => setOpen(true);
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  let t4;
  if ($[4] !== open || $[5] !== router) {
    let t5;
    if ($[7] !== router) {
      t5 = () => runCommand(() => router.push("/"));
      $[7] = router;
      $[8] = t5;
    } else {
      t5 = $[8];
    }
    let t6;
    if ($[9] !== router) {
      t6 = () => runCommand(() => router.push("/"));
      $[9] = router;
      $[10] = t6;
    } else {
      t6 = $[10];
    }
    let t7;
    if ($[11] !== router) {
      t7 = () => runCommand(() => router.push("/docs"));
      $[11] = router;
      $[12] = t7;
    } else {
      t7 = $[12];
    }
    let t8;
    if ($[13] !== router) {
      t8 = () => runCommand(() => router.push("/settings"));
      $[13] = router;
      $[14] = t8;
    } else {
      t8 = $[14];
    }
    let t9;
    if ($[15] !== router) {
      t9 = () => runCommand(() => router.push("/team/invite"));
      $[15] = router;
      $[16] = t9;
    } else {
      t9 = $[16];
    }
    let t10;
    if ($[17] !== router) {
      t10 = () => runCommand(() => router.push("/profile"));
      $[17] = router;
      $[18] = t10;
    } else {
      t10 = $[18];
    }
    let t11;
    if ($[19] !== router) {
      t11 = () => runCommand(() => router.push("/logout"));
      $[19] = router;
      $[20] = t11;
    } else {
      t11 = $[20];
    }
    let t12;
    if ($[21] !== router) {
      t12 = () => runCommand(() => router.push("/help"));
      $[21] = router;
      $[22] = t12;
    } else {
      t12 = $[22];
    }
    t4 = _jsxs(_Fragment, {
      children: [_jsxs(Button, {
        onClick: t3,
        variant: "outline",
        size: "lg",
        className: "justify-between focus-visible:outline-none focus-visible:ring-1 border-input px-3",
        children: [_jsxs("span", {
          className: "flex items-center ",
          children: [_jsx(Search, {
            className: "mr-1 size-3"
          }), _jsx("span", {
            className: "hidden md:inline-block",
            children: "Search"
          })]
        }), _jsxs("kbd", {
          className: "pointer-events-none select-none flex items-center gap-1 rounded border px-1 py-1 font-mono text-[10px] font-medium",
          children: [_jsx("span", {
            className: "text-xs",
            children: "\u2318"
          }), "K"]
        })]
      }), _jsxs(CommandDialog, {
        open,
        onOpenChange: setOpen,
        children: [_jsx(CommandInput, {
          placeholder: "Type a command or search..."
        }), _jsxs(CommandList, {
          children: [_jsx(CommandEmpty, {
            children: "No results found."
          }), _jsxs(CommandGroup, {
            heading: "Suggestions",
            children: [_jsxs(CommandItem, {
              onSelect: t5,
              children: [_jsx(Home, {
                className: "mr-2"
              }), _jsx("span", {
                children: "Home"
              })]
            }), _jsxs(CommandItem, {
              onSelect: t6,
              children: [_jsx(Home, {
                className: "mr-2"
              }), _jsx("span", {
                children: "Library"
              })]
            }), _jsxs(CommandItem, {
              onSelect: t7,
              children: [_jsx(FileText, {
                className: "mr-2"
              }), _jsx("span", {
                children: "Documentation"
              })]
            }), _jsxs(CommandItem, {
              onSelect: t8,
              children: [_jsx(Settings, {
                className: "mr-2"
              }), _jsx("span", {
                children: "Settings"
              })]
            })]
          }), _jsx(CommandSeparator, {}), _jsx(CommandGroup, {
            heading: "Team",
            children: _jsxs(CommandItem, {
              onSelect: t9,
              children: [_jsx(UserPlus, {
                className: "mr-2"
              }), _jsx("span", {
                children: "Invite Members"
              })]
            })
          }), _jsx(CommandSeparator, {}), _jsxs(CommandGroup, {
            heading: "Profile",
            children: [_jsxs(CommandItem, {
              onSelect: t10,
              children: [_jsx(User, {
                className: "mr-2"
              }), _jsx("span", {
                children: "Profile"
              })]
            }), _jsxs(CommandItem, {
              onSelect: t11,
              children: [_jsx(LogOut, {
                className: "mr-2"
              }), _jsx("span", {
                children: "Logout"
              })]
            })]
          }), _jsx(CommandSeparator, {}), _jsx(CommandGroup, {
            heading: "Support",
            children: _jsxs(CommandItem, {
              onSelect: t12,
              children: [_jsx(LifeBuoy, {
                className: "mr-2"
              }), _jsx("span", {
                children: "Help"
              })]
            })
          })]
        })]
      })]
    });
    $[4] = open;
    $[5] = router;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  return t4;
}
function _temp(open_0) {
  return !open_0;
}
//# sourceMappingURL=command-search.js.map