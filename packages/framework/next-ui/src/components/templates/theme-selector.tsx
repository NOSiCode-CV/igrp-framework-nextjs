'use client';

import {
  IGRPLabelPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectGroupPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectLabelPrimitive,
  IGRPSelectSeparatorPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,  
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
    <div className="flex items-center gap-2">
      <IGRPLabelPrimitive htmlFor="theme-selector" className="sr-only">
        Theme
      </IGRPLabelPrimitive>
      <IGRPSelectPrimitive value={activeTheme} onValueChange={setActiveTheme}>
        <IGRPSelectTriggerPrimitive
          id="theme-selector"
          size="sm"
          className="justify-start *:data-[slot=select-value]:w-12"
        >
          <span className="text-muted-foreground hidden sm:block">Select a theme:</span>
          <span className="text-muted-foreground block sm:hidden">Theme</span>
          <IGRPSelectValuePrimitive placeholder="Select a theme" />
        </IGRPSelectTriggerPrimitive>
        <IGRPSelectContentPrimitive align="end">
          <IGRPSelectGroupPrimitive>
            <IGRPSelectLabelPrimitive>Default</IGRPSelectLabelPrimitive>
            {DEFAULT_THEMES.map((theme) => (
              <IGRPSelectItemPrimitive key={theme.name} value={theme.value}>
                {theme.name}
              </IGRPSelectItemPrimitive>
            ))}
          </IGRPSelectGroupPrimitive>
          <IGRPSelectSeparatorPrimitive />
          <IGRPSelectGroupPrimitive>
            <IGRPSelectLabelPrimitive>Scaled</IGRPSelectLabelPrimitive>
            {SCALED_THEMES.map((theme) => (
              <IGRPSelectItemPrimitive key={theme.name} value={theme.value}>
                {theme.name}
              </IGRPSelectItemPrimitive>
            ))}
          </IGRPSelectGroupPrimitive>
        </IGRPSelectContentPrimitive>
      </IGRPSelectPrimitive>
    </div>
  );
}

export { IGRPTemplateThemeSelector };
