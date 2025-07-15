"use client";

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button } from "../primitives/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../primitives/dialog";
import { Input } from "../primitives/input";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../primitives/form";
const formSchema = z.object({
  themeName: z.string().min(1, "Theme name cannot be empty.")
});
export function ThemeSaveDialog({
  open,
  onOpenChange,
  onSave,
  isSaving = false,
  initialThemeName = "",
  ctaLabel = "Save Theme",
  title = "Save Theme",
  description = "Enter a name for your theme so you can find it later."
}) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      themeName: initialThemeName
    }
  });
  const onSubmit = values => {
    onSave(values.themeName);
  };
  useEffect(() => {
    if (open) {
      form.reset({
        themeName: initialThemeName
      });
    }
  }, [open, initialThemeName, form]);
  const handleOpenChange = newOpen => {
    onOpenChange(newOpen);
  };
  return /*#__PURE__*/_jsx(Dialog, {
    open: open,
    onOpenChange: handleOpenChange,
    children: /*#__PURE__*/_jsxs(DialogContent, {
      className: "sm:max-w-[550px] p-0 pt-6 overflow-hidden rounded-lg border shadow-lg gap-6",
      children: [/*#__PURE__*/_jsxs(DialogHeader, {
        className: "px-6",
        children: [/*#__PURE__*/_jsx(DialogTitle, {
          children: title
        }), /*#__PURE__*/_jsx(DialogDescription, {
          children: description
        })]
      }), /*#__PURE__*/_jsx(Form, {
        ...form,
        children: /*#__PURE__*/_jsx("form", {
          onSubmit: form.handleSubmit(onSubmit),
          className: "space-y-6 px-6",
          children: /*#__PURE__*/_jsx(FormField, {
            control: form.control,
            name: "themeName",
            render: ({
              field
            }) => /*#__PURE__*/_jsxs(FormItem, {
              children: [/*#__PURE__*/_jsx(FormLabel, {
                children: "Name"
              }), /*#__PURE__*/_jsx(FormControl, {
                children: /*#__PURE__*/_jsx(Input, {
                  placeholder: "My Awesome Theme",
                  ...field
                })
              }), /*#__PURE__*/_jsx(FormMessage, {})]
            })
          })
        })
      }), /*#__PURE__*/_jsx(DialogFooter, {
        className: "bg-muted/30 px-6 py-4 border-t",
        children: /*#__PURE__*/_jsxs("div", {
          className: "flex items-center justify-end w-full gap-2",
          children: [/*#__PURE__*/_jsx(Button, {
            onClick: () => onOpenChange(false),
            variant: "ghost",
            disabled: isSaving,
            size: "sm",
            children: "Cancel"
          }), /*#__PURE__*/_jsx(Button, {
            type: "submit",
            disabled: isSaving || !form.formState.isValid || form.formState.isSubmitting,
            size: "sm",
            onClick: form.handleSubmit(onSubmit),
            children: isSaving || form.formState.isSubmitting ? /*#__PURE__*/_jsxs(_Fragment, {
              children: [/*#__PURE__*/_jsx(Loader2, {
                className: "mr-1 size-4 animate-spin"
              }), "Saving"]
            }) : ctaLabel
          })]
        })
      })]
    })
  });
}
//# sourceMappingURL=theme-save-dialog.js.map