'use client';

import { 
  useRef, 
  useState, 
  useCallback, 
  createContext, 
  useContext, 
  useId, 
  useEffect 
} from 'react';

import type { IGRPColorRole, IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../primitives/card';
import { IGRPBadge } from './badge';
import { IGRPIcon } from './icon';

/**
 * Single menu navigation item.
 * @see IGRPMenuNavigation
 */
interface IGRPMenuNavigationItem {
  /** Unique section id. */
  id: string;
  /** Display label. */
  label: string;
  /** Icon name. */
  icon: string;
  /** Whether the item is disabled. */
  disabled?: boolean;
}

/**
 * Props for the IGRPMenuNavigation component.
 * @see IGRPMenuNavigation
 */
interface IGRPMenuNavigationProps {
  /** Navigation sections. */
  sections: IGRPMenuNavigationItem[];
  /** Controlled active section id. */
  activeSection?: string;
  /** Called when the active section changes. */
  onSectionChange?: (sectionId: string) => void;
  /** Navigation title. */
  title?: string;
  /** Badge content. */
  badgeContent?: string;
  /** Badge variant. */
  badgeVariant?: IGRPColorRole;
  /** Badge color. */
  badgeColor?: IGRPColorVariants;
  /** CSS classes for the badge. */
  badgeClassName?: string;
  /** Additional CSS classes. */
  className?: string;
  /** Stick to top when scrolling. */
  isStickyTop?: boolean;
  /** Show chevron on each item. */
  showChevron?: boolean;
  /** HTML id attribute. */
  id?: string;
}

/** @internal */
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

/**
 * Side navigation menu with sections, active state, and scroll-to-section.
 * Use IGRPMenuNavigationProvider for scroll behavior.
 */
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
  id,
}: IGRPMenuNavigationProps) {
  const [internalActiveSection, setInternalActiveSection] = useState(sections[0]?.id || '');
  const navigationContext = useContext(NavigationContext);

  const _id = useId();
  const ref = id ?? _id;

  // Sync internal state when sections change
  useEffect(() => {
    if (controlledActiveSection === undefined && sections.length > 0) {
      const firstSectionId = sections[0]?.id;
      if (firstSectionId && firstSectionId !== internalActiveSection) {
        setInternalActiveSection(firstSectionId);
      }
    }
  }, [sections, controlledActiveSection, internalActiveSection]);

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

  if (sections.length === 0) {
    return null;
  }

  return (
    <nav className={cn(isStickyTop && 'sticky top-20', className)} id={ref} aria-label={title}>
      <Card className={cn('shadow-sm gap-0')}>
        <CardHeader className={cn('border-b py-3 px-4 gap-0')}>
          <div className={cn('flex items-center justify-between')}>
            <CardTitle className={cn('font-medium text-sm')}>{title}</CardTitle>
            {badgeContent && (
              <IGRPBadge
                variant={badgeVariant}
                color={badgeColor}
                badgeClassName={cn(badgeClassName)}
              >
                {badgeContent}
              </IGRPBadge>
            )}
          </div>
        </CardHeader>
        <CardContent className={cn('p-0')}>
          <div className={cn('divide-y')} role="list">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionClick(section.id)}
                disabled={section.disabled}
                aria-current={activeSection === section.id ? 'page' : undefined}
                className={cn(
                  'flex items-center justify-between w-full text-left transition-colors',
                  'py-2.5 px-4 text-sm',
                  section.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  activeSection === section.id
                    ? 'bg-primary/5 text-primary font-medium'
                    : 'hover:bg-muted/30 text-muted-foreground',
                )}
              >
                <div className={cn('flex items-center gap-2')}>
                  <IGRPIcon
                    iconName={section.icon}
                    className={cn('size-4 shrink-0')}
                    aria-hidden="true"
                  />
                  <span className={cn('truncate')}>{section.label}</span>
                </div>
                {showChevron && (
                  <IGRPIcon
                    iconName="ChevronRight"
                    className={cn(
                      'size-4 transition-colors shrink-0',
                      activeSection === section.id ? 'text-primary' : 'text-muted-foreground',
                    )}
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </nav>
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
  useIGRPMenuNavigation,
};
