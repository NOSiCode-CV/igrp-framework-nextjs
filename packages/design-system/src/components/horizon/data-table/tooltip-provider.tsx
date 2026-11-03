"use client"

import { IGRPTooltipContext, IGRPTooltipProvider } from "../tooltip.js"

/** @internal Same object as `IGRPTooltipContext`. */
const IGRPDataTableTooltipContext = IGRPTooltipContext

/**
 * Wraps data table row actions with TooltipProvider for consistent tooltip behavior.
 * Use when rendering IGRPDataTableActionTooltip or similar action buttons.
 */
const IGRPDataTableTooltipProvider = IGRPTooltipProvider

export { IGRPDataTableTooltipContext, IGRPDataTableTooltipProvider }
