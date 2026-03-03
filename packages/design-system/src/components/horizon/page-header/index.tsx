"use client"

import { type VariantProps } from 'class-variance-authority';
import { useId } from 'react';

import { IGRPPageHeaderBackButton } from './back-button';
import type { IGRPIconName } from '../icon';
import { IGRPHeadline, igrpHeadlineVariants } from '../typography/headline';
import { cn } from '../../../lib/utils';
import { type IGRPBaseAttributes } from '../../../types';

/**
 * Props for the IGRPPageHeader component.
 * @see IGRPPageHeader
 */
interface IGRPPageHeaderProps extends Pick<IGRPBaseAttributes, 'name'> {
  /** Page title. */
  title: string;
  /** Optional description. */
  description?: string;
  /** Headline variant. */
  variant?: VariantProps<typeof igrpHeadlineVariants>['variant'];
  /** Additional CSS classes. */
  className?: string;
  /** CSS classes for the headline. */
  headlineClassName?: string;
  /** Right-side content (e.g. actions). */
  children?: React.ReactNode;
  /** Stick to top when scrolling. */
  isSticky?: boolean;
  /** Show back button. */
  showBackButton?: boolean;
  /** URL for back button (link mode). */
  urlBackButton?: string;
  /** Back button icon. */
  iconBackButton?: IGRPIconName | string;
  /** Back button variant. */
  backButtonVariant?: React.ComponentProps<typeof IGRPPageHeaderBackButton>['variant'];
  /** Back button size. */
  backButtonSize?: React.ComponentProps<typeof IGRPPageHeaderBackButton>['size'];
  /** Back button aria-label. */
  backButtonAriaLabel?: string;
  /** Show text on back button. */
  backButtonShowText?: boolean;
  /** Back button text. */
  backButtonText?: string;
  /** CSS classes for back button. */
  backButtonClassName?: string;
  /** Use browser history back. */
  backButtonUseBrowserBack?: boolean;
  /** Custom back button click handler. */
  backButtonOnClick?: React.ComponentProps<typeof IGRPPageHeaderBackButton>['onClick'];
  /** HTML id attribute. */
  id?: string;
}

/** @internal */
type BackButtonProps = {
  iconBackButton?: IGRPIconName | string;
  backButtonVariant?: React.ComponentProps<typeof IGRPPageHeaderBackButton>['variant'];
  backButtonSize?: React.ComponentProps<typeof IGRPPageHeaderBackButton>['size'];
  backButtonAriaLabel?: string;
  backButtonShowText?: boolean;
  backButtonText?: string;
  backButtonClassName?: string;
  urlBackButton?: string;
  backButtonUseBrowserBack?: boolean;
  backButtonOnClick?: React.ComponentProps<typeof IGRPPageHeaderBackButton>['onClick'];
};

function renderBackButton({
  iconBackButton,
  backButtonVariant,
  backButtonSize,
  backButtonAriaLabel,
  backButtonShowText,
  backButtonText,
  backButtonClassName,
  urlBackButton,
  backButtonUseBrowserBack,
  backButtonOnClick,
}: BackButtonProps) {
  const baseProps = {
    iconName: iconBackButton,
    variant: backButtonVariant,
    size: backButtonSize,
    ariaLabel: backButtonAriaLabel,
    showText: backButtonShowText,
    text: backButtonText,
    className: backButtonClassName,
  };

  // Browser back mode - url must not be passed
  if (backButtonUseBrowserBack) {
    return (
      <IGRPPageHeaderBackButton {...baseProps} useBrowserBack={true} onClick={backButtonOnClick} />
    );
  }

  // Custom onClick handler mode - url must not be passed
  if (backButtonOnClick) {
    return <IGRPPageHeaderBackButton {...baseProps} onClick={backButtonOnClick} />;
  }

  // Link navigation mode (default) - onClick must not be passed
  return <IGRPPageHeaderBackButton {...baseProps} url={urlBackButton} />;
}

/**
 * Page header with title, description, optional back button, and action slot.
 */
function IGRPPageHeader({
  title,
  description,
  variant,
  className,
  headlineClassName,
  children,
  name,
  id,
  isSticky,
  showBackButton,
  urlBackButton,
  iconBackButton,
  backButtonVariant,
  backButtonSize,
  backButtonAriaLabel,
  backButtonShowText,
  backButtonText,
  backButtonClassName,
  backButtonUseBrowserBack,
  backButtonOnClick,
}: IGRPPageHeaderProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4',
        isSticky && 'sticky top-0 z-10 bg-background pt-6 pb-4',
        className,
      )}
      id={ref}
    >
      <div className={cn('flex items-center gap-2')}>
        {showBackButton &&
          renderBackButton({
            iconBackButton,
            backButtonVariant,
            backButtonSize,
            backButtonAriaLabel,
            backButtonShowText,
            backButtonText,
            backButtonClassName,
            urlBackButton,
            backButtonUseBrowserBack,
            backButtonOnClick,
          })}

        <IGRPHeadline
          title={title}
          description={description}
          className={headlineClassName}
          variant={variant}
          name={`h-${name}`}
        />
      </div>

      {children}
    </div>
  );
}

export { IGRPPageHeader, type IGRPPageHeaderProps };
