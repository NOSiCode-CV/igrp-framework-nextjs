'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { type IGRPColorRole, type IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
import { Button } from '../primitives/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../primitives/tabs';
import { IGRPBadge } from './badge';
import { IGRPIcon, type IGRPIconName } from './icon';

const tabListVariants = cva('gap-1.5', {
  variants: {
    variant: {
      default: '',
      outline: 'bg-transparent',
      pills: 'gap-1.5 bg-transparent',
      underline: 'text-foreground h-auto gap-2 rounded-none border-b bg-transparent',
      cards:
        'before:bg-border relative h-auto gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px',
    },
    fullWidth: {
      true: 'w-full',
      false: 'w-fit',
    },
  },
  defaultVariants: {
    variant: 'default',
    fullWidth: false,
  },
});

const tabTriggerVariants = cva('px-4 py-1.5', {
  variants: {
    variant: {
      default: '',
      outline: 'data-[state=active]:bg-muted data-[state=active]:shadow-none',
      pills:
        'data-[state=active]:bg-primary data-[state=active]:text-muted-foreground rounded-full data-[state=active]:shadow-none',
      underline:
        'hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none',
      cards:
        'bg-muted overflow-hidden rounded-b-none border-x border-t py-2 data-[state=active]:z-10 data-[state=active]:shadow-none',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface IGRPTabItem {
  value: string;
  label: string;
  icon?: IGRPIconName;
  content: React.ReactNode;
  disabled?: boolean;
  badgeContent?: string | number;
  badgeVariant?: IGRPColorRole;
  badgeColor?: IGRPColorVariants;
  badgeClassName?: string;
}

interface IGRPTabsProps extends React.ComponentProps<typeof Tabs> {
  items: IGRPTabItem[];
  tabListClassName?: string;
  tabContentClassName?: string;
  tabTriggerClassName?: string;
  showIcon?: boolean;
  iconPlacement?: 'start' | 'end' | 'top';
  showBadge?: boolean;
  badgePlacement?: 'start' | 'end';
  contentBorder?: boolean;
  variant?: VariantProps<typeof tabListVariants>['variant'];
  fullWidth?: boolean;
  id?: string;
  name?: string;
  showScrollIndicators?: boolean;
  scrollButtonClassName?: string;
}

function IGRPTabs({
  items,
  className: tabClassName,
  tabListClassName,
  tabContentClassName,
  tabTriggerClassName,
  showIcon = false,
  iconPlacement = 'start',
  showBadge = false,
  badgePlacement = 'end',
  orientation = 'horizontal',
  contentBorder = false,
  defaultValue,
  value: controlledValue,
  onValueChange,
  variant = 'default',
  fullWidth = false,
  id,
  name,
  showScrollIndicators = true,
  scrollButtonClassName,
  ...restProps
}: IGRPTabsProps) {
  const isControlled = controlledValue !== undefined;

  const initialValue = defaultValue ?? items[0]?.value ?? '';
  const [activeTab, setActiveTab] = useState(initialValue);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const tabsListRef = useRef<HTMLDivElement>(null);

  const currentValue = isControlled ? controlledValue : activeTab;
  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setActiveTab(newValue);
    }
    onValueChange?.(newValue);
  };

  const _id = useId();
  const ref = name ?? id ?? _id;

  const checkScrollability = useCallback(() => {
    if (!tabsListRef.current || orientation === 'vertical') {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = tabsListRef.current;
    const epsilon = 1; // Small threshold for floating point comparison
    setCanScrollLeft(scrollLeft > epsilon);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - epsilon);
  }, [orientation]);

  const scrollToTab = useCallback((direction: 'left' | 'right' | 'start' | 'end') => {
    if (!tabsListRef.current) return;

    const container = tabsListRef.current;
    const scrollAmount = container.clientWidth * 0.7;

    switch (direction) {
      case 'left':
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        break;
      case 'right':
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        break;
      case 'start':
        container.scrollTo({ left: 0, behavior: 'smooth' });
        break;
      case 'end':
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        break;
    }
  }, []);

  const scrollToActiveTab = useCallback(() => {
    if (!tabsListRef.current || orientation === 'vertical') return;

    const container = tabsListRef.current;
    const activeTabElement = container.querySelector(`[data-state="active"]`) as HTMLElement;

    if (!activeTabElement) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTabElement.getBoundingClientRect();

    const scrollLeft = container.scrollLeft;
    const tabLeft = tabRect.left - containerRect.left + scrollLeft;
    const tabRight = tabLeft + tabRect.width;
    const containerScrollLeft = scrollLeft;
    const containerScrollRight = scrollLeft + containerRect.width;
    const padding = 16;

    // Only scroll if tab is not fully visible
    if (tabLeft < containerScrollLeft) {
      container.scrollTo({ left: tabLeft - padding, behavior: 'smooth' });
    } else if (tabRight > containerScrollRight) {
      container.scrollTo({ left: tabRight - containerRect.width + padding, behavior: 'smooth' });
    }
  }, [orientation]);

  // Touch/swipe handlers for mobile - native scrolling handles this, handlers kept for future enhancements
  const handleTouchStart = useCallback((_e: React.TouchEvent) => {
    // Native scroll handles touch scrolling, but we can add custom behavior here if needed
  }, []);

  const handleTouchMove = useCallback((_e: React.TouchEvent) => {
    // Native scroll handles touch scrolling
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Native scroll handles touch scrolling
  }, []);

  useEffect(() => {
    checkScrollability();

    const container = tabsListRef.current;
    if (!container) return;

    container.addEventListener('scroll', checkScrollability);
    const resizeObserver = new ResizeObserver(checkScrollability);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', checkScrollability);
      resizeObserver.disconnect();
    };
  }, [checkScrollability, items.length]);

  useEffect(() => {
    // Scroll to active tab when it changes
    const timeoutId = setTimeout(() => {
      scrollToActiveTab();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [currentValue, scrollToActiveTab]);

  const tabsProps = isControlled
    ? {
        value: currentValue,
        onValueChange: handleValueChange,
      }
    : {
        defaultValue: defaultValue ?? initialValue,
        onValueChange: handleValueChange,
      };

  const isHorizontal = orientation === 'horizontal';
  const showIndicators = showScrollIndicators && isHorizontal && (canScrollLeft || canScrollRight);

  // Handle empty items array
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Tabs
      {...tabsProps}
      className={cn('w-full', orientation === 'vertical' && 'flex-row items-start', tabClassName)}
      orientation={orientation}
      id={ref}
      {...restProps}
    >
      <div
        className={cn(
          'relative flex gap-1.5',
          isHorizontal ? 'items-center w-full' : 'flex-col items-start self-start',
        )}
      >
        {showIndicators && canScrollLeft && (
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              'z-10 shrink-0 bg-background/80 shadow-md backdrop-blur-sm hover:bg-background',
              scrollButtonClassName,
            )}
            onClick={() => scrollToTab('left')}
            aria-label="Scroll tabs left"
            type="button"
          >
            <IGRPIcon iconName="ChevronLeft" size={12} />
          </Button>
        )}
        <div
          ref={tabsListRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={cn(
            isHorizontal &&
              'overflow-x-auto scrollbar-hide scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
            isHorizontal && 'flex-1',
            !isHorizontal && 'w-full',
          )}
        >
          <TabsList
            className={cn(
              orientation === 'vertical' && 'flex-col h-fit',
              tabListVariants({ variant, fullWidth }),
              fullWidth === true && orientation === 'vertical' && 'w-fit',
              isHorizontal && 'w-max',
              tabListClassName,
            )}
          >
            {items.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                className={cn(
                  tabTriggerVariants({ variant }),
                  orientation === 'vertical' && 'w-full justify-start',
                  orientation === 'vertical' &&
                    variant === 'underline' &&
                    'relative after:absolute after:inset-y-0 after:right-0 after:-mr-1 after:w-0.5 after:h-auto',
                  iconPlacement === 'top' && 'flex-col',
                  tabTriggerClassName,
                )}
              >
                {showBadge && item.badgeContent !== undefined && badgePlacement === 'start' && (
                  <IGRPBadge
                    variant={item.badgeVariant}
                    color={item.badgeColor}
                    badgeClassName={item.badgeClassName}
                  >
                    {item.badgeContent}
                  </IGRPBadge>
                )}

                {showIcon && item.icon && iconPlacement === 'start' && (
                  <IGRPIcon iconName={item.icon} />
                )}

                {showIcon && item.icon && iconPlacement === 'top' && (
                  <IGRPIcon iconName={item.icon} />
                )}

                {item.label && <span>{item.label}</span>}

                {showIcon && item.icon && iconPlacement === 'end' && (
                  <IGRPIcon iconName={item.icon} />
                )}

                {showBadge && item.badgeContent !== undefined && badgePlacement === 'end' && (
                  <IGRPBadge
                    variant={item.badgeVariant}
                    color={item.badgeColor}
                    badgeClassName={item.badgeClassName}
                  >
                    {item.badgeContent}
                  </IGRPBadge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {showIndicators && canScrollRight && (
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              'z-10 shrink-0 bg-background/80 shadow-md backdrop-blur-sm hover:bg-background',
              scrollButtonClassName,
            )}
            onClick={() => scrollToTab('right')}
            aria-label="Scroll tabs right"
            type="button"
          >
            <IGRPIcon iconName="ChevronRight" size={12} />
          </Button>
        )}
      </div>

      {items.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          className={cn(
            'p-4 w-full border border-transparent rounded-md',
            contentBorder === true && 'border-border',
            tabContentClassName,
          )}
        >
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export { IGRPTabs, type IGRPTabsProps, type IGRPTabItem };
