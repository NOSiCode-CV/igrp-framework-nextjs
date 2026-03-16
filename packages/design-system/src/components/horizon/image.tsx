'use client';

import { useId } from 'react';
import Image, { type ImageProps } from 'next/image';

import { igrpRounded } from '../../lib/rounded-classes';
import { cn } from '../../lib/utils';
import { AspectRatio } from '../primitives/aspect-ratio';
import type { VariantProps } from 'class-variance-authority';

/** Aspect ratio options for IGRPImage. */
type IGRPRatioType = '1/1' | '4/3' | '16/9' | '21/9';

/**
 * Props for the IGRPImage component.
 * @see IGRPImage
 */
interface IGRPImageProps extends ImageProps, VariantProps<typeof igrpRounded> {
  /** Additional CSS classes. */
  className?: string;
  /** Aspect ratio when using fill mode. */
  ratio?: IGRPRatioType;
  /** HTML name attribute. */
  name?: string;
}

/**
 * Next.js Image with aspect ratio, rounded variants, and fill support.
 */
function IGRPImage({
  className,
  ratio = '16/9',
  rounded = 'md',
  width,
  height,
  name,
  id,
  ...props
}: IGRPImageProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const ratioNumber = {
    '1/1': 1 / 1,
    '4/3': 4 / 3,
    '16/9': 16 / 9,
    '21/9': 21 / 9,
  }[ratio];

  const useFill = !width && !height;

  const imageElement = (
    <Image
      {...props}
      {...(useFill ? { fill: true } : { width, height })}
      id={ref}
      className={cn('object-cover object-center', igrpRounded({ rounded }), className)}
    />
  );

  if (useFill) {
    return <AspectRatio ratio={ratioNumber}>{imageElement}</AspectRatio>;
  }

  return imageElement;
}

export { IGRPImage, type IGRPImageProps, type IGRPRatioType };
