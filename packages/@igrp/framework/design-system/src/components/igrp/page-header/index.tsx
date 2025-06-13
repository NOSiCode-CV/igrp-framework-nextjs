import { type VariantProps } from 'class-variance-authority';
import { IGRPHeadline, igrpHeadlineVariants } from '@/components/igrp/typography/headline';
import { cn } from '@/lib/utils';
import { type IGRPBaseAttributes } from '@/types/globals';
import { IGRPPageHeaderBackButton } from './back-button';
import type { IGRPIconName } from '@/components/igrp/icon';

type IGRPPageHeaderProps = {
  title: string;
  description?: string;
  variant?: VariantProps<typeof igrpHeadlineVariants>['variant'];
  className?: string;
  headlineClassName?: string;
  children?: React.ReactNode;
  isSticky?: boolean;
  showBackButton?: boolean;
  urlBackButton?: string;
  iconBackButton?: IGRPIconName | string;
} & Pick<IGRPBaseAttributes, 'name'>;

function IGRPPageHeader({
  title,
  description,
  variant,
  className,
  headlineClassName,
  children,
  name,
  isSticky,
  showBackButton,
  urlBackButton,
  iconBackButton,
}: IGRPPageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 space-y-2 sm:space-y-0 px-4',
        isSticky && 'sticky top-0 z-10 bg-background pt-6 pb-4',
        className,
      )}
      id={name}
    >
      <div className='flex items-center gap-2'>
        {showBackButton && (
          <IGRPPageHeaderBackButton
            url={urlBackButton}
            iconName={iconBackButton}
          />
        )}

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
