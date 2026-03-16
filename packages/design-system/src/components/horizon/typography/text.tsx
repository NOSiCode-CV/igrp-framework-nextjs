/* eslint-disable react-refresh/only-export-components */
'use client';

import { useEffect, useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { IGRPColors, type IGRPColorVariants } from '../../../lib/colors';
import { cn } from '../../../lib/utils';

const igrpTextVariants = cva('transition-all duration-300 ease-in-out', {
  variants: {
    size: {
      sm: 'text-sm leading-5',
      default: 'text-base leading-6',
      lg: 'text-lg leading-7',
      xl: 'text-xl leading-8',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
    spacing: {
      tight: 'mb-2',
      normal: 'mb-4',
      loose: 'mb-6',
      none: 'mb-0',
    },
  },
  defaultVariants: {
    size: 'default',
    weight: 'normal',
    align: 'left',
    spacing: 'tight',
  },
});

/**
 * Props for the IGRPText component.
 * @see IGRPText
 */
interface IGRPTextProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof igrpTextVariants> {
  /** Text content. */
  children: React.ReactNode;
  /** Color variant. */
  variant?: IGRPColorVariants;
  /** Animate on scroll into view. */
  animate?: boolean;
  /** Truncate with ellipsis. */
  truncate?: boolean;
  /** Max lines before truncation. */
  maxLines?: number;
  /** Strings to highlight. */
  highlight?: string[];
  /** HTML element to render as. */
  as?: 'p' | 'span' | 'div';
  /** HTML name attribute. */
  name?: string;
}

/**
 * Text with size, weight, alignment, and optional highlight/truncate.
 */
function IGRPText({
  children,
  variant = 'primary',
  size,
  weight,
  align,
  spacing,
  animate = false,
  truncate = false,
  maxLines,
  highlight = [],
  as: Component = 'div',
  className,
  name,
  id,
  ...props
}: IGRPTextProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const [isVisible, setIsVisible] = useState(!animate);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  const processText = (text: string) => {
    if (highlight.length === 0) return text;

    let processedText = text;
    highlight.forEach((term) => {
      const regex = new RegExp(`(${term})`, 'gi');
      processedText = processedText.replace(
        regex,
        `<mark class='bg-yellow-200 dark:bg-yellow-800 px-1 rounded'>$1</mark>`,
      );
    });
    return processedText;
  };

  const renderContent = () => {
    if (typeof children === 'string') {
      const processedText = processText(children);
      return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
    }
    return children;
  };

  const truncateStyles = truncate
    ? maxLines
      ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }
      : {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' as const,
        }
    : {};

  const colorClass = IGRPColors['solid'][variant];

  return (
    <Component
      className={cn(
        igrpTextVariants({ size, weight, align, spacing }),
        colorClass.text,
        animate && !isVisible && 'opacity-0 translate-y-4',
        animate && isVisible && 'opacity-100 translate-y-0',
        className,
      )}
      style={truncateStyles}
      id={ref}
      {...props}
    >
      {renderContent()}
    </Component>
  );
}

export { IGRPText, type IGRPTextProps, igrpTextVariants };
