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

import { useIGRPThemeConfig } from '../providers/active-theme';

const DEFAULT_THEMES = [
  {
    name: 'Default',
    value: 'default',
  },
  {
    name: 'Blue',
    value: 'blue',
  },
  {
    name: 'Green',
    value: 'green',
  },
  {
    name: 'Amber',
    value: 'amber',
  },
];

const SCALED_THEMES = [
  {
    name: 'Default',
    value: 'default-scaled',
  },
  {
    name: 'Blue',
    value: 'blue-scaled',
  },
  {
    name: 'Green',
    value: 'green-scaled',
  },
  {
    name: 'Amber',
    value: 'amber-scaled',
  },
];

function IGRPTemplateThemeSelector() {
  const { activeTheme, setActiveTheme } = useIGRPThemeConfig();

  return (
    <div className={cn('flex items-center gap-2')}>
      <Label htmlFor="theme-selector" className={cn('sr-only')}>
        Theme
      </Label>
      <Select value={activeTheme} onValueChange={setActiveTheme}>
        <SelectTrigger
          id="theme-selector"
          size="sm"
          className={cn('justify-start *:data-[slot=select-value]:w-12')}
        >
          <span className={cn('text-muted-foreground hidden sm:block')}>Select a theme:</span>
          <span className={cn('text-muted-foreground block sm:hidden')}>Theme</span>
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectLabel>Default</SelectLabel>
            {DEFAULT_THEMES.map((theme) => (
              <SelectItem key={theme.name} value={theme.value}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Scaled</SelectLabel>
            {SCALED_THEMES.map((theme) => (
              <SelectItem key={theme.name} value={theme.value}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export { IGRPTemplateThemeSelector };
