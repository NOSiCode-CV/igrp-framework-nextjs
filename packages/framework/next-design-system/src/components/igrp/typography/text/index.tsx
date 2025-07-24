'use client';

import { useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { IGRPColors, type IGRPColorVariants } from '@/lib/colors';
import { cn } from '@/lib/utils';

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

interface IGRPTextProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof igrpTextVariants> {
  children: React.ReactNode;
  variant?: IGRPColorVariants;
  animate?: boolean;
  truncate?: boolean;
  maxLines?: number;
  highlight?: string[];
  as?: 'p' | 'span' | 'div';
  name?: string;
}

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
  ...props
}: IGRPTextProps) {
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
        colorClass.textDark,
        animate && !isVisible && 'opacity-0 translate-y-4',
        animate && isVisible && 'opacity-100 translate-y-0',
        className,
      )}
      style={truncateStyles}
      id={name}
      {...props}
    >
      {renderContent()}
    </Component>
  );
}

export {
  IGRPText,
  type IGRPTextProps,
  // eslint-disable-next-line react-refresh/only-export-components
  igrpTextVariants,
};
