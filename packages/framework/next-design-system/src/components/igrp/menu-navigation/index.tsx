'use client';

import { useRef, useState, useCallback, createContext, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/horizon/card';
import { IGRPBadge } from '@/components/igrp/badge';
import { IGRPIcon } from '@/components/igrp/icon';
import type { IGRPColorRole, IGRPColorVariants } from '@/lib/colors';
import { cn } from '@/lib/utils';

interface IGRPMenuNavigationItem {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

interface IGRPMenuNavigationProps {
  sections: IGRPMenuNavigationItem[];
  activeSection?: string;
  onSectionChange?: (sectionId: string) => void;
  title?: string;
  badgeContent?: string;
  badgeVariant?: IGRPColorRole;
  badgeColor?: IGRPColorVariants;
  badgeClassName?: string;
  className?: string;
  isStickyTop?: boolean;
  showChevron?: boolean;
}

interface NavigationContextType {
  sectionRefs: React.RefObject<Record<string, HTMLDivElement | null>>;
  scrollToSection: (sectionId: string) => void;
  getSectionRef: (sectionId: string) => (el: HTMLDivElement | null) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

function IGRPMenuNavigationProvider({ children }: { children: React.ReactNode }) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToSection = useCallback((sectionId: string) => {
    const sectionRef = sectionRefs.current[sectionId];
    if (sectionRef) {
      sectionRef.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
  }, []);

  const getSectionRef = useCallback(
    (sectionId: string) => (el: HTMLDivElement | null) => {
      sectionRefs.current[sectionId] = el;
    },
    [],
  );

  return (
    <NavigationContext.Provider value={{ sectionRefs, scrollToSection, getSectionRef }}>
      {children}
    </NavigationContext.Provider>
  );
}

function IGRPMenuNavigation({
  sections,
  activeSection: controlledActiveSection,
  onSectionChange,
  title = 'Navigation',
  badgeContent,
  badgeVariant,
  badgeColor,
  badgeClassName,
  className,
  showChevron = true,
  isStickyTop = false,
}: IGRPMenuNavigationProps) {
  const [internalActiveSection, setInternalActiveSection] = useState(sections[0]?.id || '');
  const navigationContext = useContext(NavigationContext);

  const activeSection = controlledActiveSection ?? internalActiveSection;

  const handleSectionClick = useCallback(
    (sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId);
      if (section?.disabled) return;

      if (controlledActiveSection === undefined) {
        setInternalActiveSection(sectionId);
      }

      onSectionChange?.(sectionId);

      if (navigationContext) {
        navigationContext.scrollToSection(sectionId);
      } else {
        const element = document.querySelector(`[data-section-id='${sectionId}']`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
          });
        }
      }
    },
    [controlledActiveSection, onSectionChange, sections, navigationContext],
  );

  return (
    <div className={cn(isStickyTop && 'sticky top-20', className)}>
      <Card className='shadow-sm gap-0'>
        <CardHeader className='border-b py-3 px-4 gap-0'>
          <div className='flex items-center justify-between'>
            <CardTitle className='font-medium text-sm'>{title}</CardTitle>
            {badgeContent && (
              <IGRPBadge
                variant={badgeVariant}
                color={badgeColor}
                badgeClassName={badgeClassName}
              >
                {badgeContent}
              </IGRPBadge>
            )}
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='divide-y'>
            {sections.map((section) => (
              <button
                key={section.id}
                type='button'
                onClick={() => handleSectionClick(section.id)}
                disabled={section.disabled}
                className={cn(
                  'flex items-center justify-between w-full text-left transition-colors',
                  'py-2.5 px-4 text-sm',
                  section.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  activeSection === section.id
                    ? 'bg-primary/5 text-primary font-medium'
                    : 'hover:bg-muted/30 text-muted-foreground',
                )}
              >
                <div className='flex items-center gap-2'>
                  <IGRPIcon
                    iconName={section.icon}
                    className='h-4 w-4 flex-shrink-0'
                  />
                  <span className='truncate'>{section.label}</span>
                </div>
                {showChevron && (
                  <IGRPIcon
                    iconName='ChevronRight'
                    className={cn(
                      'h-4 w-4 transition-colors flex-shrink-0',
                      activeSection === section.id ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function useIGRPMenuNavigation() {
  const navigationContext = useContext(NavigationContext);

  const getSectionRef = useCallback(
    (sectionId: string) => (el: HTMLDivElement | null) => {
      if (navigationContext) {
        navigationContext.getSectionRef(sectionId)(el);
      }
    },
    [navigationContext],
  );

  const scrollToSection = useCallback(
    (sectionId: string) => {
      if (navigationContext) {
        navigationContext.scrollToSection(sectionId);
      }
    },
    [navigationContext],
  );

  return { getSectionRef, scrollToSection };
}

export {
  IGRPMenuNavigationProvider,
  IGRPMenuNavigation,
  type IGRPMenuNavigationItem,
  type IGRPMenuNavigationProps,
  // eslint-disable-next-line react-refresh/only-export-components
  useIGRPMenuNavigation,
};
