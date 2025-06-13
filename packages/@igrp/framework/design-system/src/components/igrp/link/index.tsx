import type { ReactNode } from 'react';
import Link, { type LinkProps } from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { IGRPIcon, type IGRPIconName } from '@/components/igrp/icon';
import { IGRPColors, type IGRPColorRole, type IGRPColorVariants } from '@/lib/colors';
import { cn, igrpColorText, igrpIsExternalUrl } from '@/lib/utils';
import type { IGRPBaseAttributes, IGRPPlacementProps } from '@/types/globals';

const IGRPLinkVariants = cva(
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      size: {
        default: 'text-base',
        sm: 'text-sm',
        lg: 'text-lg',
      },
      underline: {
        none: 'no-underline',
        hover: 'no-underline hover:underline underline-offset-3',
        always: 'underline underline-offset-3 hover:no-underline',
      },
    },
    defaultVariants: {
      size: 'default',
      underline: 'hover',
    },
  },
);

interface IGRPLinkProps
  extends Omit<React.ComponentProps<'a'>, 'href'>,
    Omit<LinkProps, 'href'>,
    Omit<IGRPBaseAttributes, 'ref'>,
    VariantProps<typeof IGRPLinkVariants> {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
  onClick?: () => void;
  variant?: IGRPColorRole;
  color?: IGRPColorVariants;
}

function IGRPLink({
  href,
  children,
  className,
  target,
  onClick,
  size,
  underline,
  showIcon = true,
  iconName = 'ArrowRight',
  iconPlacement = 'start',
  iconClassName,
  iconSize,
  variant,
  color = 'primary',
  ...props
}: IGRPLinkProps) {
  const isExternal = igrpIsExternalUrl(href);
  const colorLink = variant ? IGRPColors[variant][color] : igrpColorText(color);
  const linkClass = cn(IGRPLinkVariants({ size, underline }), colorLink, className);

  const getIconSize = iconSize || (size === 'lg' ? 20 : size === 'default' ? 16 : 14);

  if (isExternal) {
    return (
      <a
        href={href}
        className={linkClass}
        target={target || '_blank'}
        rel='noopener noreferrer'
        onClick={onClick}
        {...props}
      >
        <IGRPLinkRender
          iconName={iconName}
          iconClassName={iconClassName}
          iconPlacement={iconPlacement}
          sizeIcon={getIconSize}
          showIcon={showIcon}
        >
          {children}
        </IGRPLinkRender>
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={linkClass}
      target={target}
      onClick={onClick}
      {...props}
    >
      <IGRPLinkRender
        iconName={iconName}
        iconClassName={iconClassName}
        iconPlacement={iconPlacement}
        sizeIcon={getIconSize}
        showIcon={showIcon}
      >
        {children}
      </IGRPLinkRender>
    </Link>
  );
}

interface IGRPLinkIconProps {
  showIcon?: boolean;
  iconName: IGRPIconName | string;
  iconClassName?: string;
  iconPlacement?: IGRPPlacementProps;
  sizeIcon: string | number;
  children?: ReactNode;
}

function IGRPLinkRender({
  showIcon,
  iconName,
  iconClassName,
  iconPlacement,
  sizeIcon,
  children,
}: IGRPLinkIconProps) {
  return (
    <div
      className={cn(
        'group flex gap-1 items-center whitespace-nowrap',
        iconPlacement === 'end' && 'flex-row-reverse',
      )}
    >
      {showIcon && iconName && (
        <IGRPIcon
          iconName={iconName}
          className={cn(
            'inline-flex opacity-60 transition-transform group-hover:translate-x-0.5',
            iconClassName,
          )}
          size={sizeIcon}
        />
      )}

      {children}
    </div>
  );
}

export { IGRPLink, IGRPLinkVariants, type IGRPLinkProps };
