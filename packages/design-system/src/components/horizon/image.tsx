import Image from 'next/image';

import { cn } from '../../lib/utils';
import { AspectRatio } from '../primitives/aspect-ratio';

interface IGRPImageProps extends React.ComponentProps<typeof Image> {
  className?: string;
  ratio?: '1/1' | '4/3' | '16/9' | '21/9';
 // rounded?: IGRPRoundSize;
}

function IGRPImage({
  className,
  ratio = '16/9',
  // rounded,
  fill = false,
  width = 250,
  height = 250,
  ...props
}: IGRPImageProps) {

  const ratioNumber = {
    '1/1': 1 / 1,
    '4/3': 4 / 3,
    '16/9': 16 / 9,
    '21/9': 21 / 9,
  }[ratio]

  return (
    <div className="flex justify-center items-center">
      <AspectRatio ratio={ratioNumber}>
        <Image
          fill={fill}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          {...props}
          className={cn('object-cover object-center', /*rounded,*/ className)}
        />
      </AspectRatio>
    </div>
  )
}

export { IGRPImage, type IGRPImageProps };
