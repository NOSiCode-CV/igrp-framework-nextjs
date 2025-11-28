'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { useId, useState } from 'react';

import { type IGRPColorRole, type IGRPColorVariants } from '../../lib/colors';
import { cn } from '../../lib/utils';
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
  ...restProps
}: IGRPTabsProps) {
  const isControlled = controlledValue !== undefined;

  const initialValue = defaultValue ?? items[0]?.value ?? '';
  const [activeTab, setActiveTab] = useState(initialValue);

  const currentValue = isControlled ? controlledValue : activeTab;
  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setActiveTab(newValue);
    }
    onValueChange?.(newValue);
  };

  const _id = useId();
  const ref = name ?? id ?? _id;

  const tabsProps = isControlled
    ? {
        value: currentValue,
        onValueChange: handleValueChange,
      }
    : {
        defaultValue: defaultValue ?? initialValue,
        onValueChange: handleValueChange,
      };

  return (
    <Tabs
      {...tabsProps}
      className={cn('w-full', orientation === 'vertical' && 'flex-row', tabClassName)}
      orientation={orientation}
      id={ref}
      {...restProps}
    >
      <TabsList
        className={cn(
          orientation === 'vertical' && 'flex-col',
          tabListVariants({ variant, fullWidth }),
          fullWidth === true && orientation === 'vertical' && 'w-fit',
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

            {showIcon && item.icon && iconPlacement === 'top' && <IGRPIcon iconName={item.icon} />}

            {item.label && <span>{item.label}</span>}

            {showIcon && item.icon && iconPlacement === 'end' && <IGRPIcon iconName={item.icon} />}

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
