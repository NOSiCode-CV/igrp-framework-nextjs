'use client';

import {
  cn,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@igrp/igrp-framework-react-design-system';

import { useIGRPThemeConfig } from '../providers/active-theme.js';

/**
 * A selectable named theme. `value` is the suffix of the `theme-*` class
 * `IGRPActiveThemeProvider` puts on `<body>`, so it must match a theme defined
 * in the app's CSS; `name` is what the user reads.
 */
export interface IGRPThemeOption {
  name: string;
  value: string;
}

/** The themes the design system ships tokens for. */
export const IGRP_DEFAULT_THEMES: IGRPThemeOption[] = [
  { name: 'Padrão', value: 'default' },
  { name: 'Azul', value: 'blue' },
  { name: 'Verde', value: 'green' },
  { name: 'Âmbar', value: 'amber' },
];

/** The same themes at the larger type scale (`theme-scaled`). */
export const IGRP_SCALED_THEMES: IGRPThemeOption[] = [
  { name: 'Padrão', value: 'default-scaled' },
  { name: 'Azul', value: 'blue-scaled' },
  { name: 'Verde', value: 'green-scaled' },
  { name: 'Âmbar', value: 'amber-scaled' },
];

/** pt-PT defaults for the theme selector. Override individually. */
export interface IGRPThemeSelectorLabels {
  /** Screen-reader label of the control. */
  srLabel: string;
  /** Prefix shown beside the value on wide viewports. */
  triggerPrefix: string;
  /** Replaces the prefix on narrow viewports. */
  triggerShort: string;
  /** Placeholder when no theme is selected. */
  placeholder: string;
  /** Heading of the standard group. */
  defaultGroup: string;
  /** Heading of the scaled group. */
  scaledGroup: string;
}

export const IGRP_THEME_SELECTOR_LABELS_PT_PT: IGRPThemeSelectorLabels = {
  srLabel: 'Tema',
  triggerPrefix: 'Selecionar tema:',
  triggerShort: 'Tema',
  placeholder: 'Selecionar tema',
  defaultGroup: 'Padrão',
  scaledGroup: 'Escalado',
};

interface IGRPTemplateThemeSelectorProps {
  /** Standard-scale options. Defaults to {@link IGRP_DEFAULT_THEMES}. */
  themes?: IGRPThemeOption[];
  /** Larger-scale options. Pass `[]` to hide the group entirely. */
  scaledThemes?: IGRPThemeOption[];
  /** Partial override of the pt-PT strings. Missing keys keep their default. */
  labels?: Partial<IGRPThemeSelectorLabels>;
}

function IGRPTemplateThemeSelector({
  themes = IGRP_DEFAULT_THEMES,
  scaledThemes = IGRP_SCALED_THEMES,
  labels: labelOverrides,
}: IGRPTemplateThemeSelectorProps = {}) {
  const { activeTheme, setActiveTheme } = useIGRPThemeConfig();

  const labels = labelOverrides
    ? { ...IGRP_THEME_SELECTOR_LABELS_PT_PT, ...labelOverrides }
    : IGRP_THEME_SELECTOR_LABELS_PT_PT;

  return (
    <div className={cn('flex items-center gap-2')}>
      <Label htmlFor="theme-selector" className={cn('sr-only')}>
        {labels.srLabel}
      </Label>
      <Select value={activeTheme} onValueChange={setActiveTheme}>
        <SelectTrigger
          id="theme-selector"
          size="sm"
          className={cn('justify-start *:data-[slot=select-value]:w-12')}
        >
          <span className={cn('text-muted-foreground hidden sm:block')}>
            {labels.triggerPrefix}
          </span>
          <span className={cn('text-muted-foreground block sm:hidden')}>{labels.triggerShort}</span>
          <SelectValue placeholder={labels.placeholder} />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectLabel>{labels.defaultGroup}</SelectLabel>
            {themes.map((theme) => (
              // Keyed by `value`, not `name`: the two groups share display names
              // by design, and a custom list may repeat one. `value` is the CSS
              // class suffix, so it is unique by construction.
              <SelectItem key={theme.value} value={theme.value}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
          {scaledThemes.length > 0 && (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>{labels.scaledGroup}</SelectLabel>
                {scaledThemes.map((theme) => (
                  <SelectItem key={theme.value} value={theme.value}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export { IGRPTemplateThemeSelector, type IGRPTemplateThemeSelectorProps };
