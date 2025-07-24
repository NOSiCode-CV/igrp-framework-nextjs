/* eslint-disable react-refresh/only-export-components */
'use client';

import { useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { IGRPBadge } from '@/components/igrp/badge';
import { IGRPIcon, type IGRPIconName } from '@/components/igrp/icon';
import { IGRPColors, type IGRPColorRole, type IGRPColorVariants } from '@/lib/colors';
import { cn } from '@/lib/utils';

const igrpTextlistVariants = cva('', {
  variants: {
    size: {
      sm: 'text-sm',
      default: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    spacing: {
      tight: 'space-y-1',
      normal: 'space-y-2',
      loose: 'space-y-4',
    },
  },
  defaultVariants: {
    size: 'default',
    spacing: 'normal',
  },
});

const igrpTextlistItemVariants = cva('flex items-center gap-2 transition-all duration-200', {
  variants: {
    interactive: {
      true: 'hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md cursor-pointer',
      false: '',
    },
    completed: {
      true: 'opacity-60 line-through',
      false: '',
    },
  },
  defaultVariants: {
    interactive: false,
    completed: false,
  },
});

type IGRPTextListType = 'unordered' | 'ordered' | 'checklist' | 'steps' | 'features' | 'custom';

interface IGRPTextListItem {
  id?: string | number;
  content: React.ReactNode;
  variant?: IGRPColorVariants;
  completed?: boolean;
  disabled?: boolean;
  icon?: IGRPIconName | string;
  iconColor?: IGRPColorVariants;
  badgeText?: string;
  badgeVariant?: IGRPColorRole;
  badgeColor?: IGRPColorVariants;
  subItems?: IGRPTextListItem[];
}

interface IGRPTextListProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof igrpTextlistVariants> {
  items: IGRPTextListItem[];
  type?: IGRPTextListType;
  animate?: boolean;
  interactive?: boolean;
  onItemClick?: (item: IGRPTextListItem, index: number) => void;
  showNumbers?: boolean;
  customIcon?: React.ReactNode;
  maxDepth?: number;
  collapsible?: boolean;
  variant?: IGRPColorVariants;
  iconGlobalColor?: IGRPColorVariants;
}

const getDefaultIcon = (type: IGRPTextListType, iconColor?: IGRPColorVariants, index?: number) => {
  switch (type) {
    case 'checklist':
      return (
        <IGRPIcon
          iconName='Check'
          className={IGRPColors.solid[iconColor || 'success'].text}
        />
      );
    case 'features':
      return (
        <IGRPIcon
          iconName='Star'
          className={IGRPColors.solid[iconColor || 'warning'].text}
        />
      );
    case 'steps':
      return (
        <div
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
            IGRPColors.solid[iconColor || 'info'].alertText,
            IGRPColors.solid[iconColor || 'info'].bg,
          )}
        >
          {(index || 0) + 1}
        </div>
      );
    case 'ordered':
      return (
        <span
          className={cn(
            IGRPColors.outline[iconColor || 'secondary'].textBadge,
            'font-medium min-w-[1.5rem]',
          )}
        >
          {(index || 0) + 1}.
        </span>
      );
    case 'unordered':
      return (
        <IGRPIcon
          iconName='Circle'
          className={cn(
            IGRPColors.outline[iconColor || 'secondary'].textBadge,
            'h-1.5 w-1.5 fill-current',
          )}
        />
      );
    default:
      return (
        <IGRPIcon
          iconName='ArrowRight'
          className={cn(IGRPColors.outline[iconColor || 'secondary'].textBadge)}
        />
      );
  }
};

