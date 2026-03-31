#!/usr/bin/env node
/**
 * Migration script: IGRP*Primitive → ComponentName
 *
 * Replaces legacy IGRP primitive component names with the new clean names
 * exported by @igrp/igrp-framework-react-design-system.
 *
 * Usage:
 *   pnpm run migrate:primitives          # dry-run (default)
 *   pnpm run migrate:primitives --apply  # apply changes
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readdirSync, statSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// IGRP*Primitive → ComponentName mapping (order: longest first to avoid partial replacements)
const REPLACEMENTS = [
  // AlertDialog
  ['IGRPAlertDialogDescriptionPrimitive', 'AlertDialogDescription'],
  ['IGRPAlertDialogTriggerPrimitive', 'AlertDialogTrigger'],
  ['IGRPAlertDialogContentPrimitive', 'AlertDialogContent'],
  ['IGRPAlertDialogHeaderPrimitive', 'AlertDialogHeader'],
  ['IGRPAlertDialogFooterPrimitive', 'AlertDialogFooter'],
  ['IGRPAlertDialogTitlePrimitive', 'AlertDialogTitle'],
  ['IGRPAlertDialogCancelPrimitive', 'AlertDialogCancel'],
  ['IGRPAlertDialogActionPrimitive', 'AlertDialogAction'],
  ['IGRPAlertDialogPrimitive', 'AlertDialog'],
  // Form
  ['IGRPFormFieldPrimitive', 'FormField'],
  ['IGRPFormItemPrimitive', 'FormItem'],
  ['IGRPFormLabelPrimitive', 'FormLabel'],
  ['IGRPFormControlPrimitive', 'FormControl'],
  ['IGRPFormMessagePrimitive', 'FormMessage'],
  // DropdownMenu
  ['IGRPDropdownMenuSeparatorPrimitive', 'DropdownMenuSeparator'],
  ['IGRPDropdownMenuContentPrimitive', 'DropdownMenuContent'],
  ['IGRPDropdownMenuTriggerPrimitive', 'DropdownMenuTrigger'],
  ['IGRPDropdownMenuItemPrimitive', 'DropdownMenuItem'],
  ['IGRPDropdownMenuPrimitive', 'DropdownMenu'],
  // Sidebar
  ['IGRPSidebarProviderPrimitive', 'SidebarProvider'],
  ['IGRPSidebarInsetPrimitive', 'SidebarInset'],
  ['IGRPSidebarMenuButtonPrimitive', 'SidebarMenuButton'],
  ['IGRPSidebarMenuItemPrimitive', 'SidebarMenuItem'],
  ['IGRPSidebarTriggerPrimitive', 'SidebarTrigger'],
  ['IGRPSidebarMenuPrimitive', 'SidebarMenu'],
  // Tooltip
  ['IGRPTooltipProviderPrimitive', 'TooltipProvider'],
  ['IGRPTooltipContentPrimitive', 'TooltipContent'],
  ['IGRPTooltipTriggerPrimitive', 'TooltipTrigger'],
  ['IGRPTooltipPrimitive', 'Tooltip'],
  // Card
  ['IGRPCardHeaderPrimitive', 'CardHeader'],
  ['IGRPCardContentPrimitive', 'CardContent'],
  ['IGRPCardTitlePrimitive', 'CardTitle'],
  ['IGRPCardPrimitive', 'Card'],
  // Alert
  ['IGRPAlertDescriptionPrimitive', 'AlertDescription'],
  ['IGRPAlertPrimitive', 'Alert'],
  // Hooks
  ['useIGRPSidebarPrimitive', 'useSidebar'],
  // Other primitives
  ['IGRPSeparatorPrimitive', 'Separator'],
  ['IGRPBadgePrimitive', 'Badge'],
  ['IGRPButtonPrimitive', 'Button'],
  ['IGRPInputPrimitive', 'Input'],
  ['IGRPLabelPrimitive', 'Label'],
];

const IGNORE_DIRS = ['node_modules', 'dist', '.next', '.git', 'coverage', '.turbo', 'scripts'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.md', '.mjs', '.cjs'];

function* walkDir(dir, base = dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    const rel = relative(base, full);
    if (e.isDirectory()) {
      if (!IGNORE_DIRS.includes(e.name)) {
        yield* walkDir(full, base);
      }
    } else if (EXTENSIONS.some((ext) => e.name.endsWith(ext))) {
      yield full;
    }
  }
}

function applyReplacements(content) {
  let result = content;
  for (const [oldName, newName] of REPLACEMENTS) {
    const regex = new RegExp(escapeRegex(oldName), 'g');
    result = result.replace(regex, newName);
  }
  return result;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function migrate(apply = false) {
  const files = [...walkDir(ROOT)];
  let changedCount = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const hasOldNames = REPLACEMENTS.some(([oldName]) => content.includes(oldName));
    if (!hasOldNames) continue;

    const newContent = applyReplacements(content);
    if (newContent === content) continue;

    const relPath = relative(ROOT, file);
    console.log(apply ? `[APPLY] ${relPath}` : `[DRY-RUN] ${relPath}`);
    if (apply) {
      writeFileSync(file, newContent);
    }
    changedCount++;
  }

  return changedCount;
}

const apply = process.argv.includes('--apply');
const count = migrate(apply);

if (count === 0) {
  console.log('No files need migration.');
} else if (!apply) {
  console.log(`\n${count} file(s) would be updated. Run with --apply to apply changes.`);
} else {
  console.log(`\nUpdated ${count} file(s).`);
}
