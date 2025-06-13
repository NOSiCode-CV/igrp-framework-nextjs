'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { IGRPIcon } from '@/components/igrp/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import { icons } from 'lucide-react';

const breadcrumbVariants = cva('flex flex-wrap items-center', {
  variants: {
    variant: {
      default: '',
      outline: 'p-2 border rounded-md',
      card: 'p-3 bg-card text-card-foreground shadow-sm rounded-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface IGRPBreadcrumbProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof breadcrumbVariants> {
  separator?: React.ReactNode;
  collapsed?: boolean;
  maxItems?: number;
  homeIcon?: boolean;
  homeHref?: string;
  homeLabel?: string;
  iconName?: keyof typeof icons;
  size?: 'sm' | 'md' | 'lg';
}

interface IGRPBreadcrumbItemType {
  label: string;
  href?: string;
  iconName?: keyof typeof icons;
  showIcon?: boolean;
  current?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
}

const IGRPBreadcrumbContext = React.createContext<{
  separator?: React.ReactNode;
  collapsed?: boolean;
  maxItems?: number;
  size?: 'sm' | 'md' | 'lg';
  homeIcon?: boolean;
}>({});

const IGRPBreadcrumb = React.forwardRef<
  HTMLElement,
  IGRPBreadcrumbProps & {
    items?: IGRPBreadcrumbItemType[];
  }
>(
  (
    {
      className,
      separator = (
        <IGRPIcon
          iconName='ChevronRight'
          className='h-4 w-4'
        />
      ),
      collapsed = false,
      maxItems = 5,
      size = 'md',
      variant = 'default',
      homeIcon = false,
      homeHref = '/',
      homeLabel = 'Home',
      iconName,
      items,
      ...props
    },
    ref,
  ) => {
    const getIconSize = () => {
      switch (size) {
        case 'sm':
          return 'h-3 w-3';
        case 'lg':
          return 'h-5 w-5';
        default:
          return 'h-4 w-4';
      }
    };

    const renderItems = () => {
      if (!items || items.length === 0) return null;

      if (!collapsed || items.length <= maxItems) {
        return items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <IGRPBreadcrumbSeparator />}
            <IGRPBreadcrumbItem
              showIcon={item.showIcon}
              iconName={item.iconName}
              current={item.current}
            >
              {item.current ? (
                <IGRPBreadcrumbPage color={item.color || 'primary'}>
                  {item.label}
                </IGRPBreadcrumbPage>
              ) : (
                <IGRPBreadcrumbLink href={item.href || '#'}>{item.label}</IGRPBreadcrumbLink>
              )}
            </IGRPBreadcrumbItem>
          </React.Fragment>
        ));
      }

      const firstItem = items[0];
      const lastItems = items.slice(-2);
      const middleItems = items.slice(1, -2);

      return (
        <>
          <IGRPBreadcrumbItem
            showIcon={firstItem.showIcon}
            iconName={firstItem.iconName}
          >
            <IGRPBreadcrumbLink href={firstItem.href || '#'}>{firstItem.label}</IGRPBreadcrumbLink>
          </IGRPBreadcrumbItem>
          <IGRPBreadcrumbSeparator />
          <IGRPBreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger className='flex items-center gap-1'>
                <BreadcrumbEllipsis />
                <span className='sr-only'>Toggle menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                {middleItems.map((item, index) => (
                  <DropdownMenuItem
                    key={index}
                    asChild
                  >
                    <a
                      href={item.href || '#'}
                      className='flex items-center gap-2'
                    >
                      {item.showIcon && item.iconName && (
                        <IGRPIcon
                          iconName={item.iconName}
                          className={getIconSize()}
                        />
                      )}
                      {item.label}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </IGRPBreadcrumbItem>
          <IGRPBreadcrumbSeparator />

          {/* Last items */}
          {lastItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <IGRPBreadcrumbSeparator />}
              <IGRPBreadcrumbItem
                showIcon={item.showIcon}
                iconName={item.iconName}
                current={item.current}
              >
                {item.current ? (
                  <IGRPBreadcrumbPage color={item.color || 'primary'}>
                    {item.label}
                  </IGRPBreadcrumbPage>
                ) : (
                  <IGRPBreadcrumbLink href={item.href || '#'}>{item.label}</IGRPBreadcrumbLink>
                )}
              </IGRPBreadcrumbItem>
            </React.Fragment>
          ))}
        </>
      );
    };

    const iconSize = getIconSize();

    return (
      <IGRPBreadcrumbContext.Provider value={{ separator, collapsed, maxItems, size, homeIcon }}>
        <nav
          ref={ref}
          aria-label='breadcrumb'
          className={cn(breadcrumbVariants({ variant }), className)}
          {...props}
        >
          <ol
            className={cn(
              'flex flex-wrap items-center',
              size === 'sm'
                ? 'gap-1 text-xs'
                : size === 'lg'
                  ? 'gap-3 text-base'
                  : 'gap-1.5 sm:gap-2.5 text-sm',
            )}
          >
            {homeIcon && (
              <li className='inline-flex items-center'>
                <a
                  href={homeHref}
                  className='text-muted-foreground hover:text-foreground flex items-center'
                  aria-label={homeLabel}
                >
                  {iconName ? (
                    <IGRPIcon
                      iconName={iconName}
                      className={iconSize}
                    />
                  ) : (
                    <IGRPIcon
                      iconName='House'
                      className={iconSize}
                    />
                  )}
                </a>
                <span
                  role='presentation'
                  aria-hidden='true'
                  className={cn(
                    'text-muted-foreground',
                    size === 'sm' ? 'mx-1' : size === 'lg' ? 'mx-2' : 'mx-1.5',
                  )}
                >
                  {separator}
                </span>
              </li>
            )}
            {items ? renderItems() : props.children}
          </ol>
        </nav>
      </IGRPBreadcrumbContext.Provider>
    );
  },
);
IGRPBreadcrumb.displayName = 'Breadcrumb';

const IGRPBreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.OlHTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => {
  const { size } = React.useContext(IGRPBreadcrumbContext);
  const sizeClasses =
    size === 'sm'
      ? 'gap-1 text-xs'
      : size === 'lg'
        ? 'gap-3 text-base'
        : 'gap-1.5 sm:gap-2.5 text-sm';

  return (
    <ol
      ref={ref}
      className={cn('flex flex-wrap items-center', sizeClasses, className)}
      {...props}
    />
  );
});
IGRPBreadcrumbList.displayName = 'IGRPBreadcrumbList';

export interface IGRPBreadcrumbItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  current?: boolean;
  showIcon?: boolean;
  iconName?: keyof typeof icons;
}

const IGRPBreadcrumbItem = React.forwardRef<HTMLLIElement, IGRPBreadcrumbItemProps>(
  ({ className, current, showIcon, iconName, children, ...props }, ref) => {
    const { size } = React.useContext(IGRPBreadcrumbContext);
    const gapClass = size === 'sm' ? 'gap-1' : size === 'lg' ? 'gap-2' : 'gap-1.5';
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    const iconMargin = size === 'sm' ? 'mr-1' : size === 'lg' ? 'mr-2' : 'mr-1.5';

    return (
      <li
        ref={ref}
        className={cn('inline-flex items-center', gapClass, className)}
        aria-current={current ? 'page' : undefined}
        {...props}
      >
        {showIcon && iconName && (
          <IGRPIcon
            iconName={iconName}
            className={cn(iconMargin, iconSize)}
          />
        )}
        {children}
      </li>
    );
  },
);
IGRPBreadcrumbItem.displayName = 'BreadcrumbItem';

const IGRPBreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    asChild?: boolean;
    iconName?: keyof typeof icons;
    showIcon?: boolean;
  }
>(({ className, asChild = false, iconName, showIcon, children, ...props }, ref) => {
  const Component = asChild ? Slot : 'a';
  const { size } = React.useContext(IGRPBreadcrumbContext);

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const iconMargin = size === 'sm' ? 'mr-1' : size === 'lg' ? 'mr-2' : 'mr-1.5';

  return (
    <Component
      ref={ref}
      className={cn(
        'font-medium underline-offset-4 hover:text-foreground hover:underline flex items-center',
        className,
      )}
      {...props}
    >
      {showIcon && iconName && (
        <IGRPIcon
          iconName={iconName}
          className={cn(iconMargin, iconSize)}
        />
      )}
      {children}
    </Component>
  );
});
IGRPBreadcrumbLink.displayName = 'IGRPBreadcrumbLink';

const IGRPBreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    iconName?: keyof typeof icons;
    showIcon?: boolean;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  }
>(({ className, iconName, showIcon, color = 'primary', children, ...props }, ref) => {
  const { size } = React.useContext(IGRPBreadcrumbContext);

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const iconMargin = size === 'sm' ? 'mr-1' : size === 'lg' ? 'mr-2' : 'mr-1.5';
  const colorClass =
    color === 'secondary'
      ? 'text-secondary'
      : color === 'success'
        ? 'text-success'
        : color === 'warning'
          ? 'text-warning'
          : color === 'destructive'
            ? 'text-destructive'
            : 'text-primary';

  return (
    <span
      ref={ref}
      role='link'
      aria-disabled='true'
      aria-current='page'
      className={cn('font-semibold flex items-center', colorClass, className)}
      {...props}
    >
      {showIcon && iconName && (
        <IGRPIcon
          iconName={iconName}
          className={cn(iconMargin, iconSize)}
        />
      )}
      {children}
    </span>
  );
});
IGRPBreadcrumbPage.displayName = 'IGRPBreadcrumbPage';

const IGRPBreadcrumbSeparator = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  const { separator, size } = React.useContext(IGRPBreadcrumbContext);
  const sizeClass = size === 'sm' ? 'mx-1' : size === 'lg' ? 'mx-2' : 'mx-1.5';

  return (
    <span
      ref={ref}
      role='presentation'
      aria-hidden='true'
      className={cn('text-muted-foreground', sizeClass, className)}
      {...props}
    >
      {props.children || separator}
    </span>
  );
});
IGRPBreadcrumbSeparator.displayName = 'IGRPBreadcrumbSeparator';

const BreadcrumbEllipsis = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    const { size } = React.useContext(IGRPBreadcrumbContext);
    const containerSize = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

    return (
      <span
        ref={ref}
        role='presentation'
        aria-hidden='true'
        className={cn(
          'flex items-center justify-center text-muted-foreground',
          containerSize,
          className,
        )}
        {...props}
      >
        <IGRPIcon
          iconName='Ellipsis'
          className={iconSize}
        />
        <span className='sr-only'>More</span>
      </span>
    );
  },
);
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

export {
  IGRPBreadcrumb,
  IGRPBreadcrumbList,
  IGRPBreadcrumbItem,
  IGRPBreadcrumbLink,
  IGRPBreadcrumbPage,
  IGRPBreadcrumbSeparator,
  BreadcrumbEllipsis,
};
