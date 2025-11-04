'use client';

import Image, { type ImageProps } from 'next/image';

import { igrpRounded } from '../../lib/rounded-classes';
import { cn } from '../../lib/utils';
import { AspectRatio } from '../primitives/aspect-ratio';
import type { VariantProps } from 'class-variance-authority';
import { useId } from 'react';

type IGRPRatioType = '1/1' | '4/3' | '16/9' | '21/9';

interface IGRPImageProps extends ImageProps, VariantProps<typeof igrpRounded> {
  className?: string;
  ratio?: IGRPRatioType;
  name?: string;
}

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
