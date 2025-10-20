import Image from 'next/image';
import { cn } from '../../../lib/utils';
import type { IGRPImageAttributes, IGRPRoundSize } from '../../../types';
import { AspectRatio } from '../../primitives/aspect-ratio';

interface IGRPImageProps extends IGRPImageAttributes {
  src: string;
  alt: string;
  className: string;
  ratio: number;
  width: number;
  height: number;
  borderRadius?: IGRPRoundSize;

}

function IGRPImage({ src, alt,ratio, className, borderRadius, width, height }: IGRPImageProps) {
		
	const ratioNumber = {
		'1/1':1/1,
		'4/3':4/3,
		'16/9':16/9 ,
		'21/9':21/9,
	}[ratio]
  var useFill = !width;

	const imageClasses = cn('object-cover object-center', borderRadius, className);
  const Img = useFill ? (
    <Image
      src={src}
      alt={alt}
      fill
      className={imageClasses}
    />
  ) : (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={imageClasses}
    />
  );

  return <div className="flex justify-center">
		 <AspectRatio ratio={ratioNumber}>{Img}</AspectRatio></div>;
}
export { IGRPImage, type IGRPImageProps };