function IGRPTextList({
  items,
  type = 'unordered',
  animate = false,
  interactive = false,
  onItemClick,
  customIcon,
  maxDepth = 3,
  collapsible = false,
  variant = 'primary',
  iconGlobalColor,
  size,
  spacing,
  className,
  ...props
}: IGRPTextListProps) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const [collapsedItems, setCollapsedItems] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    if (animate) {
      items.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => new Set([...prev, index]));
        }, index * 100);
      });
    } else {
      setVisibleItems(new Set(items.map((_, index) => index)));
    }
  }, [items, animate]);

  const toggleCollapse = (itemId: string | number) => {
    if (!collapsible) return;

    setCollapsedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const renderListItem = (item: IGRPTextListItem, index: number, depth = 0) => {
    const isVisible = visibleItems.has(index);
    const isCollapsed = collapsible && item.id && collapsedItems.has(item.id);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const shouldShowSubItems = hasSubItems && !isCollapsed && depth < maxDepth;

    const itemIcon =
      (item.icon && (
        <IGRPIcon
          iconName={item.icon}
          className={IGRPColors.outline[iconGlobalColor || item.iconColor || 'secondary'].textBadge}
        />
      )) ||
      customIcon ||
      getDefaultIcon(type, iconGlobalColor || item.iconColor, index);

    const handleItemClick = () => {
      if (item.disabled) return;

      if (collapsible && hasSubItems && item.id) {
        toggleCollapse(item.id);
      }

      if (onItemClick && !item.disabled) {
        onItemClick(item, index);
      }
    };

    return (
      <div
        key={item.id || index}
        className={cn('transition-all duration-300', {
          'opacity-0 translate-x-4': animate && !isVisible,
          'opacity-100 translate-x-0': !animate || isVisible,
        })}
      >
        <div
          className={cn(
            igrpTextlistItemVariants({
              interactive: interactive || collapsible,
              completed: item.completed,
            }),
            item.disabled && 'opacity-50 cursor-not-allowed',
            depth > 0 && 'ml-6',
          )}
          onClick={handleItemClick}
        >
          {/* Icon */}
          <div className='flex-shrink-0 mt-0.5'>{itemIcon}</div>

          {/* Content */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2'>
              <div className={cn('flex-1', item.variant && IGRPColors.solid[item.variant].text)}>
                {item.content}
              </div>

              {/* Badge */}
              {item.badgeText && (
                <IGRPBadge
                  variant={item.badgeVariant || 'soft'}
                  color={item.badgeColor || 'secondary'}
                  size='sm'
                  badgeClassName='px-2 py-1'
                >
                  {item.badgeText}
                </IGRPBadge>
              )}

              {/* Collapse indicator */}
              {collapsible && hasSubItems && (
                <div
                  className={cn(
                    'transition-transform duration-200 rotate-90',
                    isCollapsed && 'rotate-0',
                  )}
                >
                  <IGRPIcon
                    iconName='ArrowRight'
                    className={cn(IGRPColors.outline.secondary.textBadge)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-items */}
        {shouldShowSubItems && (
          <div>
            {item.subItems!.map((subItem, subIndex) =>
              renderListItem(subItem, subIndex, depth + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  const Component = type === 'ordered' ? 'ol' : 'ul';
  const colorClass = IGRPColors.solid[variant];

  return (
    <Component
      className={cn(
        igrpTextlistVariants({ size, spacing }),
        colorClass.text,
        colorClass.textDark,
        className,
      )}
      {...props}
    >
      {items.map((item, index) => renderListItem(item, index))}
    </Component>
  );
}

const igrpCreateListItem = (
  content: React.ReactNode,
  options?: Partial<Omit<IGRPTextListItem, 'content'>>,
): IGRPTextListItem => ({
  content,
  ...options,
});

const igrpListItems = {
  withIcon: (
    content: React.ReactNode,
    icon: IGRPIconName | string,
    iconColor?: IGRPColorVariants,
    options?: Partial<IGRPTextListItem>,
  ) => igrpCreateListItem(content, { icon, iconColor, ...options }),

  withSubItems: (
    content: React.ReactNode,
    subItems: IGRPTextListItem[],
    options?: Partial<IGRPTextListItem>,
  ) => igrpCreateListItem(content, { subItems, ...options }),
};

export {
  IGRPTextList,
  type IGRPTextListProps,
  type IGRPTextListType,
  type IGRPTextListItem,
  igrpTextlistVariants,
  igrpTextlistItemVariants,
  igrpCreateListItem,
  igrpListItems,
};
