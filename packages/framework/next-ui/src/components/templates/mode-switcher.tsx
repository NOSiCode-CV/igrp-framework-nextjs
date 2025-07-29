'use client';

import { useCallback } from 'react';
import { useTheme } from 'next-themes';
import { 
  IGRPButton,
  IGRP_META_THEME_COLORS,
  useIGRPMetaColor,
  IGRPIcon 
} from '@igrp/igrp-framework-react-design-system';

function IGRPTemplateModeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { setMetaColor } = useIGRPMetaColor();

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    setMetaColor(
      resolvedTheme === 'dark' ? IGRP_META_THEME_COLORS.light : IGRP_META_THEME_COLORS.dark,
    );
  }, [resolvedTheme, setTheme, setMetaColor]);

  return (
    <IGRPButton variant="ghost" size="icon" className="group/toggle size-6" onClick={toggleTheme}>
      {theme === 'dark' 
        ? (<IGRPIcon iconName="Sun" strokeWidth={2} />)
        : (<IGRPIcon iconName="Moon" strokeWidth={2} />)
      }
      <span className="sr-only">Toggle theme</span>
    </IGRPButton>
  );
}

export { IGRPTemplateModeSwitcher };
